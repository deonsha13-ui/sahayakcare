import { useState, useEffect } from "react";
import { Save, Volume2, Bell, ShieldCheck, RotateCcw, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Modal, Badge } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
export default function Settings() {
  const { settings, updateSettings, notify, reset } = useDemo();
  const [worker, setWorker] = useState(settings.worker);
  const [area, setArea] = useState(settings.area);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setWorker(settings.worker);
    setArea(settings.area);
  }, [settings.worker, settings.area]);
  return (
    <div className="page settings-page">
      <PageHeading
        eyebrow="MAKE SAHAYAK YOUR OWN"
        title="Settings"
        description="Small preferences for a more comfortable workday."
      />
      <section className="settings-section">
        <div className="settings-title">
          <User />
          <h2>Your profile</h2>
        </div>
        <div className="settings-fields">
          <label className="form-label">
            Health worker name
            <input
              aria-label="Health worker name"
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
            />
          </label>
          <label className="form-label">
            Village / service area
            <input
              aria-label="Service area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </label>
        </div>
        <Button
          disabled={!worker.trim() || !area.trim()}
          onClick={() => {
            updateSettings({ worker, area });
            notify("Profile saved.");
          }}
        >
          <Save /> Save profile
        </Button>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <Globe />
          <h2>Language & voice</h2>
        </div>
        <div className="setting-row">
          <div>
            <h3>Interface language preference</h3>
            <p>Selected language is saved across your workspace.</p>
          </div>
          <select
            aria-label="Preferred language"
            value={settings.language}
            onChange={(e) => {
              updateSettings({ language: e.target.value });
              notify("Language preference saved. Demo conversation text remains English.");
            }}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Bengali</option>
          </select>
        </div>
        <div className="setting-row">
          <div>
            <h3>Spoken read-back & alerts</h3>
            <p>Use available browser voices for simulated responses.</p>
          </div>
          <Button
            variant="ghost"
            className={`switch ${settings.spokenAlerts ? "on" : ""}`}
            role="switch"
            aria-checked={settings.spokenAlerts}
            aria-label="Spoken read-back and alerts"
            onClick={() => updateSettings({ spokenAlerts: !settings.spokenAlerts })}
          >
            <span />
          </Button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <Bell />
          <h2>Follow-up preferences</h2>
        </div>
        <div className="setting-row">
          <div>
            <h3>Follow-up reminders</h3>
            <p>Highlight upcoming follow-ups in this demo workspace.</p>
          </div>
          <Button
            variant="ghost"
            className={`switch ${settings.reminders ? "on" : ""}`}
            role="switch"
            aria-checked={settings.reminders}
            aria-label="Follow-up reminders"
            onClick={() => updateSettings({ reminders: !settings.reminders })}
          >
            <span />
          </Button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-title">
          <ShieldCheck />
          <h2>Demo data & privacy</h2>
          <Badge tone="neutral">FRONTEND ONLY</Badge>
        </div>
        <p>
          All beneficiary information is synthetic. Visit records are saved only in this browser.
          Microphone audio is not uploaded, saved, or transcribed.
        </p>
        <div className="setting-row">
          <div>
            <h3>Reset demo workspace</h3>
            <p>Restore synthetic records and remove your saved demo visits.</p>
          </div>
          <Button variant="outline" onClick={() => setConfirm(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      </section>
      {confirm && (
        <Modal title="Reset demo data?" onClose={() => setConfirm(false)}>
          <p>
            Your saved visits, preferences, and follow-up changes will be removed from this browser.
          </p>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                setConfirm(false);
                setWorker("Sunita Devi");
                setArea("Rampur · Block 04");
              }}
            >
              Reset demo data
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
