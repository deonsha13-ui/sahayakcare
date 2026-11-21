import { createFileRoute } from "@tanstack/react-router";
import Beneficiaries from "@/pages/Beneficiaries";
export const Route = createFileRoute("/beneficiaries")({
  head: () => ({
    meta: [
      { title: "Beneficiary Profiles — Sahayak" },
      {
        name: "description",
        content: "Explore synthetic beneficiary profiles and their continuous care journey.",
      },
      { property: "og:title", content: "Beneficiary Profiles — Sahayak" },
      {
        property: "og:description",
        content: "Explore synthetic beneficiary profiles and their continuous care journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Beneficiaries,
});
