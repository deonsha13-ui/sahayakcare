import { describe, it, expect } from "vitest";
import { makeSteps, mandatoryFields } from "@/mock/demo";
import { applyEvent, canConfirm } from "@/utils/visit";
import { followupService } from "@/services/followupService";
function run(scenario) {
  let state = { fields: {}, statuses: {}, corrections: {} };
  for (const event of makeSteps(scenario)) {
    const result = applyEvent(state.fields, state.statuses, event);
    state = { ...result, corrections: { ...state.corrections, ...result.corrections } };
  }
  return state;
}
describe("Visit capture rules", () => {
  it("requires exactly the seven mandatory fields before confirmation", () => {
    expect(mandatoryFields).toEqual(["beneficiary", "name", "age", "type", "weight", "vaccinations", "next"]);
    expect(canConfirm({}, {})).toBe(false);
    const state = run("anc");
    expect(canConfirm(state.fields, state.statuses)).toBe(true);
    for (const field of mandatoryFields)
      expect(canConfirm({ ...state.fields, [field]: "" }, state.statuses)).toBe(false);
  });
  it("corrects newborn weight from 2.3 kg to 2.8 kg and preserves the original", () => {
    const state = run("newborn");
    expect(state.fields.weight).toBe("2.8 kg");
    expect(state.corrections.weight).toBe("2.3 kg");
    expect(state.statuses.weight).toBe("Corrected");
  });
  it("clarification blocks confirmation for only the uncertain vaccination field", () => {
    const state = run("anc");
    expect(
      canConfirm(state.fields, { ...state.statuses, vaccinations: "Needs clarification" }),
    ).toBe(false);
    const steps = makeSteps("anc");
    expect(steps[2].uncertain).toBe("vaccinations");
  });
  it("independently detects bleeding during pregnancy and newborn high fever", () => {
    expect(makeSteps("bleeding").at(-1).danger).toBe("Bleeding during pregnancy");
    expect(makeSteps("fever").at(-1).danger).toBe("High fever in a newborn");
    expect(makeSteps("newborn").some((e) => e.danger)).toBe(false);
  });
  it("updates follow-up status and date without mutating existing records", () => {
    const rows = [{ id: "1", status: "Upcoming", date: "14 Nov 2026" }];
    const next = followupService.update(rows, "1", "Rescheduled", "22 Nov 2026");
    expect(next[0]).toEqual({ id: "1", status: "Rescheduled", date: "22 Nov 2026" });
    expect(rows[0].date).toBe("14 Nov 2026");
  });
});
