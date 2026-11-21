import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sahayak" },
      {
        name: "description",
        content:
          "Manage Sahayak worker profile, language, voice preferences and frontend demo data.",
      },
      { property: "og:title", content: "Settings — Sahayak" },
      {
        property: "og:description",
        content:
          "Manage Sahayak worker profile, language, voice preferences and frontend demo data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});
