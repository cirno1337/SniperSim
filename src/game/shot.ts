import { getLoad, solve } from "../engine/ballistics";
import { milToMeters } from "../engine/units";
import { getDifficulty, getWeapon } from "./config";
import { isHit, scoringRadius } from "./hit";
import { accuracy, score } from "./scoring";
import type { Scenario, ShotInput, ShotResult } from "./types";

/** Optimal scope settings for a scenario (what the player should have dialled). */
export function optimalSettings(s: Scenario, distanceM = s.distanceM) {
  const w = getWeapon(s.weaponId);
  return solve(getLoad(w.loadId), distanceM, w.zeroM, s.wind.crossMs);
}

/**
 * Resolve a shot: run the dialled settings through the ballistic tables, find where the bullet
 * lands relative to where the reticle was pointing, and compare that with the target.
 */
export function resolveShot(s: Scenario, input: ShotInput): ShotResult {
  const sol = optimalSettings(s);
  const dialErrorMil = { x: input.windageMil - sol.windageMil, y: input.elevationMil - sol.elevationMil };
  const impactMil = { x: input.aimMil.x + dialErrorMil.x, y: input.aimMil.y + dialErrorMil.y };
  const c = s.target.centerMil;
  const errorM = { x: milToMeters(impactMil.x - c.x, s.distanceM), y: milToMeters(impactMil.y - c.y, s.distanceM) };
  const errorDistM = Math.hypot(errorM.x, errorM.y);
  const hit = isHit(s.target, errorM);
  const acc = accuracy(errorDistM, scoringRadius(s.target));
  const difficulty = getDifficulty(s.difficultyId);

  let elevationAtEstimateMil: number | undefined;
  const est = input.rangeEstimateM;
  const load = getLoad(getWeapon(s.weaponId).loadId);
  if (est !== undefined && est > 0 && est <= load.rows[load.rows.length - 1].range) {
    elevationAtEstimateMil = optimalSettings(s, est).elevationMil;
  }

  return {
    input,
    hit,
    impactMil,
    errorM,
    errorDistM,
    optimal: { elevationMil: sol.elevationMil, windageMil: sol.windageMil },
    dialErrorMil,
    aimErrorMil: { x: input.aimMil.x - c.x, y: input.aimMil.y - c.y },
    elevationAtEstimateMil,
    tof: sol.tof,
    accuracy: acc,
    score: score({
      hit,
      accuracy: acc,
      distanceM: s.distanceM,
      timeS: input.timeS,
      parTimeS: difficulty.parTimeS,
      difficultyMultiplier: difficulty.scoreMultiplier,
    }),
  };
}
