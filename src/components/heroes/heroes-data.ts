import rage from "@/assets/heroes/hero-1-rage.jpg";
import mind from "@/assets/heroes/hero-2-mind.jpg";
import blade from "@/assets/heroes/hero-3-blade.jpg";
import commander from "@/assets/heroes/hero-4-commander.jpg";
import guardian from "@/assets/onboarding/v3-1-wall.jpg";

// Index = hero id in the DB (wall_hero_levels.hero). Still art only, animated with CSS.
export const HEROES = [
  { name: "كايل", title: "الفتى الغاضب", image: rage },
  { name: "نايرا", title: "حارسة السور", image: guardian },
  { name: "آرين", title: "العقل المدبّر", image: mind },
  { name: "ليوك", title: "أقوى جندي", image: blade },
  { name: "إروين", title: "القائد الأعلى", image: commander },
] as const;
