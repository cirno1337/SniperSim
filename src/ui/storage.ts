/** Per-browser conveniences (best scores, sound toggle). Every access is guarded: storage may be unavailable. */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const bestKey = (s: { mode: string; difficultyId: string; lengthId: string }) => `${s.mode}:${s.difficultyId}:${s.lengthId}`;

const BEST_KEY = "scope-trainer:best";
const SOUND_KEY = "scope-trainer:sound";

export function bestScores(): Record<string, number> {
  return read(BEST_KEY, {});
}

/** Stores the score if it beats the previous best for this key; returns true if it did. */
export function recordBest(key: string, score: number): boolean {
  const all = bestScores();
  if (score <= (all[key] ?? 0)) return false;
  write(BEST_KEY, { ...all, [key]: score });
  return true;
}

export function soundEnabled(): boolean {
  return read(SOUND_KEY, true);
}

export function setSoundEnabled(on: boolean): void {
  write(SOUND_KEY, on);
}
