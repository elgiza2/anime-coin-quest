import { createFileRoute } from "@tanstack/react-router";

import { StoryOnboarding } from "@/components/onboarding/StoryOnboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منجم الأسوار — ابدأ القصة" },
      { name: "description", content: "قصة البداية: خلف الأسوار يبدأ التعدين. لعبة تعدين أنمي داخل تيليجرام." },
      { property: "og:title", content: "منجم الأسوار — ابدأ القصة" },
      { property: "og:description", content: "خلف الأسوار يبدأ التعدين. لعبة تعدين أنمي داخل تيليجرام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <StoryOnboarding />;
}
