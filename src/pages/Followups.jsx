import { useState } from "react";
import { Search, CalendarCheck, Check, RotateCcw, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Badge, Modal, Empty } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
export default function Followups() {
  const { followups, updateFollowup } = useDemo();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reschedule, setReschedule] = useState(null);
  const [date, setDate] = useState("");
  const rows = followups.filter(
    (f) =>
      (filter === "All" || f.status === filter) &&
      `${f.name} ${f.beneficiary}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page">
      <PageHeading
        eyebrow="KEEPING CARE CONNECTED"
        title="Follow-up Management"
        description="A timely check-in can make all the difference."
      />
      <div className="followup-stats">
        {["Upcoming", "Completed", "Rescheduled"].map((status) => (
          <div key={status}>
            <CalendarCheck />
            <strong>{followups.filter((f) => f.status === status).length}</strong>
            <span>{status}</span>
          </div>
        ))}
      </div>
      <div className="list-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Search follow-ups"
            placeholder="Search follow-ups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="segmented">
          {["All", "Upcoming", "Completed", "Rescheduled"].map((f) => (
            <Button
              key={f}
              variant={f === filter ? "secondary" : "ghost"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>
      <div className="followup-list">
        {rows.map((f) => (
          <article className="followup-item" key={f.id}>
            <span className="icon-tile indigo">
              <CalendarClock />
            </span>
            <div className="followup-person">
              <h3>{f.name}</h3>
              <p>
                {f.type} · {f.beneficiary} · {f.village}
              </p>
            </div>
            <div className="followup-due">
              <strong>{f.date}</strong>
              <Badge tone={f.priority === "High" ? "gold" : "neutral"}>{f.priority} priority</Badge>
            </div>
            <Badge tone={f.status === "Completed" ? "green" : "indigo"}>{f.status}</Badge>
            <div className="followup-actions">
              {f.status !== "Completed" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReschedule(f);
                      setDate("");
                    }}
                  >
                    <CalendarClock /> Reschedule
                  </Button>
                  <Button onClick={() => updateFollowup(f.id, "Completed")}>
                    <Check /> Complete
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => updateFollowup(f.id, "Upcoming")}>
                  <RotateCcw /> Reopen
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="You're all caught up" />}
      {reschedule && (
        <Modal title="Reschedule follow-up" onClose={() => setReschedule(null)}>
          <p>{reschedule.name}</p>
          <label className="form-label">
            Next visit date
            <input
              type="date"
              aria-label="New follow-up date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setReschedule(null)}>
              Cancel
            </Button>
            <Button
              disabled={!date}
              onClick={() => {
                updateFollowup(
                  reschedule.id,
                  "Rescheduled",
                  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                );
                setReschedule(null);
              }}
            >
              Save new date
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
