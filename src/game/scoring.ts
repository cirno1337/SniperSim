import { SCORING } from "./config";

/** 1.0 at the aim point, falling linearly to 0 at `accuracyZeroAtRadii` scoring radii. */
export function accuracy(errorDistM: number, scoringRadiusM: number, cfg = SCORING): number {
  const a = 1 - errorDistM / (cfg.accuracyZeroAtRadii * scoringRadiusM);
  return Math.min(1, Math.max(0, a));
}

export function distanceMultiplier(distanceM: number, cfg = SCORING): number {
  return cfg.distanceOffset + distanceM / cfg.distanceDivisor;
}

export function speedMultiplier(timeS: number, parTimeS: number, cfg = SCORING): number {
  const t = Math.max(0, timeS);
  if (t <= parTimeS) return cfg.speedFast + (1 - cfg.speedFast) * (t / parTimeS);
  const slowT = cfg.slowAtPar * parTimeS;
  if (t >= slowT) return cfg.speedSlow;
  return 1 + (cfg.speedSlow - 1) * ((t - parTimeS) / (slowT - parTimeS));
}

export interface ScoreInput {
  hit: boolean;
  accuracy: number;
  distanceM: number;
  timeS: number;
  parTimeS: number;
  difficultyMultiplier: number;
}

/** base × accuracy × distance × speed × difficulty. A miss scores 0. */
export function score(s: ScoreInput, cfg = SCORING): number {
  if (!s.hit) return 0;
  return Math.round(
    cfg.base *
      s.accuracy *
      distanceMultiplier(s.distanceM, cfg) *
      speedMultiplier(s.timeS, s.parTimeS, cfg) *
      s.difficultyMultiplier,
  );
}
