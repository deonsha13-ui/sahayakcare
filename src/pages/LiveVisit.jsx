import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Mic,
  ArrowLeft,
  Check,
  ShieldAlert,
  Volume2,
  RotateCcw,
  Pencil,
  CheckCircle2,
  ArrowRight,
  Info,
  Radio,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Badge, Waveform, Modal } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
import { fieldLabels, mandatoryFields } from "@/mock/demo";
import { voiceService } from "@/services/voiceService";
import { canConfirm } from "@/utils/visit";

const FIELD_MAP_FROM_BACKEND = {
  beneficiary_id: "beneficiary",
  name: "name",
  age: "age",
  visit_type: "type",
  weight_kg: "weight",
  vaccinations_due: "vaccinations",
  next_visit_date: "next",
};

const languageCodes = {
  English: "en",
  Hindi: "hi",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Malayalam: "ml",
  Bengali: "bn",
  Marathi: "mr",
};

const blank = (scenario = "anc") => ({
  scenario,
  fields: {},
  statuses: {},
  corrections: {},
  transcript: [],
  step: 0,
  danger: null,
});

export default function LiveVisit() {
  const { draft, setDraft, save, settings, visits, notify } = useDemo();
  const navigate = useNavigate();
  const [session, setSessionState] = useState(draft || blank("anc"));
  const [phase, setPhase] = useState("connecting"); // connecting | ready | listening | processing | speaking
  const [review, setReview] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [micStatus, setMicStatus] = useState("Connecting to voice engine...");
  const [typedInput, setTypedInput] = useState("");

  const clientRef = useRef(null);
  const heldRef = useRef(false);
  const sessionRef = useRef(session);
  const savedRef = useRef(false);
  sessionRef.current = session;

  const captured = mandatoryFields.filter(
    (k) => session.fields[k] && session.statuses[k] !== "Needs clarification",
  ).length;

  const complete = captured >= mandatoryFields.length || review;
  const phaseCopy = {
    connecting: "Connecting voice service",
    ready: "Ready to listen",
    listening: "Listening now",
    processing: "Capturing details",
    speaking: "Sahayak is speaking",
  };
  const phaseHint = {
    connecting: "Preparing your secure voice workspace.",
    ready: "Hold the microphone when you are ready to speak.",
    listening: "Release when you have finished your observation.",
    processing: "Matching your words to the visit record.",
    speaking: "You can interrupt when you need to add something.",
  };
  const remainingFields = Math.max(mandatoryFields.length - captured, 0);

  // Initialize live WebSocket client on mount
  useEffect(() => {
    let client;
    try {
      client = voiceService.createClient({
        onEvent: (msg) => {
          handleBackendEvent(msg);
        },
      });
      clientRef.current = client;

      client
        .connect(languageCodes[settings.language] || "en")
        .then(() => {
          setPhase("ready");
          setMicStatus("Voice companion connected. Hold Space or Mic to speak, or click Start Session.");
          // Notify backend of initial visit setup without speaking immediately
          client.startVisit({
            visit_type: sessionRef.current.fields.type || null,
            language: languageCodes[settings.language] || "en",
            beneficiary_id: sessionRef.current.fields.beneficiary || null,
            speak: false,
          });
        })
        .catch((err) => {
          console.warn("WebSocket connect error:", err);
          setPhase("ready");
          setMicStatus("Backend voice offline. Running in manual mode.");
        });
    } catch (err) {
      console.error("Audio initialization error:", err);
      setMicStatus("Microphone access unavailable.");
    }

    return () => {
      if (client) client.disconnect();
    };
  }, []);

  const startSession = () => {
    if (clientRef.current) {
      clientRef.current.startVisit({
        visit_type: session.fields.type || null,
        language: languageCodes[settings.language] || "en",
        beneficiary_id: session.fields.beneficiary || null,
        speak: true,
      });
    }
  };

  const handleBackendEvent = (msg) => {
    switch (msg.type) {
      case "ws_connected":
        setMicStatus("Connected to Gnani voice engine (16kHz STT · 24kHz TTS)");
        break;

      case "ws_disconnected":
        setMicStatus("Disconnected from voice server. Retrying...");
        setPhase("ready");
        break;

      case "language_changed":
        setMicStatus(`Voice language: ${msg.language === "hi" ? "Hindi (हिंदी)" : "English"}`);
        break;

      case "session_started":
      case "session_ready":
        // Transcript updates via agent_text to prevent duplicate/overlapping messages
        break;

      case "agent_text":
      case "assistant_text":
        if (msg.text) {
          addTranscript("agent", msg.text);
        }
        break;

      case "transcript_final":
      case "final_transcript":
        if (msg.text) {
          addTranscript("worker", msg.text);
        }
        break;

      case "field_extracted":
      case "field_updated":
      case "field_update": {
        const fieldName = FIELD_MAP_FROM_BACKEND[msg.field] || msg.field;
        let val = msg.value;
        if (Array.isArray(val)) {
          val = val.length > 0 ? val.join(", ") : "None";
        }
        if (val !== undefined && val !== null) {
          setSessionState((prev) => {
            const nextFields = { ...prev.fields, [fieldName]: String(val) };
            const nextStatuses = {
              ...prev.statuses,
              [fieldName]: msg.type === "field_updated" ? "Corrected" : "Captured",
            };
            const updated = {
              ...prev,
              fields: nextFields,
              statuses: nextStatuses,
            };
            setDraft(updated);
            return updated;
          });
        }
        break;
      }

      case "danger_alert": {
        const phrase = msg.message || msg.label || "Clinical Danger Sign";
        setSessionState((prev) => {
          const updated = { ...prev, danger: phrase };
          setDraft(updated);
          return updated;
        });
        notify(`DANGER SIGN FLAGGED: ${phrase}. Urgent PHC referral mandated.`);
        break;
      }

      case "readback_start":
      case "record_readback": {
        if (msg.record) {
          setSessionState((prev) => {
            const nextFields = { ...prev.fields };
            const nextStatuses = { ...prev.statuses };
            for (const [bk, fk] of Object.entries(FIELD_MAP_FROM_BACKEND)) {
              if (msg.record[bk] !== undefined && msg.record[bk] !== null && msg.record[bk] !== "") {
                let v = msg.record[bk];
                if (Array.isArray(v)) v = v.length > 0 ? v.join(", ") : "None";
                nextFields[fk] = String(v);
                if (!nextStatuses[fk]) nextStatuses[fk] = "Captured";
              }
            }
            const updated = {
              ...prev,
              fields: nextFields,
              statuses: nextStatuses,
            };
            setDraft(updated);
            return updated;
          });
        }
        setReview(true);
        break;
      }

      case "visit_saved":
      case "record_saved":
        save({
          ...sessionRef.current.fields,
          danger: Boolean(sessionRef.current.danger),
          dangerPhrase: sessionRef.current.danger,
          corrections: sessionRef.current.corrections,
          transcript: sessionRef.current.transcript,
        });
        savedRef.current = true;
        notify("Visit confirmed and encrypted into health records.");
        // Allow time for audio confirmation to play completely before redirecting
        setTimeout(() => {
          if (savedRef.current) {
            setReview(false);
            navigate({ to: "/records" });
          }
        }, 4500);
        break;

      case "agent_speaking":
        setPhase(msg.active ? "speaking" : "ready");
        if (!msg.active && savedRef.current) {
          setTimeout(() => {
            setReview(false);
            navigate({ to: "/records" });
          }, 1000);
        }
        break;

      case "error":
        notify(`Server Notice: ${msg.message}`);
        break;

      default:
        break;
    }
  };

  const addTranscript = (who, text) => {
    setSessionState((prev) => {
      // Avoid duplicate consecutive messages
      const last = prev.transcript[prev.transcript.length - 1];
      if (last && last.who === who && last.text === text) return prev;
      const nextTranscript = [...prev.transcript, { who, text }];
      const updated = { ...prev, transcript: nextTranscript };
      setDraft(updated);
      return updated;
    });
  };

  const startTalking = async () => {
    if (heldRef.current) return;
    heldRef.current = true;
    setPhase("listening");
    if (clientRef.current) {
      await clientRef.current.startTalking();
    }
  };

  const stopTalking = () => {
    if (!heldRef.current) return;
    heldRef.current = false;
    setPhase("processing");
    if (clientRef.current) {
      clientRef.current.stopTalking();
    }
  };

  // Keyboard Spacebar listener for Push-to-Talk
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        startTalking();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space" && heldRef.current) {
        e.preventDefault();
        stopTalking();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const reset = (scenario) => {
    heldRef.current = false;
    savedRef.current = false;
    const fresh = blank(scenario);
    setSessionState(fresh);
    setDraft(fresh);
    setPhase("ready");
    setReview(false);
    if (clientRef.current) {
      clientRef.current.startVisit({
        visit_type: fresh.fields.type || "ANC",
        language: languageCodes[settings.language] || "en",
        speak: false,
      });
    }
  };

  const edit = (k) => {
    setEditing(k);
    setEditValue(session.fields[k] || "");
  };

  const updateField = () => {
    if (!editValue.trim() || !editing) return;
    const k = editing;
    const v = editValue.trim();

    setSessionState((prev) => {
      const updated = {
        ...prev,
        fields: { ...prev.fields, [k]: v },
        statuses: { ...prev.statuses, [k]: "Corrected" },
        corrections: { ...prev.corrections, [k]: prev.fields[k] || "Not captured" },
      };
      setDraft(updated);
      return updated;
    });

    // Notify backend WebSocket of manual field correction
    if (clientRef.current) {
      const backendKey =
        Object.keys(FIELD_MAP_FROM_BACKEND).find((bk) => FIELD_MAP_FROM_BACKEND[bk] === k) || k;
      clientRef.current.correctField(backendKey, v);
    }
    setEditing(null);
  };

  const sendTyped = (e) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const text = typedInput.trim();
    setTypedInput("");
    addTranscript("worker", text);
    if (clientRef.current) {
      clientRef.current.sendTextInput(text);
    }
  };

  const confirmAndSave = () => {
    if (clientRef.current) {
      clientRef.current.confirmSave();
    }
    save({
      ...session.fields,
      danger: Boolean(session.danger),
      dangerPhrase: session.danger,
      corrections: session.corrections,
      transcript: session.transcript,
    });
    setReview(false);
    navigate({ to: "/records" });
  };

  const previous = visits.find((v) => v.beneficiary === session.fields.beneficiary);

  return (
    <div className="page live-visit-page">
      <PageHeading
        eyebrow="VOICE-FIRST COMMUNITY CARE"
        title="Live Voice Visit"
        description="Speak naturally with your community. Sahayak captures, verifies, and flags care needs."
        action={
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft /> Back to home
          </Button>
        }
      />

      <div className="visit-toolbar">
        <div>
          <span className={`status-dot ${phase === "speaking" ? "pulse" : ""}`} />{" "}
          {phaseCopy[phase]}
        </div>
        <span className="visit-progress" aria-label={`${captured} of ${mandatoryFields.length} mandatory fields captured`}>
          <strong>{captured}/{mandatoryFields.length}</strong> fields captured
        </span>
        <select
          aria-label="Visit scenario"
          value={session.scenario}
          onChange={(e) => reset(e.target.value)}
        >
          <option value="anc">ANC Home Visit</option>
          <option value="newborn">Newborn Home Visit</option>
          <option value="bleeding">Maternal Emergency (Bleeding)</option>
          <option value="fever">Newborn Sepsis (Fever)</option>
        </select>
        <Button variant="ghost" onClick={() => reset(session.scenario)}>
          <RotateCcw /> Restart
        </Button>
      </div>

      <div className="demo-disclaimer" role="status">
        <Radio size={16} />
        <span><strong>Live voice service</strong> · Prisma STT · Timbre TTS · NHM safety protocols</span>
      </div>

      {session.danger && (
        <div className="danger-alert" role="alert">
          <ShieldAlert size={32} />
          <div>
            <h2>CRITICAL DANGER SIGN FLAGGED — IMMEDIATE PHC REFERRAL</h2>
            <p>Reported symptom: “{session.danger}”</p>
            <strong>
              Under NHM ASHA Protocols (Modules 6 & 7): Advise immediate family transfer to the
              nearest Primary Health Centre. Routine questions paused.
            </strong>
          </div>
          <Button
            variant="destructive"
            onClick={() => setReview(true)}
            aria-label="Open emergency read-back"
          >
            Review & Save
          </Button>
        </div>
      )}

      <div className="visit-grid">
        {/* Voice Companion Section */}
        <section className="conversation-section" aria-labelledby="voice-companion-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">VOICE CONVERSATION</span>
              <h2 id="voice-companion-title">Voice companion</h2>
            </div>
            <Badge
              tone={
                phase === "listening"
                  ? "coral"
                  : phase === "speaking"
                    ? "indigo"
                    : phase === "processing"
                      ? "gold"
                      : "green"
              }
            >
              {phase === "listening"
                ? "Listening..."
                : phase === "processing"
                  ? "Processing with Gnani & Gemini..."
                  : phase === "speaking"
                    ? "Sahayak Speaking..."
                    : "Ready to Listen"}
            </Badge>
          </div>

          <div className="live-instrument">
            <span className="instrument-orbit instrument-orbit-one" aria-hidden="true" />
            <span className="instrument-orbit instrument-orbit-two" aria-hidden="true" />
            <Waveform active={phase === "listening" || phase === "speaking"} />
            <div className={`voice-state voice-state-${phase}`} aria-live="polite">
              <span aria-hidden="true" /> {phaseCopy[phase]}
            </div>
            <Button
              className={`live-mic ${phase === "listening" ? "listening" : ""}`}
              size="icon"
              aria-label="Hold to talk"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startTalking();
              }}
              onPointerUp={stopTalking}
              onPointerCancel={stopTalking}
            >
              <Mic size={34} />
            </Button>
            <h3>
              {phase === "listening"
                ? "Listening to you speak…"
                : phase === "processing"
                  ? "Extracting clinical fields…"
                  : phase === "speaking"
                    ? "Sahayak is responding aloud…"
                    : "Hold Mic or Space to talk"}
            </h3>
            <p className="mic-help">{phaseHint[phase]}</p>

            {session.transcript.length === 0 && (
              <Button
                size="lg"
                className="start-session-button"
                onClick={startSession}
              >
                <Play size={18} /> Start Session
              </Button>
            )}

            {/* Quick text input fallback */}
            <form onSubmit={sendTyped} className="voice-text-fallback">
              <input
                placeholder="Or type what was said..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
              />
              <Button type="submit" size="sm" variant="outline">
                Send <ArrowRight size={14} />
              </Button>
            </form>

            <small className="mic-permission">{micStatus}</small>
            <div className="voice-guide" aria-label="Voice visit flow">
              <span className={phase === "ready" || phase === "listening" ? "active" : ""}>1. Speak</span>
              <span className={phase === "processing" ? "active" : ""}>2. Capture</span>
              <span className={phase === "speaking" || review ? "active" : ""}>3. Review</span>
            </div>
          </div>

          <div className="transcript-heading">
            <h3>Live Conversation</h3>
            <span>{session.transcript.length} turns</span>
          </div>

          <div className="transcript" aria-live="polite">
            {!session.transcript.length ? (
              <div className="transcript-empty">
                <Mic size={24} />
                <p>Waiting for dialogue to begin.</p>
                <small>Hold Spacebar or the microphone to speak your first observation.</small>
              </div>
            ) : (
              session.transcript.map((t, i) => (
                <div key={i} className={`transcript-message ${t.who}`}>
                  <span className="message-avatar">{t.who === "worker" ? "YOU" : "AI"}</span>
                  <div>
                    <strong>{t.who === "worker" ? "You (ASHA Worker)" : "Sahayak Assistant"}</strong>
                    <p>{t.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Structured Record Card */}
        <section className="record-section" aria-labelledby="visit-record-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">LIVE STRUCTURED RECORD</span>
              <h2 id="visit-record-title">Visit record</h2>
            </div>
            <Badge tone="neutral">DPDP ENCRYPTED</Badge>
          </div>

          <div className="completion">
            <span>{remainingFields ? `${remainingFields} field${remainingFields === 1 ? "" : "s"} remaining` : "Record ready for review"}</span>
            <strong>{captured} / {mandatoryFields.length} captured</strong>
            <progress value={captured} max={mandatoryFields.length} />
          </div>

          <div className="fields">
            {Object.entries(fieldLabels).map(([key, label]) => (
              <div className="record-field" key={key}>
                <div>
                  <label>
                    {label}
                    {mandatoryFields.includes(key) && <span className="required"> *</span>}
                  </label>
                  <strong>
                    {session.fields[key] || <span className="not-captured">Not captured yet</span>}
                  </strong>
                  {session.corrections[key] && (
                    <small className="correction">
                      <s>{session.corrections[key]}</s> → {session.fields[key]}
                    </small>
                  )}
                </div>

                <div className="field-actions">
                  {session.statuses[key] && (
                    <Badge
                      tone={
                        session.statuses[key] === "Corrected"
                          ? "indigo"
                          : session.statuses[key] === "Captured"
                            ? "green"
                            : "gold"
                      }
                    >
                      {session.statuses[key]}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Correct ${label}`}
                    onClick={() => edit(key)}
                  >
                    <Pencil size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            className="review-button"
            onClick={() => setReview(true)}
            disabled={!canConfirm(session.fields, session.statuses) && !session.danger}
          >
            <CheckCircle2 /> Review & Confirm Record
          </Button>

          {!complete && !session.danger && (
            <small className="record-note">
              Complete mandatory fields via voice or manual edit before confirming.
            </small>
          )}
        </section>
      </div>

      {/* Historical Context */}
      {previous && (
        <section className="memory-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">LONGITUDINAL CARE HISTORY</div>
              <h2>Previous Visit Records</h2>
            </div>
            <Badge tone="indigo">Last recorded · {previous.date}</Badge>
          </div>
          <div className="memory-grid">
            <div>
              <small>Previous Weight</small>
              <strong>{previous.weight}</strong>
            </div>
            <div>
              <small>Current Weight</small>
              <strong>{session.fields.weight || "Awaiting measurement"}</strong>
            </div>
            <div>
              <small>Vaccines Previously Due</small>
              <strong>{previous.vaccinations}</strong>
            </div>
            <div>
              <small>Scheduled Follow-up</small>
              <strong>{session.fields.next || previous.next}</strong>
            </div>
          </div>
        </section>
      )}

      {/* Field Edit Modal */}
      {editing && (
        <Modal title={`Correct ${fieldLabels[editing]}`} onClose={() => setEditing(null)}>
          <label className="form-label">
            {fieldLabels[editing]}
            <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} />
          </label>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={updateField} disabled={!editValue.trim()}>
              <Check /> Apply Correction
            </Button>
          </div>
        </Modal>
      )}

      {/* Readback & Confirmation Modal */}
      {review && (
        <Modal title="Verbal Read-Back & Official Confirmation" onClose={() => setReview(false)}>
          <p className="modal-description">
            Please verify the clinical data captured from your conversation before committing to the
            health register.
          </p>
          {session.danger && (
            <Badge tone="red">CRITICAL DANGER SIGN FLAGGED · EMERGENCY PHC REFERRAL REQUIRED</Badge>
          )}

          <div className="readback-fields">
            {Object.entries(fieldLabels).map(([k, l]) => (
              <div key={k}>
                <span>{l}</span>
                <strong>{session.fields[k] || "Not captured"}</strong>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${l}`}
                  onClick={() => {
                    setReview(false);
                    edit(k);
                  }}
                >
                  <Pencil size={14} />
                </Button>
              </div>
            ))}
          </div>

          {savedRef.current ? (
            <div className="w-full flex flex-col gap-2">
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Record confirmed & saved to SQLite register. Reading aloud confirmation...
              </div>
              <Button onClick={() => { setReview(false); navigate({ to: "/records" }); }} className="w-full">
                View in Health Records Now
              </Button>
            </div>
          ) : (
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setReview(false)}>
                <Pencil /> Make Additional Edits
              </Button>
              <Button onClick={confirmAndSave}>
                <CheckCircle2 /> Confirm & Save to SQLite Register
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
