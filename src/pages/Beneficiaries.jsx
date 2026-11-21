import { useState } from "react";
import { Search, MapPin, ArrowRight, Calendar, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { PageHeading, Badge, Modal, Empty } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
export default function Beneficiaries() {
  const { beneficiaries, visits, setDraft } = useDemo();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All beneficiaries");
  const [profile, setProfile] = useState(null);
  const rows = beneficiaries.filter(
    (b) =>
      `${b.name} ${b.id} ${b.village}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All beneficiaries" || b.type === filter),
  );
  return (
    <div className="page">
      <PageHeading
        eyebrow="PEOPLE AT THE HEART OF CARE"
        title="Beneficiary Profiles"
        description="Familiar faces. A continuous journey of care."
      />
      <div className="list-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder="Search name, ID or village…"
            aria-label="Search beneficiaries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter beneficiaries"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All beneficiaries", "ANC Home Visit", "Newborn Visit"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <span className="muted">{rows.length} beneficiaries</span>
      </div>
      <div className="profile-grid">
        {rows.map((b, i) => (
          <article className="profile-card" key={b.id}>
            <div className="profile-top">
              <span className={`avatar large ${i % 2 ? "indigo" : ""}`}>{b.initials}</span>
              <Badge tone={b.type.startsWith("ANC") ? "coral" : "indigo"}>
                {b.type.startsWith("ANC") ? "Maternal care" : "Newborn care"}
              </Badge>
            </div>
            <h2>{b.name}</h2>
            <small>
              {b.id} · {b.age}
            </small>
            <p className="profile-location">
              <MapPin size={15} />
              {b.village}
            </p>
            <div className="profile-detail">
              <span>Last visit</span>
              <strong>{visits.find((v) => v.beneficiary === b.id)?.date || b.last}</strong>
            </div>
            <div className="profile-detail">
              <span>Next follow-up</span>
              <strong>{visits.find((v) => v.beneficiary === b.id)?.next || b.next}</strong>
            </div>
            <Button variant="outline" onClick={() => setProfile(b)} className="full-width">
              View profile <ArrowRight />
            </Button>
          </article>
        ))}
      </div>
      {!rows.length && <Empty text="No matching beneficiaries" />}
      {profile && (
        <Modal title={profile.name} onClose={() => setProfile(null)}>
          <Badge tone="indigo">
            {profile.id} · {profile.village}
          </Badge>
          <div className="profile-modal-summary">
            <span>
              Age <strong>{profile.age}</strong>
            </span>
            <span>
              Care journey <strong>{profile.type}</strong>
            </span>
          </div>
          <h3>Visit timeline</h3>
          {visits
            .filter((v) => v.beneficiary === profile.id)
            .map((v) => (
              <div className="timeline-item" key={v.id}>
                <Calendar />
                <div>
                  <strong>{v.date}</strong>
                  <p>
                    {v.type} · Weight {v.weight}
                  </p>
                  <small>Next visit: {v.next}</small>
                </div>
                <Badge tone={v.danger ? "red" : "green"}>
                  {v.danger ? "Flagged" : "Confirmed"}
                </Badge>
              </div>
            ))}
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setProfile(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setDraft({
                  scenario: profile.type.startsWith("ANC") ? "anc" : "newborn",
                  fields: {
                    beneficiary: profile.id,
                    name: profile.name,
                    age: profile.age,
                    gestation: profile.gestation || "Not applicable",
                  },
                  statuses: {
                    beneficiary: "Captured",
                    name: "Captured",
                    age: "Captured",
                    gestation: "Captured",
                  },
                  corrections: {},
                  transcript: [
                    {
                      who: "agent",
                      text: `Starting a visit for ${profile.name}, beneficiary ${profile.id}.`,
                    },
                  ],
                  step: 1,
                  danger: null,
                });
                navigate({ to: "/live-visit" });
              }}
            >
              <Heart /> Start a visit
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
