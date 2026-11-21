import { createFileRoute } from "@tanstack/react-router";
import History from "@/pages/History";
export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Session History — Sahayak" },
      {
        name: "description",
        content: "Review previous voice conversations and confirmed healthcare visit sessions.",
      },
      { property: "og:title", content: "Session History — Sahayak" },
      {
        property: "og:description",
        content: "Review previous voice conversations and confirmed healthcare visit sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});
