// Hero economy rules. Mirrored by wall_hero_rate / wall_hero_cost / wall_upgrade_hero in the DB — change both together.
export const HERO_COUNT = 5;
export const MAX_LEVEL = 200;
export const TOTAL_MAX = HERO_COUNT * MAX_LEVEL; // 1000
export const STORAGE_HOURS = 3;

/** Coins per hour a hero mines at a given level. */
export function heroRate(hero: number, level: number): number {
  return 2 ** hero * 2 * level;
}

/** Coin price to go from `level` to `level + 1`. */
export function heroCost(hero: number, level: number): number {
  return Math.round(50 * 1.035 ** level * 3 ** hero);
}

/** A hero unlocks once the previous one reaches the max level. */
export function isUnlocked(hero: number, levels: number[]): boolean {
  return hero === 0 || (levels[hero - 1] ?? 0) >= MAX_LEVEL;
}

export function totalRate(levels: number[]): number {
  return levels.reduce((s, l, h) => s + heroRate(h, l), 0);
}

/** Coins waiting in storage; mining stops once storage is full. */
export function pendingCoins(rate: number, minedAt: number, now: number): number {
  const hrs = Math.min(STORAGE_HOURS, Math.max(0, (now - minedAt) / 3_600_000));
  return Math.round(rate * hrs * 100) / 100;
}

export function upgradeErrorMessage(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("not_enough")) return "رصيدك مش كفاية — اجمع أرباحك أو أكمل المهام";
  if (m.includes("locked")) return "البطل ده بيتفتح لما البطل اللي قبله يوصل 200";
  if (m.includes("max_level")) return "البطل وصل لأقصى مستوى";
  return "حصلت مشكلة، حاول تاني";
}
