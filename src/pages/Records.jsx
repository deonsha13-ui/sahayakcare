import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Plus, Download, Eye, ShieldAlert, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Badge, Modal, Empty } from "@/components/Shared";
import { useDemo } from "@/context/DemoContext";
import { fieldLabels } from "@/mock/demo";
export default function Records() {
  const { visits } = useDemo();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All visits");
  const [detail, setDetail] = useState(null);
  const rows = visits.filter(
    (v) =>
      `${v.name} ${v.beneficiary}`.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All visits" || (filter === "Danger-flagged" && v.danger) || v.type === filter),
  );
  const download = () => {
    const columns = [
      "id",
      "name",
      "beneficiary",
      "type",
      "weight",
      "vaccinations",
      "next",
      "danger",
    ];
    const csv = [
      columns.join(","),
      ...rows.map((r) =>
        columns.map((k) => `"${String(r[k] ?? "").replaceAll('"', '""')}"`).join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sahayak-visits.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="page records-page">
      <PageHeading
        eyebrow="A RECORD OF YOUR CARE"
        title="Visit Records"
        description="Every conversation, carefully captured and confirmed."
        action={
          <Button asChild>
            <Link to="/live-visit">
              <Plus /> New visit
            </Link>
          </Button>
        }
      />
      <div className="records-masthead">
        <div className="records-count"><span><ClipboardList /></span><div><strong>{visits.length}</strong><small>confirmed care records</small></div></div>
        <p>Each record is captured from a conversation, reviewed by you, and saved with confirmation.</p>
        <Badge>CONFIRMATION-LED</Badge>
      </div>
      <div className="list-toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            placeholder="Search name or beneficiary ID…"
            aria-label="Search records"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter records"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All visits", "ANC Home Visit", "Newborn Visit", "Danger-flagged"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <Button variant="outline" onClick={download}>
          <Download /> Export CSV
        </Button>
      </div>
      <div className="table-wrap records-ledger">
        <table>
          <thead>
            <tr>
              <th>Beneficiary</th>
              <th>Visit type</th>
              <th>Visit date</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>{v.name}</strong>
                  <small>{v.beneficiary}</small>
                </td>
                <td>{v.type}</td>
                <td>{v.date}</td>
                <td>{v.weight}</td>
                <td>
                  <Badge tone={v.danger ? "red" : "green"}>
                    {v.danger ? "Danger-flagged" : "Confirmed"}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`View record for ${v.name}`}
                    onClick={() => setDetail(v)}
                  >
                    <Eye />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text="No matching records" />}
      </div>
      <p className="list-count">
        Showing {rows.length} of {visits.length} visit records
      </p>
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <Badge tone={detail.danger ? "red" : "green"}>
            {detail.danger ? "Danger-flagged" : "Confirmed"}
          </Badge>
          {detail.danger && (
            <p className="danger-copy">{detail.dangerPhrase} · Immediate PHC referral required.</p>
          )}
          <div className="readback-fields">
            {Object.entries(fieldLabels).map(([k, l]) => (
              <div key={k}>
                <span>{l}</span>
                <strong>{detail[k] || "Not applicable"}</strong>
              </div>
            ))}
          </div>
          {detail.corrections &&
            Object.entries(detail.corrections).map(([k, val]) => (
              <p key={k} className="correction">
                {fieldLabels[k]}: <s>{val}</s> → {detail[k]}
              </p>
            ))}
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close record
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
