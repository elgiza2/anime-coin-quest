import { Link } from "@tanstack/react-router";
import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import type { EmojiName } from "@/components/emoji/emoji-registry";

const ITEMS: { to: "/tasks" | "/heroes"; label: string; emoji: EmojiName }[] = [
  { to: "/tasks", label: "المهام", emoji: "scout" },
  { to: "/heroes", label: "الأبطال", emoji: "shields" },
];

export function BottomNav() {
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md justify-around rounded-[26px] px-2 py-2">
      {ITEMS.map((i) => (
        <Link key={i.to} to={i.to} className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs text-muted-foreground"
          activeProps={{ className: "bg-accent/15 text-foreground" }}>
          <AnimatedEmoji name={i.emoji} className="size-7 text-accent" />
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
