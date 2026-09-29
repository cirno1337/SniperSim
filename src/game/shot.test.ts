import { describe, expect, it } from "vitest";
import { generateScenario } from "./scenario";
import { optimalSettings, resolveShot } from "./shot";
import { sessionStats } from "./session";

const s = generateScenario({ seed: 1234, mode: "training", difficultyId: "medium", weaponId: "762" });
const perfect = () => {
  const o = optimalSettings(s);
  return { elevationMil: o.elevationMil, windageMil: o.windageMil, aimMil: { ...s.target.centerMil }, timeS: 10 };
};

describe("shot resolution (ballistic integration)", () => {
  it("perfect dial and aim → dead-centre hit", () => {
    const r = resolveShot(s, perfect());
    expect(r.hit).toBe(true);
    expect(r.errorDistM).toBeCloseTo(0, 9);
    expect(r.accuracy).toBeCloseTo(1, 9);
    expect(r.score).toBeGreaterThan(0);
  });

  it("too little elevation lands low by exactly the mil error at that distance", () => {
    const p = perfect();
    const r = resolveShot(s, { ...p, elevationMil: p.elevationMil - 3 });
    expect(r.errorM.y).toBeCloseTo((-3 * s.distanceM) / 1000, 9);
    expect(r.hit).toBe(false);
    expect(r.dialErrorMil.y).toBeCloseTo(-3, 9);
  });

  it("ignoring the wind lets the bullet drift downwind", () => {
    const p = perfect();
    const r = resolveShot(s, { ...p, windageMil: 0 });
    expect(Math.sign(r.errorM.x)).toBe(Math.sign(s.wind.crossMs));
  });

  it("holdover compensates for missing elevation", () => {
    const p = perfect();
    const r = resolveShot(s, { ...p, elevationMil: 0, aimMil: { x: p.aimMil.x, y: p.aimMil.y + p.elevationMil } });
    expect(r.errorDistM).toBeCloseTo(0, 9);
    expect(r.hit).toBe(true);
  });

  it("reports the elevation for the player's range estimate", () => {
    const r = resolveShot(s, { ...perfect(), rangeEstimateM: s.distanceM - 100 });
    expect(r.elevationAtEstimateMil).toBeLessThan(r.optimal.elevationMil);
  });

  it("session stats track hits, streaks and score", () => {
    const p = perfect();
    const hit = resolveShot(s, p);
    const miss = resolveShot(s, { ...p, elevationMil: p.elevationMil + 3 });
    const st = sessionStats([hit, hit, miss, hit]);
    expect(st).toMatchObject({ shots: 4, hits: 3, misses: 1, streak: 1, bestStreak: 2, score: hit.score * 3 });
  });
});
