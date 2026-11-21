import { fetchJson } from "./api";
import { beneficiaries as mockBeneficiaries } from "@/mock/demo";

export const beneficiaryService = {
  async list() {
    try {
      const raw = await fetchJson("/api/beneficiaries");
      const data = Array.isArray(raw) ? raw : (raw?.items || []);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((b) => ({
          id: b.id || b.beneficiary_id,
          name: b.name || "Beneficiary",
          age: b.age ? `${b.age} years` : "Unknown",
          type: b.rch_id || b.beneficiary_id ? `ANC (${b.rch_id || b.beneficiary_id})` : "ANC Home Visit",
          village: b.village || "Rampur",
          initials: (b.name || "B")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join(""),
          last: b.created_at
            ? new Date(b.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Recent",
          next: "Pending",
        }));
      }
    } catch (e) {
      console.warn("Backend API not reachable, using mock beneficiaries:", e);
    }
    return structuredClone(mockBeneficiaries);
  },
};
