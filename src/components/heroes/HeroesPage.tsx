import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Lock, Plus } from "lucide-react";
import { toast } from "sonner";

import { AnimatedEmoji } from "@/components/emoji/AnimatedEmoji";
import { useNow } from "@/components/tasks/use-now";
import { COIN, formatAmount } from "@/lib/coin";
import { collectMining, getHeroBoard, upgradeHero } from "@/lib/heroes.functions";
import { heroCost, heroRate, isUnlocked, MAX_LEVEL, pendingCoins, STORAGE_HOURS, TOTAL_MAX, totalRate, upgradeErrorMessage } from "@/lib/heroes-model";
import { showRewardedAd } from "@/lib/monetag";
import { adReward, shopErrorMessage } from "@/lib/shop-model";
import { claimAdReward } from "@/lib/shop.functions";
import { getInitData, haptic } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { HEROES } from "./heroes-data";
import { ShopDrawer } from "./ShopDrawer";

function fmtLeft(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)} س ${m % 60} د` : `${m} د`;
}

export function HeroesPage() {
  const qc = useQueryClient();
  const now = useNow(1000);
  const [initData, setInitData] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  useEffect(() => setInitData(getInitData()), []);

  const fetchBoard = useServerFn(getHeroBoard);
  const board = useQuery({ queryKey: ["wall-heroes", initData], queryFn: () => fetchBoard({ data: { initData } }), enabled: !!initData });
  const b = board.data;
  const guest = !initData;
  const levels = b?.levels ?? [1, 0, 0, 0, 0];
  const rate = totalRate(levels);
  const elapsed = b ? now - b.minedAt : 0;
  const pending = b ? pendingCoins(rate, b.minedAt, now) : 0;
  const capMs = STORAGE_HOURS * 3_600_000;
  const fill = Math.min(1, elapsed / capMs);
  const total = levels.reduce((a, c) => a + c, 0);
  const balance = b?.balance ?? 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["wall-heroes"] });
  const ok = (n: number) => { haptic("success"); toast.success(`+${formatAmount(n)} ${COIN.symbol}`); void refresh(); };

  const collectFn = useServerFn(collectMining);
  const collect = useMutation({ mutationFn: () => collectFn({ data: { initData } }), onSuccess: (r) => ok(r.amount), onError: (e) => toast.error(upgradeErrorMessage(e)) });

  const adFn = useServerFn(claimAdReward);
  const ad = useMutation({
    mutationFn: async () => { await showRewardedAd(); return adFn({ data: { initData } }); },
    onSuccess: (r) => ok(r.amount),
    onError: (e) => toast.error(e instanceof Error && e.message === "ad_unavailable" ? "مفيش إعلان متاح دلوقتي، جرب كمان شوية" : shopErrorMessage(e)),
  });

  const upFn = useServerFn(upgradeHero);
  const up = useMutation({
    mutationFn: (hero: number) => upFn({ data: { initData, hero } }),
    onSuccess: (r, hero) => { haptic("success"); toast.success(`${HEROES[hero]!.name} بقى مستوى ${r.level}`); void refresh(); },
    onError: (e) => { haptic("error"); toast.error(upgradeErrorMessage(e)); },
  });

  // The strongest unlocked hero leads the page.
  const lead = Math.max(0, ...levels.map((_, i) => (isUnlocked(i, levels) ? i : 0)));
  const leader = HEROES[lead]!;

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-3">
      {/* Balance */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">رصيدك</p>
          <p className="text-gold text-3xl font-extrabold leading-tight">{formatAmount(balance)} <span className="text-base">{COIN.symbol}</span></p>
        </div>
        <button type="button" onClick={() => setShopOpen(true)} className="btn-cta flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold">
          <Plus className="size-4" /> شحن
        </button>
      </header>

      {/* Lead hero + mining */}
      <section className="glass relative mt-4 overflow-hidden rounded-[28px]">
        <div className="relative h-72 overflow-hidden">
          <img src={leader.image} alt={leader.name} width={768} height={1024} className="animate-breathe size-full object-cover object-top" />
          <div className="hero-fade absolute inset-0" />
          <div className="absolute right-4 top-4 glass rounded-full px-3 py-1 text-xs">المستوى الكلي {total}/{TOTAL_MAX}</div>
        </div>
        <div className="relative -mt-20 p-4">
          <p className="text-xs text-muted-foreground">الأرباح الجاهزة</p>
          <p className="text-4xl font-extrabold">{formatAmount(pending)}</p>
          <p className="text-xs text-muted-foreground">{formatAmount(rate)} {COIN.symbol} في الساعة</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-gold-bar h-full rounded-full transition-[width]" style={{ width: `${fill * 100}%` }} />
          </div>
          <p className={cn("mt-1.5 text-xs", fill >= 1 ? "text-destructive" : "text-muted-foreground")}>
            {fill >= 1 ? "المخزن مليان والتعدين واقف — اجمع دلوقتي" : `المخزن يتملى بعد ${fmtLeft(capMs - elapsed)}`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" disabled={guest || collect.isPending || pending <= 0} onClick={() => collect.mutate()}
              className="btn-cta rounded-2xl py-3 font-bold disabled:opacity-50">اجمع</button>
            <button type="button" disabled={guest || ad.isPending} onClick={() => ad.mutate()}
              className="glass-card flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50">
              <AnimatedEmoji name="rocket" className="size-5 text-accent" /> إعلان +{formatAmount(adReward(rate))}
            </button>
          </div>
        </div>
      </section>

      {/* Heroes */}
      <h2 className="mb-2 mt-6 text-lg font-bold">الأبطال</h2>
      <ul className="space-y-3">
        {HEROES.map((h, i) => {
          const lvl = levels[i] ?? 0;
          const open = isUnlocked(i, levels);
          const max = lvl >= MAX_LEVEL;
          const cost = heroCost(i, lvl);
          return (
            <li key={h.name} className={cn("glass-card flex items-center gap-3 rounded-3xl p-2.5", !open && "opacity-60")}>
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl">
                <img src={h.image} alt={h.name} loading="lazy" width={768} height={1024} className={cn("size-full object-cover object-top", !open && "grayscale")} />
                {!open && <Lock className="absolute inset-0 m-auto size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate font-bold">{h.name}</p>
                  <span className="text-xs text-muted-foreground">{lvl}/{MAX_LEVEL}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-gold-bar h-full rounded-full" style={{ width: `${(lvl / MAX_LEVEL) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {open ? `+${formatAmount(heroRate(i, lvl))} في الساعة` : `يفتح لما ${HEROES[i - 1]!.name} يوصل 200`}
                </p>
              </div>
              {open && (
                <button type="button" disabled={guest || max || up.isPending || balance < cost} onClick={() => up.mutate(i)}
                  className="btn-cta flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 disabled:opacity-40">
                  <span className="text-xs font-bold">{max ? "مكتمل" : "رقّي"}</span>
                  {!max && <span className="text-[11px]">{formatAmount(cost)}</span>}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Link to="/tasks" className="glass-card mt-4 flex items-center gap-3 rounded-3xl p-4">
        <AnimatedEmoji name="sparkle" className="size-8 text-accent" />
        <div className="flex-1"><p className="font-semibold">عملات ببلاش</p><p className="text-xs text-muted-foreground">المهام، الحضور اليومي، ودعوة الأصحاب</p></div>
        <ChevronLeft className="size-5" />
      </Link>

      {/* Leaderboard */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">المتصدرين</h2>
          {b && <span className="glass rounded-full px-3 py-1 text-xs">ترتيبك #{b.rank}</span>}
        </div>
        <ol className="glass-card divide-y divide-border rounded-3xl">
          {(b?.leaders ?? []).slice(0, 10).map((l, i) => (
            <li key={i} className={cn("flex items-center gap-3 px-4 py-2.5", l.me && "bg-accent/10")}>
              <span className={cn("w-5 text-center font-bold", i < 3 && "text-gold")}>{i + 1}</span>
              {l.photo ? <img src={l.photo} alt="" className="size-8 rounded-full" /> : <div className="size-8 rounded-full bg-muted" />}
              <span className="flex-1 truncate text-sm">{l.name}</span>
              <span className="text-sm font-bold">{l.total}</span>
            </li>
          ))}
          {guest && <li className="p-4 text-center text-sm text-muted-foreground">افتح اللعبة من تيليجرام عشان تشوف الترتيب</li>}
        </ol>
      </section>

      <ShopDrawer open={shopOpen} onOpenChange={setShopOpen} initData={initData} onPaid={() => void refresh()} />
    </main>
  );
}
