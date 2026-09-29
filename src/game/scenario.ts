import { crosswindMs } from "../engine/ballistics";
import { createRng } from "../engine/rng";
import { metersToMil } from "../engine/units";
import { DIFFICULTIES, EYE_HEIGHT_M, WEAPONS, getDifficulty, getWeapon, type DifficultyConfig, type WeaponConfig } from "./config";
import { centerHeightAboveGround } from "./hit";
import type { Environment, Mode, Scenario } from "./types";

export interface ScenarioOptions {
  seed: number;
  mode: Mode;
  difficultyId: string;
  /** Weapon id, or "random". */
  weaponId: string;
}

const ENVIRONMENTS: Environment[] = ["field", "forest", "desert"];

/** Distance band for a weapon at a difficulty, snapped to the difficulty's step. */
export function distanceBand(w: WeaponConfig, d: DifficultyConfig): [number, number] {
  const [lo, hi] = w.rangeM;
  const span = hi - lo;
  const step = d.distanceStep;
  const min = Math.ceil((lo + span * d.rangeFraction[0]) / step) * step;
  const max = Math.floor((lo + span * d.rangeFraction[1]) / step) * step;
  return [Math.max(min, lo), Math.min(max, hi)];
}

/** Vertical scene angle of the ground at a distance, mil (flat ground, eye above it). */
export function groundMil(distanceM: number): number {
  return -metersToMil(EYE_HEIGHT_M, distanceM);
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function generateScenario(opts: ScenarioOptions): Scenario {
  const rng = createRng(opts.seed);
  const difficulty = getDifficulty(opts.difficultyId);
  const weapon = opts.weaponId === "random" ? rng.pick(WEAPONS) : getWeapon(opts.weaponId);

  const [dMin, dMax] = distanceBand(weapon, difficulty);
  const distanceM = dMin + rng.int(0, Math.round((dMax - dMin) / difficulty.distanceStep)) * difficulty.distanceStep;

  const speedMs = snap(rng.range(difficulty.windMs[0], difficulty.windMs[1]), difficulty.windStep);
  const fromClock = rng.pick(difficulty.windClocks);
  const wind = { speedMs, fromClock, crossMs: speedMs === 0 ? 0 : crosswindMs(speedMs, fromClock) };

  const spec = rng.pick(difficulty.targets);
  const centerHeightM = centerHeightAboveGround(spec.type, spec.widthM, spec.heightM);
  const x = snap(rng.range(-difficulty.targetOffsetMil, difficulty.targetOffsetMil), 0.01);
  const y = groundMil(distanceM) + metersToMil(centerHeightM, distanceM);

  const hidden =
    opts.mode === "challenge" ? { distance: true, wind: difficulty.challengeHidesWind } : { distance: false, wind: false };

  const flagDistanceM = Math.round(distanceM * rng.range(0.35, 0.6));
  const flagSide = x > 0 ? -1 : 1;
  const flagXMil = flagSide * rng.range(2, 6);

  return {
    seed: opts.seed,
    mode: opts.mode,
    difficultyId: difficulty.id,
    weaponId: weapon.id,
    distanceM,
    wind,
    target: { type: spec.type, widthM: spec.widthM, heightM: spec.heightM, centerMil: { x, y }, centerHeightM },
    environment: rng.pick(ENVIRONMENTS),
    hidden,
    flagDistanceM,
    flagXMil,
  };
}

export { DIFFICULTIES };
