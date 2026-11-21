import { useState } from "react";
import { Search, Clock, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Badge, Modal, Empty } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
export default function History() {
  const { visits } = useDemo();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All sessions");
  const [detail, setDetail] = useState(null);
  const rows = visits.filter(
    (v) =>
      `${v.name} ${v.beneficiary}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All sessions" ||
        (filter === "Danger-flagged" && v.danger) ||
        (filter === "Routine" && !v.danger)),
  );
  return (
    <div className="page">
      <PageHeading
        eyebrow="CONVERSATIONS THAT COUNT"
        title="Session History"
        description="Revisit your conversations and the care they captured."
      />
      <div className="list-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Search sessions"
            placeholder="Search session history…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter sessions"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All sessions</option>
          <option>Routine</option>
          <option>Danger-flagged</option>
        </select>
      </div>
      <div className="history-list">
        {rows.map((v) => (
          <article className="history-item" key={v.id}>
            <span className="icon-tile coral">
              <Mic />
            </span>
            <div>
              <h3>{v.name}</h3>
              <p>
                {v.type} · {v.date}
              </p>
            </div>
            <span className="duration">
              <Clock size={15} />
              {v.duration}
            </span>
            <Badge tone={v.danger ? "red" : "green"}>
              {v.danger ? "Danger-flagged" : "Confirmed"}
            </Badge>
            <Button variant="outline" onClick={() => setDetail(v)}>
              View session <ArrowRight />
            </Button>
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="No matching sessions" />}
      {detail && (
        <Modal title={`Session · ${detail.name}`} onClose={() => setDetail(null)}>
          <p>
            {detail.date} · {detail.duration} · {detail.id}
          </p>
          {detail.transcript?.length ? (
            detail.transcript.map((t, i) => (
              <div className={`transcript-message ${t.who}`} key={i}>
                <span className="message-avatar">{t.who === "worker" ? "SD" : "S"}</span>
                <div>
                  <strong>{t.who === "worker" ? "You" : "Sahayak"}</strong>
                  <p>{t.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="synthetic-summary">
              <Badge tone="neutral">Synthetic previous visit</Badge>
              <h3>Visit summary</h3>
              <p>
                {detail.type} completed. Weight: {detail.weight}. Vaccinations due:{" "}
                {detail.vaccinations}. Follow-up: {detail.next}.
              </p>
              <small>Historical mock record; no audio or transcript was recorded.</small>
            </div>
          )}
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close session
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
