import { fetchJson } from "./api";
import { initialFollowups as mockFollowups } from "@/mock/demo";

export const followupService = {
  async list() {
    try {
      const raw = await fetchJson("/api/followups");
      const data = Array.isArray(raw) ? raw : (raw?.items || []);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((f) => ({
          id: f.id,
          name: f.beneficiary_id || "Beneficiary",
          beneficiary: f.beneficiary_id || "Unknown",
          type:
            f.kind === "referral"
              ? "Emergency PHC Referral"
              : f.kind === "vaccination_due"
                ? `Vaccination: ${f.value}`
                : "Routine Home Visit",
          date: f.due_date || f.created_at?.slice(0, 10) || "Upcoming",
          village: "Rampur",
          status: f.status === "completed" ? "Completed" : "Upcoming",
          priority: f.kind === "referral" ? "High" : "Routine",
        }));
      }
    } catch (e) {
      console.warn("Backend API not reachable, using mock followups:", e);
    }
    return structuredClone(mockFollowups);
  },
  update(rowsOrId, idOrStatus, statusOrDate, date) {
    if (Array.isArray(rowsOrId)) {
      const rows = rowsOrId;
      const id = idOrStatus;
      const status = statusOrDate;
      return rows.map((r) => (r.id === id ? { ...r, status, ...(date ? { date } : {}) } : r));
    }
    const id = rowsOrId;
    const status = idOrStatus;
    const backendStatus = status?.toLowerCase() === "completed" ? "completed" : "pending";
    return fetchJson(`/api/followups/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: backendStatus }),
    }).catch((e) => console.warn("Backend PATCH failed, updated locally:", e));
  },
};
