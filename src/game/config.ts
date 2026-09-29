import type { TargetType } from "./types";

/**
 * Data-driven game configuration. Adding a calibre means adding a `WeaponConfig` that points at
 * a load from the existing sniper ballistic tables; no other code needs to change.
 */
export interface WeaponConfig {
  id: string;
  caliber: string;
  rifle: string;
  /** Load id in `@sniper/data/ballistics`. */
  loadId: string;
  ammo: string;
  /** Distance the scope is zeroed at, m. */
  zeroM: number;
  /** Gameplay distance band, m. */
  rangeM: [number, number];
}

export const WEAPONS: WeaponConfig[] = [
  {
    id: "556",
    caliber: "5.56 NATO",
    rifle: "Mk 12 SPR",
    loadId: "556",
    ammo: "77 gr SPR (Mk 262)",
    zeroM: 100,
    rangeM: [100, 600],
  },
  {
    id: "762",
    caliber: "7.62 NATO",
    rifle: "M110 SASS",
    loadId: "m118lr",
    ammo: "M118LR 175 gr SMK",
    zeroM: 100,
    rangeM: [100, 800],
  },
];

export function getWeapon(id: string): WeaponConfig {
  const w = WEAPONS.find((x) => x.id === id);
  if (!w) throw new Error(`Unknown weapon: ${id}`);
  return w;
}

export const SCOPE = {
  clickMil: 0.1,
  elevationMil: [-2, 15] as [number, number],
  windageMil: [-8, 8] as [number, number],
  /** Field of view per zoom step, mil. The reticle is first-focal-plane, so it scales with it. */
  fovMil: [36, 22, 12],
};

/** Shooter's eye height above the ground, m (prone on a slight rise). */
export const EYE_HEIGHT_M = 0.6;

export interface TargetSpec {
  type: TargetType;
  widthM: number;
  heightM: number;
}

export interface DifficultyConfig {
  id: string;
  label: string;
  description: string;
  /** Fraction of the weapon's distance band used by this difficulty. */
  rangeFraction: [number, number];
  /** Distances are multiples of this, m. */
  distanceStep: number;
  windMs: [number, number];
  windStep: number;
  windClocks: number[];
  targets: TargetSpec[];
  /** Max horizontal target offset from straight ahead, mil. */
  targetOffsetMil: number;
  /** Row spacing of the DOPE card, m. */
  dopeStepM: number;
  /** Challenge mode also hides the numeric wind. */
  challengeHidesWind: boolean;
  parTimeS: number;
  scoreMultiplier: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "easy",
    label: "Easy",
    description: "Short range, light full-value wind, large targets",
    rangeFraction: [0, 0.45],
    distanceStep: 50,
    windMs: [0, 3],
    windStep: 1,
    windClocks: [3, 9],
    targets: [
      { type: "plate", widthM: 0.6, heightM: 0.6 },
      { type: "silhouette", widthM: 0.5, heightM: 1.0 },
    ],
    targetOffsetMil: 5,
    dopeStepM: 50,
    challengeHidesWind: false,
    parTimeS: 30,
    scoreMultiplier: 1,
  },
  {
    id: "medium",
    label: "Medium",
    description: "Longer range, moderate wind from any quarter, smaller targets",
    rangeFraction: [0.25, 0.8],
    distanceStep: 10,
    windMs: [1, 5],
    windStep: 0.5,
    windClocks: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
    targets: [
      { type: "plate", widthM: 0.4, heightM: 0.4 },
      { type: "silhouette", widthM: 0.45, heightM: 0.9 },
    ],
    targetOffsetMil: 7,
    dopeStepM: 100,
    challengeHidesWind: true,
    parTimeS: 25,
    scoreMultiplier: 1.5,
  },
  {
    id: "hard",
    label: "Hard",
    description: "Long range, strong wind, small targets, odd distances",
    rangeFraction: [0.5, 1],
    distanceStep: 1,
    windMs: [2, 8],
    windStep: 0.5,
    windClocks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    targets: [
      { type: "plate", widthM: 0.25, heightM: 0.25 },
      { type: "silhouette", widthM: 0.4, heightM: 0.75 },
    ],
    targetOffsetMil: 9,
    dopeStepM: 100,
    challengeHidesWind: true,
    parTimeS: 20,
    scoreMultiplier: 2,
  },
];

export function getDifficulty(id: string): DifficultyConfig {
  const d = DIFFICULTIES.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown difficulty: ${id}`);
  return d;
}

/** Scoring knobs. The formula lives in scoring.ts: base × accuracy × distance × speed × difficulty. */
export const SCORING = {
  base: 1000,
  /** Accuracy falls linearly to 0 at this many "scoring radii" from the aim point. */
  accuracyZeroAtRadii: 3,
  /** distanceMultiplier = distanceOffset + distanceM / distanceDivisor */
  distanceOffset: 0.5,
  distanceDivisor: 400,
  /** Speed multiplier: `fast` at 0 s, 1.0 at par time, `slow` at `slowAtPar` × par, clamped. */
  speedFast: 1.5,
  speedSlow: 0.5,
  slowAtPar: 3,
};

export const SESSION_LENGTHS = [
  { id: "quick", label: "Quick challenge", shots: 1 },
  { id: "5", label: "5 shot session", shots: 5 },
  { id: "10", label: "10 shot session", shots: 10 },
  { id: "endless", label: "Endless", shots: null },
] as const;
