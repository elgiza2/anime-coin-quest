import wall from "@/assets/onboarding/aot-1-wall.jpg";
import mine from "@/assets/onboarding/aot-2-mine.jpg";
import storm from "@/assets/onboarding/aot-3-storm.jpg";
import dawn from "@/assets/onboarding/aot-4-dawn.jpg";

export type StorySlide = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
};

export const STORY_SLIDES: StorySlide[] = [
  {
    image: wall,
    eyebrow: "خلف الأسوار",
    title: "بدأ الأمر بمعدّنة واحدة.",
    body: "خلف الجدار العظيم حملت معولها ونزلت إلى المنجم… ثم جئت أنت.",
  },
  {
    image: mine,
    eyebrow: "في أعماق المنجم",
    title: "كل ضربة تصنع ثروة",
    body: "اضرب الصخر، واجمع الذهب، وحوّله إلى عملتنا الخاصة.",
  },
  {
    image: storm,
    eyebrow: "العاصفة",
    title: "ثم اهتزّ الجدار",
    body: "العمالقة على الأبواب، ولن ينجو المنجم إلا إذا قاتلنا معًا.",
  },
  {
    image: dawn,
    eyebrow: "الفجر الجديد",
    title: "ونبدأ من جديد",
    body: "انضم إلى الفيلق، عدّن كل يوم، وكن جزءًا من القصة.",
  },
];
