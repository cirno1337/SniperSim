import { useCallback, useEffect, useReducer, useRef } from "react";
import { randomSeed } from "../engine/rng";
import { SCOPE } from "../game/config";
import { generateScenario } from "../game/scenario";
import { isSessionComplete } from "../game/session";
import { resolveShot } from "../game/shot";
import type { Mode, Scenario, ShotResult, Vec } from "../game/types";
import { playRing, playShot, playThud } from "./audio";

export interface SessionSetup {
  mode: Mode;
  difficultyId: string;
  /** Weapon id or "random". */
  weaponId: string;
  lengthId: string;
  shots: number | null;
}

export type Phase = "aiming" | "inflight" | "debrief";

interface State {
  setup: SessionSetup;
  scenario: Scenario;
  startedAt: number;
  elevation: number;
  windage: number;
  aim: Vec;
  zoom: number;
  estimate: string;
  phase: Phase;
  result: ShotResult | null;
  results: ShotResult[];
  shotCount: number;
}

type Action =
  | { type: "dial"; elevation?: number; windage?: number }
  | { type: "resetTurrets" }
  | { type: "aim"; dx: number; dy: number }
  | { type: "zoom"; delta: number }
  | { type: "estimate"; value: string }
  | { type: "fire"; now: number }
  | { type: "land" }
  | { type: "next"; now: number };

const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));
const toClick = (v: number) => Math.round(v / SCOPE.clickMil) * SCOPE.clickMil;

function newScenario(setup: SessionSetup): Scenario {
  return generateScenario({ seed: randomSeed(), mode: setup.mode, difficultyId: setup.difficultyId, weaponId: setup.weaponId });
}

function freshShot(setup: SessionSetup, now: number) {
  return {
    scenario: newScenario(setup),
    startedAt: now,
    elevation: 0,
    windage: 0,
    aim: { x: 0, y: 0 },
    estimate: "",
    phase: "aiming" as Phase,
    result: null,
  };
}

function reducer(s: State, a: Action): State {
  const locked = s.phase !== "aiming";
  switch (a.type) {
    case "dial":
      if (locked) return s;
      return {
        ...s,
        elevation: clamp(toClick(s.elevation + (a.elevation ?? 0)), SCOPE.elevationMil),
        windage: clamp(toClick(s.windage + (a.windage ?? 0)), SCOPE.windageMil),
      };
    case "resetTurrets":
      return locked ? s : { ...s, elevation: 0, windage: 0 };
    case "aim":
      if (locked) return s;
      return { ...s, aim: { x: clamp(s.aim.x + a.dx, [-40, 40]), y: clamp(s.aim.y + a.dy, [-20, 20]) } };
    case "zoom":
      return { ...s, zoom: clamp(s.zoom + a.delta, [0, SCOPE.fovMil.length - 1]) };
    case "estimate":
      return locked ? s : { ...s, estimate: a.value };
    case "fire": {
      if (locked) return s;
      const est = parseFloat(s.estimate.replace(",", "."));
      const result = resolveShot(s.scenario, {
        elevationMil: s.elevation,
        windageMil: s.windage,
        aimMil: s.aim,
        timeS: (a.now - s.startedAt) / 1000,
        rangeEstimateM: Number.isFinite(est) && est > 0 ? Math.round(est) : undefined,
      });
      return { ...s, phase: "inflight", result, results: [...s.results, result], shotCount: s.shotCount + 1 };
    }
    case "land":
      return s.phase === "inflight" ? { ...s, phase: "debrief" } : s;
    case "next":
      if (s.phase !== "debrief" || isSessionComplete(s.setup.shots, s.shotCount)) return s;
      return { ...s, ...freshShot(s.setup, a.now) };
  }
}

export function useGame(setup: SessionSetup, sound: boolean) {
  const [state, dispatch] = useReducer(reducer, setup, (st): State => ({
    setup: st,
    ...freshShot(st, performance.now()),
    zoom: 1,
    results: [],
    shotCount: 0,
  }));

  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // bullet flight: impact is revealed after the (table) time of flight
  useEffect(() => {
    if (state.phase !== "inflight" || !state.result) return;
    const r = state.result;
    if (soundRef.current) playShot();
    const id = window.setTimeout(() => {
      dispatch({ type: "land" });
      if (soundRef.current) (r.hit ? playRing : playThud)();
    }, Math.min(2000, r.tof * 1000));
    return () => window.clearTimeout(id);
  }, [state.phase, state.result]);

  const fire = useCallback(() => dispatch({ type: "fire", now: performance.now() }), []);
  const next = useCallback(() => dispatch({ type: "next", now: performance.now() }), []);

  return {
    state,
    dispatch,
    fire,
    next,
    complete: isSessionComplete(setup.shots, state.shotCount) && state.phase === "debrief",
  };
}
