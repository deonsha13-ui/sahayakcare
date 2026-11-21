import { mandatoryFields } from "@/mock/demo";
export const canConfirm = (fields, statuses) =>
  mandatoryFields.every((key) => Boolean(fields[key]) && statuses[key] !== "Needs clarification");
export function applyEvent(fields, statuses, event) {
  const next = { ...fields, ...event.values };
  const states = { ...statuses };
  const corrections = {};
  Object.keys(event.values).forEach((key) => {
    states[key] =
      event.uncertain === key
        ? "Needs clarification"
        : event.corrected === key
          ? "Corrected"
          : "Captured";
    if (event.corrected === key) corrections[key] = fields[key];
  });
  return { fields: next, statuses: states, corrections };
}
