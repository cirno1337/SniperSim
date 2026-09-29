import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../game/config";
import { generateScenario } from "../game/scenario";
import { optimalSettings, resolveShot } from "../game/shot";
import { App } from "./App";
import { Debrief } from "./components/Debrief";
import { GameScreen } from "./components/GameScreen";
import { Scope } from "./components/Scope";

const noop = () => {};

describe("UI smoke render", () => {
  it("renders the menu", () => {
    expect(renderToString(<App />)).toContain("START");
  });

  it("renders a game screen for every mode and difficulty", () => {
    for (const mode of ["training", "challenge"] as const) {
      for (const d of DIFFICULTIES) {
        const html = renderToString(
          <GameScreen setup={{ mode, difficultyId: d.id, weaponId: "random", lengthId: "5", shots: 5 }} sound={false} onToggleSound={noop} onExit={noop} onFinish={noop} />,
        );
        expect(html).toContain("FIRE");
        expect(html).toContain("DOPE card");
        if (mode === "challenge") expect(html).toContain("????");
      }
    }
  });

  it("renders scenes, impact markers and the debrief across many seeds", () => {
    for (let seed = 1; seed < 60; seed++) {
      const s = generateScenario({ seed, mode: seed % 2 ? "training" : "challenge", difficultyId: DIFFICULTIES[seed % 3].id, weaponId: "random" });
      const o = optimalSettings(s);
      const r = resolveShot(s, { elevationMil: o.elevationMil + 0.3, windageMil: 0, aimMil: s.target.centerMil, timeS: 12, rangeEstimateM: 400 });
      const html = renderToString(<Scope scenario={s} aim={s.target.centerMil} fov={22} phase="debrief" result={r} shotCount={1} onAim={noop} onWheel={noop} />);
      expect(html).not.toContain("NaN");
      const deb = renderToString(<Debrief scenario={s} result={r} last={false} onNext={noop} />);
      expect(deb).toMatch(/HIT|MISS/);
      expect(deb).not.toContain("NaN");
    }
  });
});
