import { describe, expect, it } from "vitest";
import { accuracy, score, speedMultiplier } from "./scoring";

const base = { hit: true, distanceM: 400, parTimeS: 20, difficultyMultiplier: 1 };

describe("scoring", () => {
  it("high accuracy + fast time scores best", () => {
    const fast = score({ ...base, accuracy: 0.95, timeS: 5 });
    const slow = score({ ...base, accuracy: 0.95, timeS: 50 });
    expect(fast).toBeGreaterThan(slow);
    expect(fast).toBeGreaterThan(1500);
  });

  it("high accuracy + slow time still scores, but less", () => {
    const slow = score({ ...base, accuracy: 0.95, timeS: 50 });
    expect(slow).toBeGreaterThan(0);
    expect(slow).toBeLessThan(score({ ...base, accuracy: 0.95, timeS: 20 }));
  });

  it("low accuracy scores low; a miss scores zero", () => {
    expect(score({ ...base, accuracy: 0.2, timeS: 5 })).toBeLessThan(score({ ...base, accuracy: 0.9, timeS: 5 }) / 3);
    expect(score({ ...base, hit: false, accuracy: 0.6, timeS: 5 })).toBe(0);
  });

  it("longer distance and harder difficulty are worth more", () => {
    const s = { ...base, accuracy: 0.9, timeS: 10 };
    expect(score({ ...s, distanceM: 700 })).toBeGreaterThan(score(s));
    expect(score({ ...s, difficultyMultiplier: 2 })).toBeGreaterThan(score(s));
  });

  it("accuracy is 1 at centre and 0 far away", () => {
    expect(accuracy(0, 0.2)).toBe(1);
    expect(accuracy(0.2, 0.2)).toBeCloseTo(2 / 3);
    expect(accuracy(5, 0.2)).toBe(0);
  });

  it("speed multiplier is continuous and bounded", () => {
    expect(speedMultiplier(0, 20)).toBe(1.5);
    expect(speedMultiplier(20, 20)).toBeCloseTo(1);
    expect(speedMultiplier(60, 20)).toBe(0.5);
    expect(speedMultiplier(1000, 20)).toBe(0.5);
  });
});
