// TON shop + rewarded-ad rules. Ad limits are mirrored by wall_ad_reward in the DB.
export const TREASURY_ADDRESS = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";

export type PackId = "starter" | "soldier" | "captain" | "commander";
export const PACKS: { id: PackId; ton: number; coins: number; label: string }[] = [
  { id: "starter", ton: 0.5, coins: 25_000, label: "مجند" },
  { id: "soldier", ton: 1, coins: 60_000, label: "جندي" },
  { id: "captain", ton: 3, coins: 200_000, label: "كابتن" },
  { id: "commander", ton: 10, coins: 800_000, label: "قائد" },
];
export function findPack(id: string) {
  return PACKS.find((p) => p.id === id);
}

export const AD_MIN_REWARD = 100;
export const AD_GAP_SECONDS = 15;
export const AD_DAILY_LIMIT = 50;
/** One ad pays one hour of current mining, never less than AD_MIN_REWARD. */
export function adReward(ratePerHour: number): number {
  return Math.max(AD_MIN_REWARD, Math.round(ratePerHour));
}

export function toNano(ton: number): bigint {
  const [w = "0", f = ""] = ton.toFixed(9).split(".");
  return BigInt(w) * 1_000_000_000n + BigInt(f.padEnd(9, "0"));
}

export function paymentComment(id: string): string {
  return `wall:${id}`;
}

/**
 * Base64 BOC of a single cell holding a TON text comment (32 zero bits + UTF-8 text).
 * Hand-rolled so the browser and worker need no Buffer polyfill. Max 123 bytes of text.
 */
export function commentPayload(text: string): string {
  const body = new TextEncoder().encode(text);
  if (body.length > 123) throw new Error("comment too long");
  const data = new Uint8Array(4 + body.length);
  data.set(body, 4);
  const cell = new Uint8Array(2 + data.length);
  cell[0] = 0; // no refs, ordinary, level 0
  cell[1] = data.length * 2; // whole bytes, no padding bit
  cell.set(data, 2);
  const head = [0xb5, 0xee, 0x9c, 0x72, 0x01, 0x01, 0x01, 0x01, 0x00, cell.length, 0x00];
  const boc = new Uint8Array(head.length + cell.length);
  boc.set(head, 0);
  boc.set(cell, head.length);
  let bin = "";
  for (const b of boc) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function shopErrorMessage(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("ad_limit")) return "خلصت إعلانات النهارده، ارجع بكرة";
  if (m.includes("ad_too_fast")) return "استنى ثواني قبل الإعلان الجاي";
  if (m.includes("not_found_yet")) return "لسه الدفعة موصلتش، استنى دقيقة وجرب تاني";
  if (/reject|cancel/i.test(m)) return "اتلغى الدفع";
  return "حصلت مشكلة، حاول تاني";
}
