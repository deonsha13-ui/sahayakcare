import { fetchJson } from "./api";
import { initialVisits as mockVisits } from "@/mock/demo";

export const visitService = {
  async list() {
    try {
      const raw = await fetchJson("/api/visits");
      const data = Array.isArray(raw) ? raw : (raw?.items || []);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((v) => ({
          id: v.id,
          beneficiary: v.beneficiary_id || "Unknown",
          name: v.beneficiary_id || "Beneficiary",
          type: v.visit_type || "ANC Home Visit",
          date: v.created_at
            ? new Date(v.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Today",
          weight: v.weight_kg ? `${v.weight_kg} kg` : "Not recorded",
          vaccinations: Array.isArray(v.vaccinations_due)
            ? v.vaccinations_due.join(", ")
            : v.vaccinations_due || "None",
          next: v.next_visit_date || "Not scheduled",
          danger: Boolean(v.flagged),
          dangerPhrase: Array.isArray(v.danger_signs) ? v.danger_signs.join(", ") : "",
          status: v.status === "saved" ? "Confirmed" : "In Progress",
          duration: "3:45",
        }));
      }
    } catch (e) {
      console.warn("Backend API not reachable, using mock visits:", e);
    }
    return structuredClone(mockVisits);
  },
  async confirm(visitId) {
    return fetchJson(`/api/visits/${visitId}/confirm`, { method: "POST" });
  },
};
