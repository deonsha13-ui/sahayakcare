import { createFileRoute } from "@tanstack/react-router";
import Records from "@/pages/Records";
export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Visit Records — Sahayak" },
      {
        name: "description",
        content: "Search and review confirmed community healthcare visit records.",
      },
      { property: "og:title", content: "Visit Records — Sahayak" },
      {
        property: "og:description",
        content: "Search and review confirmed community healthcare visit records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Records,
});
