import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Lock, Swords, Zap } from "lucide-react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import { useNow } from "@/components/tasks/use-now";
import { HEROES } from "@/components/heroes/heroes-data";
import { COIN, formatAmount } from "@/lib/coin";
import { collectMining, getHeroBoard } from "@/lib/heroes.functions";
import { coinsPerTitan, isUnlocked, pendingCoins, STORAGE_HOURS, titansSlain, totalRate, upgradeErrorMessage } from "@/lib/heroes-model";
import { showRewardedAd } from "@/lib/monetag";
import { adReward, shopErrorMessage } from "@/lib/shop-model";
import { claimAdReward } from "@/lib/shop.functions";
import { getInitData, haptic } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { SegmentVideo } from "./SegmentVideo";

const fmtLeft = (ms: number) => {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  return `${Math.floor(m / 60)}س ${m % 60}د`;
};

export function BattlePage() {
  const qc = useQueryClient();
  const now = useNow(1000);
  const [initData, setInitData] = useState("");
  const [pick, setPick] = useState<number | null>(null);
  const [pops, setPops] = useState<number[]>([]);
  useEffect(() => setInitData(getInitData()), []);

  const fetchBoard = useServerFn(getHeroBoard);
  const board = useQuery({ queryKey: ["wall-heroes", initData], queryFn: () => fetchBoard({ data: { initData } }), enabled: !!initData });
  const b = board.data;
  const guest = !initData;
  const levels = b?.levels ?? [1, 0, 0, 0, 0];
  const rate = totalRate(levels);
  const pending = b ? pendingCoins(rate, b.minedAt, now) : 0;
  const kills = b ? titansSlain(b.minedAt, now) : 0;
  const full = b ? now - b.minedAt >= STORAGE_HOURS * 3_600_000 : false;
  const fill = b ? Math.min(1, (now - b.minedAt) / (STORAGE_HOURS * 3_600_000)) : 0;

  const mine = levels.reduce((m, _, i) => (isUnlocked(i, levels) ? i : m), 0);
  const h = pick ?? mine;
  const hero = HEROES[h]!;
  const clip = hero.battle ?? hero.video;

  // A "+coins" pop every time a new titan falls.
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!b) return;
    if (last.current !== null && kills > last.current) {
      const id = Date.now();
      setPops((p) => [...p.slice(-3), id]);
      haptic("success");
      setTimeout(() => setPops((p) => p.filter((x) => x !== id)), 1600);
    }
    last.current = kills;
  }, [kills, b]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["wall-heroes"] });
  const ok = (n: number) => { haptic("success"); toast.success(`+${formatAmount(n)} ${COIN.symbol}`); last.current = 0; void refresh(); };
  const collectFn = useServerFn(collectMining);
  const collect = useMutation({ mutationFn: () => collectFn({ data: { initData } }), onSuccess: (r) => ok(r.amount), onError: (e) => toast.error(upgradeErrorMessage(e)) });
  const adFn = useServerFn(claimAdReward);
  const ad = useMutation({
    mutationFn: async () => { await showRewardedAd(); return adFn({ data: { initData } }); },
    onSuccess: (r) => ok(r.amount),
    onError: (e) => toast.error(e instanceof Error && e.message === "ad_unavailable" ? "مفيش إعلان متاح دلوقتي، جرب كمان شوية" : shopErrorMessage(e)),
  });

  return (
    <main className="relative mx-auto h-dvh max-w-md overflow-hidden">
      {/* Battle footage */}
      {clip ? (
        <SegmentVideo src={clip} poster={hero.image} className="absolute inset-0 size-full object-cover" />
      ) : (
        <img src={hero.image} alt={hero.name} className="absolute inset-0 size-full object-cover" />
      )}
      <div className="battle-shade absolute inset-0" />

      {/* Storage header */}
      <header className="glass absolute inset-x-3 top-3 z-10 rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">غنايم المعركة</p>
            <p className="text-gold text-3xl font-extrabold tabular-nums">{formatAmount(pending)} <span className="text-sm">{COIN.symbol}</span></p>
          </div>
          <button type="button" disabled={guest || collect.isPending || pending <= 0} onClick={() => collect.mutate()}
            className="btn-cta shrink-0 rounded-2xl px-6 py-3 text-lg font-extrabold disabled:opacity-50">استلام</button>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="size-3.5" />{formatAmount(rate)}/س</span>
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{b ? (full ? "المخزن مليان" : fmtLeft(b.minedAt + STORAGE_HOURS * 3_600_000 - now)) : "—"}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-gold-bar h-full rounded-full transition-[width] duration-1000" style={{ width: `${fill * 100}%` }} />
        </div>
      </header>

      {/* Kill counter + pops */}
      <div className="absolute inset-x-0 top-[38%] z-10 flex flex-col items-center">
        <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
          <Swords className="size-4 text-gold" />
          <span className="text-sm font-bold">{kills} عملاق سقط</span>
          <span className="text-xs text-muted-foreground">· {formatAmount(coinsPerTitan(rate))} لكل عملاق</span>
        </div>
        {pops.map((id) => (
          <span key={id} className="animate-coin-pop text-gold absolute top-12 text-2xl font-extrabold">+{formatAmount(coinsPerTitan(rate))}</span>
        ))}
        {full && <p className="glass mt-2 rounded-full px-3 py-1 text-xs text-destructive">البطل واقف — استلم عشان يكمل القتال</p>}
      </div>

      {/* Hero switcher + ad boost */}
      <section className="absolute inset-x-3 bottom-24 z-10 space-y-2">
        <button type="button" disabled={guest || ad.isPending} onClick={() => ad.mutate()}
          className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold disabled:opacity-50">
          <AnimatedEmoji name="rocket" className="size-5 text-accent" /> اتفرج على إعلان واكسب +{formatAmount(adReward(rate))}
        </button>
        <div className="glass flex justify-between rounded-[22px] p-2">
          {HEROES.map((x, i) => {
            const open = isUnlocked(i, levels);
            return (
              <button key={x.name} type="button" disabled={!open} onClick={() => setPick(i)} aria-label={x.name}
                className={cn("relative size-14 overflow-hidden rounded-2xl ring-2", i === h ? "ring-accent" : "ring-transparent")}>
                <img src={x.image} alt="" className={cn("size-full object-cover object-top", !open && "grayscale brightness-50")} />
                {!open && <Lock className="absolute inset-0 m-auto size-4" />}
              </button>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
