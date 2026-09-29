import { describe, expect, it } from "vitest";
import { DIFFICULTIES, SCOPE, WEAPONS, getDifficulty, getWeapon } from "./config";
import { distanceBand, generateScenario } from "./scenario";

const SEEDS = Array.from({ length: 400 }, (_, i) => i * 7919 + 13);

describe("scenario generation", () => {
  for (const d of DIFFICULTIES) {
    for (const mode of ["training", "challenge"] as const) {
      it(`stays within configured limits (${d.id}, ${mode})`, () => {
        for (const seed of SEEDS) {
          const s = generateScenario({ seed, mode, difficultyId: d.id, weaponId: "random" });
          const w = getWeapon(s.weaponId);
          const [lo, hi] = distanceBand(w, d);
          expect(WEAPONS.map((x) => x.id)).toContain(s.weaponId);
          expect(s.distanceM).toBeGreaterThanOrEqual(lo);
          expect(s.distanceM).toBeLessThanOrEqual(hi);
          expect(s.distanceM).toBeGreaterThanOrEqual(w.rangeM[0]);
          expect(s.distanceM).toBeLessThanOrEqual(w.rangeM[1]);
          expect(s.distanceM % d.distanceStep).toBe(0);
          expect(s.wind.speedMs).toBeGreaterThanOrEqual(d.windMs[0]);
          expect(s.wind.speedMs).toBeLessThanOrEqual(d.windMs[1]);
          expect(Math.abs(s.wind.crossMs)).toBeLessThanOrEqual(s.wind.speedMs + 1e-9);
          expect(d.windClocks).toContain(s.wind.fromClock);
          expect(Math.abs(s.target.centerMil.x)).toBeLessThanOrEqual(d.targetOffsetMil);
          // the target is visible in the widest scope field of view from the start position
          expect(Math.abs(s.target.centerMil.y)).toBeLessThan(SCOPE.fovMil[0] / 2);
          expect(Number.isFinite(s.target.centerMil.y)).toBe(true);
          expect(d.targets.some((t) => t.type === s.target.type && t.widthM === s.target.widthM)).toBe(true);
          expect(s.hidden.distance).toBe(mode === "challenge");
        }
      });
    }
  }

  it("is deterministic for a seed", () => {
    const a = generateScenario({ seed: 42, mode: "training", difficultyId: "medium", weaponId: "random" });
    const b = generateScenario({ seed: 42, mode: "training", difficultyId: "medium", weaponId: "random" });
    expect(a).toEqual(b);
  });

  it("selects the requested weapon and both weapons appear at random", () => {
    const s = generateScenario({ seed: 1, mode: "training", difficultyId: "hard", weaponId: "556" });
    expect(s.weaponId).toBe("556");
    const ids = new Set(SEEDS.map((seed) => generateScenario({ seed, mode: "training", difficultyId: "easy", weaponId: "random" }).weaponId));
    expect(ids).toEqual(new Set(["556", "762"]));
  });

  it("uses the configured gameplay ranges (5.56: 100–600, 7.62: 100–800)", () => {
    expect(distanceBand(getWeapon("556"), getDifficulty("hard"))[1]).toBe(600);
    expect(distanceBand(getWeapon("762"), getDifficulty("hard"))[1]).toBe(800);
    expect(distanceBand(getWeapon("762"), getDifficulty("easy"))[0]).toBe(100);
  });

  it("farther targets appear smaller and closer to the horizon", () => {
    const near = generateScenario({ seed: 3, mode: "training", difficultyId: "easy", weaponId: "762" });
    const far = generateScenario({ seed: 3, mode: "training", difficultyId: "hard", weaponId: "762" });
    expect(far.distanceM).toBeGreaterThan(near.distanceM);
    expect(Math.abs(far.target.centerMil.y)).toBeLessThan(Math.abs(near.target.centerMil.y));
  });
});
