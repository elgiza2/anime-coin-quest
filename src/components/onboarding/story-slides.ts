import wall from "@/assets/onboarding/v3-1-wall.jpg";
import mine from "@/assets/onboarding/v3-2-mine.jpg";
import storm from "@/assets/onboarding/v3-3-storm.jpg";
import dawn from "@/assets/onboarding/v3-4-dawn.jpg";

export type StoryEffect = "embers" | "sparks" | "rain" | "dawn";

export type StorySlide = {
  image: string;
  effect: StoryEffect;
  eyebrow: string;
  title: string;
  body: string;
};

export const STORY_SLIDES: StorySlide[] = [
  {
    image: wall,
    effect: "embers",
    eyebrow: "خلف الأسوار",
    title: "بدأ الأمر بمعدّنة واحدة.",
    body: "خلف الجدار العظيم حملت معولها ونزلت إلى المنجم… ثم جئت أنت.",
  },
  {
    image: mine,
    effect: "sparks",
    eyebrow: "في أعماق المنجم",
    title: "كل ضربة تصنع ثروة",
    body: "اضرب الصخر، واجمع الذهب، وحوّله إلى عملتنا الخاصة.",
  },
  {
    image: storm,
    effect: "rain",
    eyebrow: "العاصفة",
    title: "ثم اهتزّ الجدار",
    body: "العمالقة على الأبواب، ولن ينجو المنجم إلا إذا قاتلنا معًا.",
  },
  {
    image: dawn,
    effect: "dawn",
    eyebrow: "الفجر الجديد",
    title: "هل أنت جاهز؟",
    body: "دعنا نبدأ الآن.",
  },
];
