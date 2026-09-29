import { convert, unitCategories } from "@sniper/data/units";

const length = unitCategories.find((c) => c.id === "length")!;

/** Inches → metres, via the existing unit table of the sniper project. */
export function inchesToMeters(inches: number): number {
  return convert(inches, "in", "m", length)!;
}

export const MPH_TO_MS = 0.44704;

/** Angular size in mils of `meters` seen at `rangeM`: 1 mil = 1 m at 1000 m. */
export function metersToMil(meters: number, rangeM: number): number {
  return (meters / rangeM) * 1000;
}

export function milToMeters(mil: number, rangeM: number): number {
  return (mil * rangeM) / 1000;
}

/** Mil-relation formula (same as the sniper project's RangeEstimator): range = size·1000 / mils. */
export function milRelationRange(sizeM: number, mils: number): number {
  return (sizeM * 1000) / mils;
}
