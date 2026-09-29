import { describe, expect, it } from "vitest";
import { explainShot } from "./explain";
import { generateScenario } from "./scenario";
import { optimalSettings, resolveShot } from "./shot";

const s = generateScenario({ seed: 99, mode: "challenge", difficultyId: "medium", weaponId: "556" });
const o = optimalSettings(s);
const perfect = { elevationMil: o.elevationMil, windageMil: o.windageMil, aimMil: { ...s.target.centerMil }, timeS: 8 };

describe("shot explanation", () => {
  it("clean shot", () => {
    expect(explainShot(s, resolveShot(s, perfect)).map((c) => c.kind)).toEqual(["clean"]);
  });

  it("names the elevation and windage errors with direction", () => {
    const r = resolveShot(s, { ...perfect, elevationMil: perfect.elevationMil - 0.4, windageMil: perfect.windageMil + 0.3 });
    const c = explainShot(s, r);
    expect(c.find((x) => x.kind === "elevation")?.text).toMatch(/0\.40 MIL too low/);
    expect(c.find((x) => x.kind === "windage")?.text).toMatch(/0\.30 MIL too far right/);
  });

  it("explains a bad range estimate", () => {
    const r = resolveShot(s, { ...perfect, rangeEstimateM: s.distanceM - 50 });
    expect(explainShot(s, r).some((x) => x.kind === "range" && /less than needed/.test(x.text))).toBe(true);
  });
});
