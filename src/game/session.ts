import type { ShotResult } from "./types";

export interface SessionStats {
  shots: number;
  hits: number;
  misses: number;
  /** Mean shot accuracy, 0–1. */
  accuracy: number;
  score: number;
  streak: number;
  bestStreak: number;
}

export function sessionStats(results: ShotResult[]): SessionStats {
  let streak = 0;
  let bestStreak = 0;
  for (const r of results) {
    streak = r.hit ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }
  const hits = results.filter((r) => r.hit).length;
  return {
    shots: results.length,
    hits,
    misses: results.length - hits,
    accuracy: results.length ? results.reduce((a, r) => a + r.accuracy, 0) / results.length : 0,
    score: results.reduce((a, r) => a + r.score, 0),
    streak,
    bestStreak,
  };
}

/** `shots === null` means endless. */
export function isSessionComplete(shots: number | null, fired: number): boolean {
  return shots !== null && fired >= shots;
}
