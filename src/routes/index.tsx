import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sahayak — Your community care companion" },
      {
        name: "description",
        content:
          "Start a community home visit, review follow-ups, and capture care through simulated voice conversations.",
      },
      { property: "og:title", content: "Sahayak — Your community care companion" },
      {
        property: "og:description",
        content:
          "Start a community home visit, review follow-ups, and capture care through simulated voice conversations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
