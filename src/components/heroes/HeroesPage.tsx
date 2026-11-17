import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";

import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import { useNow } from "@/components/tasks/use-now";
import { COIN, formatAmount } from "@/lib/coin";
import { collectMining, getHeroBoard, upgradeHero } from "@/lib/heroes.functions";
import { heroCost, heroRate, isUnlocked, MAX_LEVEL, pendingCoins, STORAGE_HOURS, TOTAL_MAX, totalRate, upgradeErrorMessage } from "@/lib/heroes-model";
import { getInitData, haptic } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { HEROES } from "./heroes-data";

export function HeroesPage() {
  const qc = useQueryClient();
  const now = useNow(1000);
  const [initData, setInitData] = useState("");
  const [idx, setIdx] = useState(0);
  useEffect(() => setInitData(getInitData()), []);

  const fetchBoard = useServerFn(getHeroBoard);
  const board = useQuery({ queryKey: ["wall-heroes", initData], queryFn: () => fetchBoard({ data: { initData } }), enabled: !!initData });
  const b = board.data;
  const levels = b?.levels ?? [1, 0, 0, 0, 0];
  const rate = totalRate(levels);
  const pending = b ? pendingCoins(rate, b.minedAt, now) : 0;
  const fill = b ? Math.min(1, (now - b.minedAt) / (STORAGE_HOURS * 3_600_000)) : 0;
  const total = levels.reduce((a, c) => a + c, 0);
  const refresh = () => qc.invalidateQueries({ queryKey: ["wall-heroes"] });

  const collectFn = useServerFn(collectMining);
  const collect = useMutation({
    mutationFn: () => collectFn({ data: { initData } }),
    onSuccess: (r) => { haptic("success"); toast.success(`+${formatAmount(r.amount)} ${COIN.symbol}`); void refresh(); },
    onError: (e) => toast.error(upgradeErrorMessage(e)),
  });
  const upFn = useServerFn(upgradeHero);
  const up = useMutation({
    mutationFn: () => upFn({ data: { initData, hero: idx } }),
    onSuccess: (r) => { haptic("success"); toast.success(`${HEROES[idx]!.name} وصل مستوى ${r.level}`); void refresh(); },
    onError: (e) => { haptic("error"); toast.error(upgradeErrorMessage(e)); },
  });

  const hero = HEROES[idx]!;
  const lvl = levels[idx] ?? 0;
  const unlocked = isUnlocked(idx, levels);
  const cost = heroCost(idx, lvl);
  const balance = (b?.balance ?? 0);
  const guest = !initData;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="glass rounded-full px-4 py-1.5 text-sm font-semibold">{formatAmount(balance)} {COIN.symbol}</div>
        <div className="glass rounded-full px-4 py-1.5 text-sm">المستوى الكلي <b>{total}</b>/{TOTAL_MAX}</div>
      </header>

      <section className="glass relative overflow-hidden rounded-3xl">
        <video key={hero.video} src={hero.video} poster={hero.image} autoPlay loop muted playsInline
          className={cn("aspect-[3/4] w-full object-cover", !unlocked && "grayscale brightness-50")} />
        <div className="story-fade absolute inset-x-0 bottom-0 p-4">
          <p className="text-xs text-muted-foreground">{hero.title}</p>
          <h1 className="text-2xl font-bold">{hero.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span>مستوى {lvl}/{MAX_LEVEL}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full origin-right rounded-full bg-primary" style={{ width: `${(lvl / MAX_LEVEL) * 100}%` }} />
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">+{formatAmount(heroRate(idx, lvl))} {COIN.symbol}/ساعة</p>
        </div>
        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Lock className="size-10" />
            <p className="px-8 text-sm">بيتفتح لما {HEROES[idx - 1]!.name} يوصل مستوى 200</p>
          </div>
        )}
        <button type="button" aria-label="البطل السابق" disabled={idx === 0} onClick={() => setIdx(idx - 1)}
          className="glass absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 disabled:opacity-30"><ChevronRight /></button>
        <button type="button" aria-label="البطل التالي" disabled={idx === HEROES.length - 1} onClick={() => setIdx(idx + 1)}
          className="glass absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 disabled:opacity-30"><ChevronLeft /></button>
      </section>

      <div className="mt-3 flex justify-center gap-1.5">
        {HEROES.map((h, i) => (
          <button key={h.name} type="button" aria-label={h.name} onClick={() => setIdx(i)}
            className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted")} />
        ))}
      </div>

      <button type="button" disabled={guest || !unlocked || lvl >= MAX_LEVEL || up.isPending} onClick={() => up.mutate()}
        className="btn-cta mt-4 w-full rounded-2xl py-3.5 font-bold disabled:opacity-50">
        {lvl >= MAX_LEVEL ? "أقصى مستوى" : `ترقية لمستوى ${lvl + 1} — ${formatAmount(cost)} ${COIN.symbol}`}
      </button>

      <section className="glass mt-4 rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">المخزن ({STORAGE_HOURS} ساعات)</p>
            <p className="text-xl font-bold">{formatAmount(pending)} {COIN.symbol}</p>
            <p className="text-xs text-muted-foreground">{formatAmount(rate)} {COIN.symbol}/ساعة</p>
          </div>
          <button type="button" disabled={guest || collect.isPending || pending <= 0} onClick={() => collect.mutate()}
            className="btn-cta rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50">جمع الأرباح</button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full origin-right rounded-full bg-primary" style={{ width: `${fill * 100}%` }} />
        </div>
        {fill >= 1 && <p className="mt-2 text-xs text-destructive">المخزن اتملى والتعدين واقف — اجمع دلوقتي</p>}
      </section>

      <Link to="/tasks" className="glass mt-4 flex items-center gap-3 rounded-3xl p-4">
        <AnimatedEmoji name="rocket" className="size-8 text-foreground" />
        <div className="flex-1"><p className="font-semibold">عايز عملات أكتر؟</p><p className="text-xs text-muted-foreground">أكمل المهام وادعي أصحابك</p></div>
        <ChevronLeft />
      </Link>

      <section className="glass mt-4 rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">المتصدرين</h2>
          {b && <span className="text-xs text-muted-foreground">ترتيبك #{b.rank}</span>}
        </div>
        <ol className="space-y-2">
          {(b?.leaders ?? []).map((l, i) => (
            <li key={i} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2", l.me && "bg-primary/15")}>
              <span className="w-6 text-center font-bold">{i + 1}</span>
              {l.photo ? <img src={l.photo} alt="" className="size-8 rounded-full" /> : <div className="size-8 rounded-full bg-muted" />}
              <span className="flex-1 truncate">{l.name}</span>
              <span className="text-sm font-semibold">{l.total}</span>
            </li>
          ))}
          {guest && <p className="text-center text-sm text-muted-foreground">افتح اللعبة من تيليجرام عشان تشوف الترتيب</p>}
        </ol>
      </section>
    </main>
  );
}
