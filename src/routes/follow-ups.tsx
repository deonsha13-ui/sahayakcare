import { createFileRoute } from "@tanstack/react-router";
import Followups from "@/pages/Followups";
export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-up Management — Sahayak" },
      { name: "description", content: "Manage and reschedule community home visit follow-ups." },
      { property: "og:title", content: "Follow-up Management — Sahayak" },
      {
        property: "og:description",
        content: "Manage and reschedule community home visit follow-ups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Followups,
});
