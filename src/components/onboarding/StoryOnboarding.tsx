import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { STORY_SLIDES } from "./story-slides";

const SLIDE_MS = 6500;

export function StoryOnboarding({ onFinish }: { onFinish?: () => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = STORY_SLIDES.length;
  const isLast = index === total - 1;
  const slide = STORY_SLIDES[index];

  useEffect(() => {
    STORY_SLIDES.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const handleCta = () => {
    if (isLast) onFinish?.();
    else next();
  };

  return (
    <main className="relative mx-auto h-dvh w-full max-w-md overflow-hidden bg-background select-none">
      {/* Artwork */}
      {STORY_SLIDES.map((s, i) => (
        <div
          key={s.image}
          aria-hidden={i !== index}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: i === index ? 1 : 0 }}
        >
          <img
            key={i === index ? `on-${index}` : "off"}
            src={s.image}
            alt=""
            width={1088}
            height={1920}
            className={`h-full w-full object-cover object-top ${i === index ? "animate-kenburns" : ""}`}
            draggable={false}
          />
        </div>
      ))}
      <div className="story-fade pointer-events-none absolute inset-0" />

      {/* Tap zones (RTL: left = next, right = previous); hold to pause */}
      <div
        className="absolute inset-0 z-10 flex"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <button type="button" aria-label="السابق" className="h-full w-1/3" onClick={prev} />
        <button type="button" aria-label="التالي" className="h-full w-2/3" onClick={next} />
      </div>

      {/* Progress bars */}
      <div className="absolute inset-x-4 top-[max(0.875rem,env(safe-area-inset-top))] z-20 flex gap-1.5">
        {STORY_SLIDES.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/25">
            {i < index && <div className="h-full w-full rounded-full bg-foreground" />}
            {i === index && (
              <div
                key={`bar-${index}`}
                className="animate-story-progress h-full w-full origin-right rounded-full bg-foreground"
                style={
                  {
                    "--story-duration": `${SLIDE_MS}ms`,
                    animationPlayState: paused ? "paused" : "running",
                  } as React.CSSProperties
                }
                onAnimationEnd={() => {
                  if (!isLast) next();
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Glass caption card */}
      <section className="absolute inset-x-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20">
        <div key={index} className="glass rounded-[2rem] px-5 pb-5 pt-6 text-center">
          <p className="animate-rise text-xs font-medium tracking-wide text-accent">{slide.eyebrow}</p>
          <h1
            className="animate-rise mt-2 font-display text-[1.7rem] font-extrabold leading-snug text-foreground"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>
          <p
            className="animate-rise mx-auto mt-2 max-w-[19rem] text-[0.95rem] leading-7 text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            {slide.body}
          </p>
          <button
            type="button"
            onClick={handleCta}
            className="btn-cta animate-rise mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full font-display text-lg font-semibold transition-transform active:scale-[0.97]"
            style={{ animationDelay: "240ms" }}
          >
            {isLast ? "ابدأ المغامرة" : "التالي"}
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </section>
    </main>
  );
}
