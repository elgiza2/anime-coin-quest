import { useEffect, useRef } from "react";
import titanSrc from "@/assets/battle/titan.png";

type Titan = { a: number; r: number; hp: number; fall: number; s: number };
type Arrow = { x: number; y: number; tx: number; ty: number; t: number; target: Titan };
type Spark = { x: number; y: number; vx: number; vy: number; life: number };

/** Hero stands small at the center; titans close in from every side and fall to arrows, one after another. */
export function ArenaCanvas({ heroImage, onKill }: { heroImage: string; onKill?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const killRef = useRef(onKill);
  killRef.current = onKill;
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const titan = new Image(); titan.src = titanSrc;
    const hero = new Image(); hero.src = heroImage;
    let titans: Titan[] = [], arrows: Arrow[] = [], sparks: Spark[] = [];
    let raf = 0, last = performance.now(), cool = 0, spawn = 0, aim = 0;
    const resize = () => { const d = Math.min(2, devicePixelRatio); c.width = c.clientWidth * d; c.height = c.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); addEventListener("resize", resize);
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const w = c.clientWidth, h = c.clientHeight, cx = w / 2, cy = h * 0.58, R = Math.max(w, h) * 0.6;
      ctx.clearRect(0, 0, w, h);
      spawn -= dt;
      if (spawn <= 0 && titans.filter((t) => !t.fall).length < 6) { titans.push({ a: Math.random() * Math.PI * 2, r: R, hp: 1, fall: 0, s: 0.8 + Math.random() * 0.5 }); spawn = 0.6 + Math.random() * 0.8; }
      // titans
      titans.sort((p, q) => Math.sin(p.a) - Math.sin(q.a));
      for (const t of titans) {
        if (!t.fall) t.r = Math.max(70, t.r - dt * 28 * t.s); else t.fall += dt;
        const x = cx + Math.cos(t.a) * t.r, y = cy + Math.sin(t.a) * t.r * 0.55;
        const size = (90 + (1 - t.r / R) * 40) * t.s * (0.75 + 0.25 * (Math.sin(t.a) + 1) / 2);
        ctx.save(); ctx.translate(x, y);
        if (Math.cos(t.a) > 0) ctx.scale(-1, 1);
        if (t.fall) { ctx.rotate(Math.min(1.4, t.fall * 2.5) * (Math.cos(t.a) > 0 ? -1 : 1)); ctx.globalAlpha = Math.max(0, 1 - t.fall / 1.2); }
        ctx.filter = t.fall ? "brightness(1.8) saturate(0.3)" : "none";
        if (titan.complete) ctx.drawImage(titan, -size / 3, -size, (size * 2) / 3, size);
        ctx.restore();
      }
      titans = titans.filter((t) => t.fall < 1.2);
      // hero
      const hs = 64;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - hs / 2, hs / 2, 0, Math.PI * 2); ctx.closePath();
      ctx.shadowColor = "rgba(255,200,90,.8)"; ctx.shadowBlur = 20; ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fill(); ctx.clip();
      if (hero.complete) ctx.drawImage(hero, cx - hs / 2, cy - hs, hs, hs * 1.3);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,210,120,.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy - hs / 2, hs / 2, 0, Math.PI * 2); ctx.stroke();
      // fire
      cool -= dt;
      const alive = titans.filter((t) => !t.fall && t.hp > 0);
      if (cool <= 0 && alive.length) {
        const t = alive[aim++ % alive.length]!; t.hp = 0;
        arrows.push({ x: cx, y: cy - hs / 2, tx: cx + Math.cos(t.a) * t.r, ty: cy + Math.sin(t.a) * t.r * 0.55 - 50, t: 0, target: t });
        cool = 0.45 + Math.random() * 0.35;
      }
      for (const a of arrows) {
        a.t += dt * 2.6;
        const p = Math.min(1, a.t), x = a.x + (a.tx - a.x) * p, y = a.y + (a.ty - a.y) * p - Math.sin(p * Math.PI) * 40;
        const ang = Math.atan2(a.ty - a.y - Math.cos(p * Math.PI) * 40 * Math.PI, a.tx - a.x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.strokeStyle = "rgba(255,230,160,1)"; ctx.shadowColor = "rgba(255,180,60,1)"; ctx.shadowBlur = 10; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(6, 0); ctx.stroke(); ctx.restore();
        if (p >= 1 && !a.target.fall) {
          a.target.fall = 0.001;
          for (let i = 0; i < 18; i++) sparks.push({ x: a.tx, y: a.ty, vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.8) * 200, life: 0.7 });
          killRef.current?.();
        }
      }
      arrows = arrows.filter((a) => a.t < 1);
      for (const s of sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},60,${Math.max(0, s.life)})`; ctx.fillRect(s.x, s.y, 2.5, 2.5); }
      sparks = sparks.filter((s) => s.life > 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [heroImage]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full" />;
}
