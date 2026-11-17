import { describe, expect, it } from "vitest";
import { hasMinePass, MINE_PASS_NANO, MINE_PASS_TON } from "@/lib/mine-pass-model";
import { pendingCoins, titansSlain } from "@/lib/heroes-model";
import { toNano } from "@/lib/shop-model";

describe("mandatory Mine Pass", () => {
  it("costs exactly 0.05 TON", () => {
    expect(MINE_PASS_TON).toBe(0.05);
    expect(toNano(MINE_PASS_TON)).toBe(50_000_000n);
    expect(MINE_PASS_NANO).toBe(50_000_000n);
  });
  it("does not mine before activation", () => {
    expect(pendingCoins(100, 0, 3600000, false)).toBe(0);
    expect(titansSlain(0, 3600000, false)).toBe(0);
  });
  it("mines only from activation time", () => {
    expect(pendingCoins(100, 3600000, 3600000, true)).toBe(0);
    expect(pendingCoins(100, 3600000, 7200000, true)).toBe(100);
  });
  it("verification needs an issued unique pass number", () => {
    expect(hasMinePass(null)).toBe(false);
    expect(hasMinePass({ number: 0, activatedAt: "2026-11-17T06:00:00Z" })).toBe(false);
    expect(hasMinePass({ number: 1, activatedAt: "2026-11-17T06:00:00Z" })).toBe(true);
  });
});