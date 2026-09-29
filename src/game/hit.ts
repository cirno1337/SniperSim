import type { Target, TargetType, Vec } from "./types";

/** Silhouette proportions relative to the aim point (centre of mass), as fractions of height. */
export const SILHOUETTE = {
  bottom: -0.45, // ground, below centre of mass
  bodyTop: 0.33,
  headRadius: 0.12,
};

export function silhouetteHeadRadius(t: Pick<Target, "widthM" | "heightM">): number {
  return Math.min(SILHOUETTE.headRadius * t.heightM, 0.25 * t.widthM);
}

/** Height of the aim point above the ground for a target type, m. */
export function centerHeightAboveGround(type: TargetType, widthM: number, heightM: number): number {
  // Plates stand on a 0.6 m post; silhouettes stand on the ground.
  return type === "plate" ? 0.6 + widthM / 2 : -SILHOUETTE.bottom * heightM;
}

/**
 * Is an impact at `p` (metres relative to the aim point, x right, y up) inside the target?
 * Edges count as hits.
 */
export function isHit(target: Pick<Target, "type" | "widthM" | "heightM">, p: Vec): boolean {
  if (target.type === "plate") {
    const r = target.widthM / 2;
    return p.x * p.x + p.y * p.y <= r * r + 1e-12;
  }
  const h = target.heightM;
  const inBody = Math.abs(p.x) <= target.widthM / 2 && p.y >= SILHOUETTE.bottom * h && p.y <= SILHOUETTE.bodyTop * h;
  const r = silhouetteHeadRadius(target);
  const headY = (SILHOUETTE.bottom + 1) * h - r;
  const inHead = p.x * p.x + (p.y - headY) ** 2 <= r * r + 1e-12;
  return inBody || inHead;
}

/** Characteristic radius used for accuracy scoring, m. */
export function scoringRadius(target: Pick<Target, "type" | "widthM">): number {
  return target.widthM / 2;
}
