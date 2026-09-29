export type Mode = "training" | "challenge";
export type TargetType = "plate" | "silhouette";
export type Environment = "field" | "forest" | "desert";

export interface Vec {
  x: number;
  y: number;
}

export interface Wind {
  speedMs: number;
  /** Clock position the wind blows *from* (12 = from the target, 3 = from the right, 9 = from the left). */
  fromClock: number;
  /** Full-value crosswind component, m/s, + = blowing left→right. */
  crossMs: number;
}

export interface Target {
  type: TargetType;
  widthM: number;
  heightM: number;
  /** Aim point (centre of mass) in scene mils, y up, relative to the horizon straight ahead. */
  centerMil: Vec;
  /** Height of the aim point above the ground, m. */
  centerHeightM: number;
}

export interface Scenario {
  seed: number;
  mode: Mode;
  difficultyId: string;
  weaponId: string;
  distanceM: number;
  wind: Wind;
  target: Target;
  environment: Environment;
  /** Parameters not shown numerically to the player (challenge mode). */
  hidden: { distance: boolean; wind: boolean };
  /** Distance to the wind flag, m (the flag shows the same wind as the scenario). */
  flagDistanceM: number;
  flagXMil: number;
}

export interface ScopeSettings {
  elevationMil: number;
  windageMil: number;
}

export interface ShotInput extends ScopeSettings {
  /** Where the reticle centre was pointing, scene mils. */
  aimMil: Vec;
  timeS: number;
  /** Player's range estimate (challenge mode), m. */
  rangeEstimateM?: number;
}

export interface ShotResult {
  input: ShotInput;
  hit: boolean;
  /** Impact in scene mils. */
  impactMil: Vec;
  /** Impact relative to the target aim point, m on the target plane (x right, y up). */
  errorM: Vec;
  errorDistM: number;
  optimal: ScopeSettings;
  /** Dialled minus optimal, mil. */
  dialErrorMil: Vec;
  /** Reticle position minus target aim point, mil. */
  aimErrorMil: Vec;
  /** Optimal elevation at the player's estimated range, when an estimate was given. */
  elevationAtEstimateMil?: number;
  tof: number;
  accuracy: number;
  score: number;
}
