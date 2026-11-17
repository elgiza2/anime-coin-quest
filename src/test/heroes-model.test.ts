import { describe, expect, it } from "vitest";
import { heroCost, heroRate, isUnlocked, pendingCoins, TOTAL_MAX } from "@/lib/heroes-model";

describe("heroes economy", () => {
  it("5 heroes x 200 levels = 1000", () => expect(TOTAL_MAX).toBe(1000));
  it("first hero level 1 mines 2/h", () => expect(heroRate(0, 1)).toBe(2));
  it("first upgrade costs 50", () => expect(heroCost(0, 0)).toBe(50));
  it("hero 2 locked until hero 1 hits 200", () => {
    expect(isUnlocked(1, [199])).toBe(false);
    expect(isUnlocked(1, [200])).toBe(true);
  });
  it("storage caps at 3 hours", () => expect(pendingCoins(10, 0, 10 * 3_600_000)).toBe(30));
});
