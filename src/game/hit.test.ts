import { describe, expect, it } from "vitest";
import { isHit, silhouetteHeadRadius } from "./hit";

const plate = { type: "plate" as const, widthM: 0.4, heightM: 0.4 };
const sil = { type: "silhouette" as const, widthM: 0.5, heightM: 1.0 };

describe("hit detection", () => {
  it("direct hit", () => {
    expect(isHit(plate, { x: 0, y: 0 })).toBe(true);
    expect(isHit(sil, { x: 0, y: 0 })).toBe(true);
  });

  it("edge hit", () => {
    expect(isHit(plate, { x: 0.2, y: 0 })).toBe(true);
    expect(isHit(plate, { x: 0.2 * Math.SQRT1_2, y: -0.2 * Math.SQRT1_2 })).toBe(true);
    expect(isHit(sil, { x: 0.25, y: 0 })).toBe(true);
  });

  it("near miss", () => {
    expect(isHit(plate, { x: 0.201, y: 0 })).toBe(false);
    expect(isHit(plate, { x: 0.15, y: 0.15 })).toBe(false); // inside the bounding box, outside the circle
    expect(isHit(sil, { x: 0.26, y: 0 })).toBe(false);
    // beside the head, above the shoulders
    expect(isHit(sil, { x: 0.2, y: 0.45 })).toBe(false);
  });

  it("head shot counts", () => {
    const r = silhouetteHeadRadius(sil);
    expect(isHit(sil, { x: 0, y: 0.55 - r })).toBe(true);
    expect(isHit(sil, { x: 0, y: 0.56 })).toBe(false);
  });

  it("clear miss", () => {
    expect(isHit(plate, { x: 0.8, y: -0.4 })).toBe(false);
    expect(isHit(sil, { x: 0, y: -1 })).toBe(false);
  });
});
