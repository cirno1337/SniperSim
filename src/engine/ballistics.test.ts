import { describe, expect, it } from "vitest";
import { ballisticLoads } from "@sniper/data/ballistics";
import {
  TABLE_WIND_MS,
  crosswindMs,
  getLoad,
  impactOffsetMil,
  interpolate,
  pathM,
  solve,
  tablePathM,
  windDriftM,
} from "./ballistics";

const load556 = getLoad("556");
const load762 = getLoad("m118lr");
const IN = 0.0254;

describe("ballistics adapter over the existing Appendix H tables", () => {
  it("uses the sniper project's table objects directly", () => {
    expect(load556).toBe(ballisticLoads.find((l) => l.id === "556"));
  });

  it("is exact at table rows", () => {
    expect(tablePathM(load556, 300)).toBeCloseTo(-12.16 * IN, 10);
    expect(tablePathM(load762, 800)).toBeCloseTo(-259.14 * IN, 10);
    expect(interpolate(load762, 500, (r) => r.tof)).toBe(0.774);
  });

  it("interpolates smoothly between rows", () => {
    const a = tablePathM(load556, 600);
    const b = tablePathM(load556, 700);
    const mid = tablePathM(load556, 650);
    expect(mid).toBeLessThan(a);
    expect(mid).toBeGreaterThan(b);
    // The trajectory is concave, so the curve sits above the straight chord between rows.
    expect(mid).toBeGreaterThan((a + b) / 2);
  });

  it("rejects ranges outside the table", () => {
    expect(() => tablePathM(load556, 1200)).toThrow(RangeError);
  });

  it("re-zeroed rifle has zero path at the zero distance", () => {
    expect(pathM(load556, 100, 100)).toBeCloseTo(0, 12);
    expect(pathM(load762, 300, 300)).toBeCloseTo(0, 12);
    // re-zeroing to the table's own zero changes nothing
    expect(pathM(load556, 500, 200)).toBeCloseTo(tablePathM(load556, 500), 12);
  });

  it("needs more elevation the further the target is (beyond zero)", () => {
    let prev = 0;
    for (let d = 150; d <= 800; d += 50) {
      const e = solve(load762, d, 100, 0).elevationMil;
      expect(e).toBeGreaterThan(prev);
      prev = e;
    }
  });

  it("matches hand-computed 100 m-zero solution at 600 m for 5.56", () => {
    // path(600) = -132.23 in, path(100) = +2.78 in → re-zeroed -148.91 in = -3.782 m → 6.30 mil
    expect(solve(load556, 600, 100, 0).elevationMil).toBeCloseTo((148.91 * IN * 1000) / 600, 6);
  });

  it("scales wind drift linearly with the crosswind component", () => {
    expect(windDriftM(load556, 500, 0)).toBe(0);
    expect(windDriftM(load556, 500, TABLE_WIND_MS)).toBeCloseTo(36.15 * IN, 10);
    expect(windDriftM(load556, 500, 2 * TABLE_WIND_MS)).toBeCloseTo(2 * 36.15 * IN, 10);
    expect(windDriftM(load556, 500, -TABLE_WIND_MS)).toBeCloseTo(-36.15 * IN, 10);
  });

  it("converts clock wind into a crosswind component", () => {
    expect(crosswindMs(4, 9)).toBeCloseTo(4); // from the left → blows right
    expect(crosswindMs(4, 3)).toBeCloseTo(-4); // from the right → blows left
    expect(crosswindMs(4, 12)).toBeCloseTo(0);
    expect(crosswindMs(4, 6)).toBeCloseTo(0);
    expect(crosswindMs(4, 10)).toBeCloseTo(4 * Math.sin(Math.PI / 3));
  });

  it("wind from the left pushes the bullet right; the solution dials left", () => {
    const s = solve(load762, 500, 100, crosswindMs(3, 9));
    expect(s.driftM).toBeGreaterThan(0);
    expect(s.windageMil).toBeLessThan(0);
  });

  it("optimal settings put the impact on the aim point; errors move it predictably", () => {
    const cross = crosswindMs(3, 9);
    const s = solve(load762, 623, 100, cross);
    const perfect = impactOffsetMil(load762, 623, 100, cross, s.elevationMil, s.windageMil);
    expect(perfect.x).toBeCloseTo(0, 12);
    expect(perfect.y).toBeCloseTo(0, 12);
    const low = impactOffsetMil(load762, 623, 100, cross, s.elevationMil - 0.5, s.windageMil);
    expect(low.y).toBeCloseTo(-0.5, 12);
    const noWindCall = impactOffsetMil(load762, 623, 100, cross, s.elevationMil, 0);
    expect(noWindCall.x).toBeGreaterThan(0); // drifted right with the wind
  });
});
