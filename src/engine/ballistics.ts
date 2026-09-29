/**
 * Thin adapter over the existing Appendix H tables (`@sniper/data/ballistics`).
 * It does not model drag or gravity itself: every value is read from the tables and only
 * interpolated between the 100 m rows, re-zeroed by line-of-sight rotation, or scaled for wind.
 */
import { ballisticLoads, type BallisticLoad, type BallisticRow } from "@sniper/data/ballistics";
import { inchesToMeters, MPH_TO_MS, metersToMil } from "./units";

/** Crosswind the tables' drift column was computed for (10 mph, full value). */
export const TABLE_WIND_MS = 10 * MPH_TO_MS;

export function getLoad(id: string): BallisticLoad {
  const load = ballisticLoads.find((l) => l.id === id);
  if (!load) throw new Error(`Unknown ballistic load: ${id}`);
  return load;
}

export function maxTableRange(load: BallisticLoad): number {
  return load.rows[load.rows.length - 1].range;
}

/** 4-point cubic Lagrange interpolation of a table column; exact at table rows. */
export function interpolate(load: BallisticLoad, rangeM: number, pick: (r: BallisticRow) => number): number {
  const rows = load.rows;
  if (rangeM < 0 || rangeM > maxTableRange(load)) {
    throw new RangeError(`Range ${rangeM} m outside table (0–${maxTableRange(load)} m) for ${load.id}`);
  }
  const exact = rows.find((r) => r.range === rangeM);
  if (exact) return pick(exact);

  let i = rows.findIndex((r) => r.range > rangeM) - 1; // rows[i] < range < rows[i+1]
  i = Math.min(Math.max(i - 1, 0), rows.length - 4); // window start
  const win = rows.slice(i, i + 4);
  let sum = 0;
  for (let j = 0; j < 4; j++) {
    let w = 1;
    for (let k = 0; k < 4; k++) {
      if (k !== j) w *= (rangeM - win[k].range) / (win[j].range - win[k].range);
    }
    sum += w * pick(win[j]);
  }
  return sum;
}

/** Bullet path relative to the line of sight, in metres, for the table's own zero. */
export function tablePathM(load: BallisticLoad, rangeM: number): number {
  return inchesToMeters(interpolate(load, rangeM, (r) => r.bulletPath));
}

/**
 * Bullet path (m, + = above line of sight) with the scope zeroed at `zeroM` instead of the
 * table zero. Re-zeroing rotates the line of sight about the scope: path − path(Z)·R/Z.
 */
export function pathM(load: BallisticLoad, rangeM: number, zeroM: number): number {
  if (rangeM === 0) return tablePathM(load, 0);
  return tablePathM(load, rangeM) - (tablePathM(load, zeroM) * rangeM) / zeroM;
}

/**
 * Horizontal wind drift in metres (+ = right) for a crosswind component `crossMs`
 * (+ = blowing left→right). Drift scales linearly with the crosswind component.
 */
export function windDriftM(load: BallisticLoad, rangeM: number, crossMs: number): number {
  const drift10 = Math.abs(inchesToMeters(interpolate(load, rangeM, (r) => r.drift)));
  return drift10 * (crossMs / TABLE_WIND_MS);
}

export function timeOfFlight(load: BallisticLoad, rangeM: number): number {
  return interpolate(load, rangeM, (r) => r.tof);
}

/** Velocity at range, m/s. */
export function velocityMs(load: BallisticLoad, rangeM: number): number {
  return interpolate(load, rangeM, (r) => r.v) * 0.3048;
}

/**
 * Crosswind component (m/s, + = blowing left→right) of a wind blowing *from* a clock position.
 * 12 o'clock = from the target (headwind), 3 = from the right, 9 = from the left.
 */
export function crosswindMs(speedMs: number, fromClock: number): number {
  return -speedMs * Math.sin((fromClock / 12) * 2 * Math.PI);
}

export interface FiringSolution {
  /** Elevation to dial, mil (+ = up). */
  elevationMil: number;
  /** Windage to dial, mil (+ = right). */
  windageMil: number;
  pathM: number;
  driftM: number;
  tof: number;
}

/** Scope settings that put the bullet exactly on the aim point. */
export function solve(load: BallisticLoad, rangeM: number, zeroM: number, crossMs: number): FiringSolution {
  const p = pathM(load, rangeM, zeroM);
  const d = windDriftM(load, rangeM, crossMs);
  return {
    elevationMil: -metersToMil(p, rangeM),
    windageMil: -metersToMil(d, rangeM),
    pathM: p,
    driftM: d,
    tof: timeOfFlight(load, rangeM),
  };
}

/**
 * Point of impact, in mils relative to the reticle centre, for the dialled settings.
 * Dialling rotates the bore by (elevation, windage) mil relative to the line of sight.
 */
export function impactOffsetMil(
  load: BallisticLoad,
  rangeM: number,
  zeroM: number,
  crossMs: number,
  elevationMil: number,
  windageMil: number,
): { x: number; y: number } {
  const s = solve(load, rangeM, zeroM, crossMs);
  return { x: windageMil - s.windageMil, y: elevationMil - s.elevationMil };
}
