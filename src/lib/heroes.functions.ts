import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { HERO_COUNT } from "./heroes-model";
import { authPlayer } from "./tasks.functions";

const authInput = z.object({ initData: z.string().min(10).max(4096) });

export type HeroBoard = {
  balance: number;
  minedAt: number;
  levels: number[];
  rank: number;
  leaders: { name: string; photo: string | null; total: number; me: boolean }[];
};

export const getHeroBoard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.parse(d))
  .handler(async ({ data }): Promise<HeroBoard> => {
    const { user, db } = await authPlayer(data.initData);
    await db.rpc("wall_ensure_heroes", { _tg: user.id } as never);
    const [u, h, top] = await Promise.all([
      db.from("wall_users").select("balance, mined_at, total_level").eq("tg_id", user.id).single(),
      db.from("wall_hero_levels").select("hero, level").eq("tg_id", user.id),
      db.from("wall_users").select("tg_id, first_name, username, photo_url, total_level").order("total_level", { ascending: false }).limit(20),
    ]);
    if (u.error) throw new Error(u.error.message);
    const total = Number(u.data.total_level);
    const above = await db.from("wall_users").select("tg_id", { count: "exact", head: true }).gt("total_level", total);
    const levels = Array.from({ length: HERO_COUNT }, () => 0);
    for (const r of h.data ?? []) levels[r.hero] = r.level;
    return {
      balance: Number(u.data.balance),
      minedAt: new Date(u.data.mined_at).getTime(),
      levels,
      rank: (above.count ?? 0) + 1,
      leaders: (top.data ?? []).map((r) => ({
        name: r.first_name || r.username || "لاعب",
        photo: r.photo_url,
        total: Number(r.total_level),
        me: Number(r.tg_id) === user.id,
      })),
    };
  });

export const collectMining = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.parse(d))
  .handler(async ({ data }) => {
    const { user, db } = await authPlayer(data.initData);
    const { data: amt, error } = await db.rpc("wall_mining_claim", { _tg: user.id } as never);
    if (error) throw new Error(error.message);
    return { amount: Number(amt) };
  });

export const upgradeHero = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => authInput.extend({ hero: z.number().int().min(0).max(4) }).parse(d))
  .handler(async ({ data }) => {
    const { user, db } = await authPlayer(data.initData);
    const { data: lvl, error } = await db.rpc("wall_upgrade_hero", { _tg: user.id, _hero: data.hero } as never);
    if (error) throw new Error(error.message);
    return { level: Number(lvl) };
  });
