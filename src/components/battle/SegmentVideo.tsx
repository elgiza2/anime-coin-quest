import { useEffect, useRef, useState } from "react";

/** Plays random short slices of a clip, mirroring some, so it never reads as a loop. */
export function SegmentVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let end = 0;
    const jump = () => {
      const d = v.duration || 0;
      if (!d) return;
      const len = 1.5 + Math.random() * 1.5;
      const start = Math.random() * Math.max(0, d - len);
      v.currentTime = start;
      end = start + len;
      setFlip(Math.random() < 0.5);
    };
    const tick = () => { if (v.currentTime >= end || v.ended) jump(); };
    v.addEventListener("loadedmetadata", jump);
    v.addEventListener("timeupdate", tick);
    v.addEventListener("ended", jump);
    if (v.readyState >= 1) jump();
    return () => { v.removeEventListener("loadedmetadata", jump); v.removeEventListener("timeupdate", tick); v.removeEventListener("ended", jump); };
  }, [src]);
  return <video ref={ref} key={src} src={src} poster={poster} autoPlay muted playsInline loop
    className={className} style={{ transform: flip ? "scaleX(-1)" : undefined, transition: "transform 0s" }} />;
}
