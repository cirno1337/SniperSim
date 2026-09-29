import { getLoad, solve } from "../engine/ballistics";
import type { WeaponConfig } from "./config";

export interface DopeRow {
  distanceM: number;
  elevationMil: number;
  /** Windage magnitude for 1 m/s of full-value crosswind, mil (dial into the wind). */
  windPer1MsMil: number;
}

/**
 * DOPE card (data on previous engagements): the elevation/wind table a shooter carries.
 * The player gets this card, never the solution for the actual scenario.
 */
export function dopeCard(w: WeaponConfig, stepM: number): DopeRow[] {
  const load = getLoad(w.loadId);
  const rows: DopeRow[] = [];
  for (let d = w.rangeM[0]; d <= w.rangeM[1]; d += stepM) {
    const s = solve(load, d, w.zeroM, 1);
    rows.push({ distanceM: d, elevationMil: s.elevationMil, windPer1MsMil: Math.abs(s.windageMil) });
  }
  return rows;
}
