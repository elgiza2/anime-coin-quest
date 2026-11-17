import wallImg from "@/assets/onboarding/v3-1-wall.jpg";
import mineImg from "@/assets/onboarding/v3-2-mine.jpg";
import stormImg from "@/assets/onboarding/v3-3-storm.jpg";
import dawnImg from "@/assets/onboarding/v3-4-dawn.jpg";
import wallVid from "@/assets/onboarding/story-wall.mp4.asset.json";
import mineVid from "@/assets/onboarding/story-mine.mp4.asset.json";
import stormVid from "@/assets/onboarding/story-storm.mp4.asset.json";
import dawnVid from "@/assets/onboarding/story-dawn.mp4.asset.json";

// Placeholder art reuses the story clips until each hero gets their own video.
export const HEROES = [
  { name: "نايرا", title: "حارسة السور", image: wallImg, video: wallVid.url },
  { name: "كايتو", title: "عامل المنجم", image: mineImg, video: mineVid.url },
  { name: "ريفن", title: "صائدة العاصفة", image: stormImg, video: stormVid.url },
  { name: "دارين", title: "قائد الفجر", image: dawnImg, video: dawnVid.url },
  { name: "الأسطورة", title: "ملك الأسوار", image: dawnImg, video: wallVid.url },
] as const;
