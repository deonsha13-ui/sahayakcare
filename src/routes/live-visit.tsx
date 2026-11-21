import { createFileRoute } from "@tanstack/react-router";
import LiveVisit from "@/pages/LiveVisit";
export const Route = createFileRoute("/live-visit")({
  head: () => ({
    meta: [
      { title: "Live Voice Visit — Sahayak" },
      {
        name: "description",
        content:
          "Simulated voice visits with structured records, corrections, clarification, danger alerts and explicit confirmation.",
      },
      { property: "og:title", content: "Live Voice Visit — Sahayak" },
      {
        property: "og:description",
        content:
          "Simulated voice visits with structured records, corrections, clarification, danger alerts and explicit confirmation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveVisit,
});
