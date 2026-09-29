import { useCallback, useEffect, useState } from "react";
import { SCOPE, getDifficulty } from "../../game/config";
import { sessionStats } from "../../game/session";
import type { ShotResult } from "../../game/types";
import { useGame, type SessionSetup } from "../useGame";
import { Briefing, DopeCard } from "./Briefing";
import { Controls } from "./Controls";
import { Debrief } from "./Debrief";
import { Scope } from "./Scope";

interface Props {
  setup: SessionSetup;
  sound: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onFinish: (results: ShotResult[]) => void;
}

export function GameScreen({ setup, sound, onToggleSound, onExit, onFinish }: Props) {
  const { state, dispatch, fire, next, complete } = useGame(setup, sound);
  const { scenario, phase, result } = state;
  const [now, setNow] = useState(() => performance.now());
  const stats = sessionStats(state.results);

  useEffect(() => {
    if (phase !== "aiming") return;
    const id = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const results = state.results;
  const advance = useCallback(() => (complete ? onFinish(results) : next()), [complete, onFinish, results, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement;
      if (inInput && e.key !== "Enter") return;
      const big = e.shiftKey ? 1 : SCOPE.clickMil;
      const k = e.key.toLowerCase();
      let handled = true;
      if (phase === "debrief") {
        if (k === "enter" || k === "n") advance();
        else handled = false;
      } else if (k === " " || k === "enter") fire();
      else if (k === "w") dispatch({ type: "dial", elevation: big });
      else if (k === "s") dispatch({ type: "dial", elevation: -big });
      else if (k === "d") dispatch({ type: "dial", windage: big });
      else if (k === "a") dispatch({ type: "dial", windage: -big });
      else if (k === "r") dispatch({ type: "resetTurrets" });
      else if (k === "arrowleft") dispatch({ type: "aim", dx: -big, dy: 0 });
      else if (k === "arrowright") dispatch({ type: "aim", dx: big, dy: 0 });
      else if (k === "arrowup") dispatch({ type: "aim", dx: 0, dy: big });
      else if (k === "arrowdown") dispatch({ type: "aim", dx: 0, dy: -big });
      else handled = false;
      if (k === "z" || k === "x") {
        dispatch({ type: "zoom", delta: k === "z" ? 1 : -1 });
        handled = true;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, fire, advance, dispatch]);

  const elapsed = phase === "aiming" ? (now - state.startedAt) / 1000 : (result?.input.timeS ?? 0);
  const fov = SCOPE.fovMil[state.zoom];
  const d = getDifficulty(setup.difficultyId);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-800 px-4 py-3 lg:px-6">
        <button onClick={onExit} className="text-sm font-semibold tracking-[0.2em] text-neutral-100 hover:text-amber-400">
          SCOPE<span className="text-amber-500">/</span>TRAINER
        </button>
        <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs uppercase tracking-wider text-neutral-300">
          {setup.mode} · {d.label}
        </span>
        <dl className="num flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Stat k="Shot" v={`${state.shotCount + (phase === "aiming" ? 1 : 0)}${setup.shots ? ` / ${setup.shots}` : ""}`} />
          <Stat k="Hits" v={stats.hits} />
          <Stat k="Misses" v={stats.misses} />
          <Stat k="Accuracy" v={stats.shots ? `${Math.round(stats.accuracy * 100)}%` : "—"} />
          <Stat k="Score" v={stats.score.toLocaleString("en-US")} />
          <Stat k="Streak" v={stats.streak} />
        </dl>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={onToggleSound} className="text-xs text-neutral-400 hover:text-neutral-100" aria-pressed={sound}>
            Sound {sound ? "on" : "off"}
          </button>
          {setup.shots === null && state.results.length > 0 && (
            <button onClick={() => onFinish(state.results)} className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-neutral-500">
              End session
            </button>
          )}
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[290px_minmax(0,1fr)_320px] lg:p-6">
        <div className="order-2 space-y-4 lg:order-1">
          <Briefing scenario={scenario} />
          <DopeCard scenario={scenario} />
        </div>

        <div className="order-1 flex flex-col items-center gap-3 lg:order-2">
          <Scope
            scenario={scenario}
            aim={state.aim}
            fov={fov}
            phase={phase}
            result={result}
            shotCount={state.shotCount}
            onAim={(dx, dy) => dispatch({ type: "aim", dx, dy })}
            onWheel={(e, w) => dispatch({ type: "dial", elevation: e, windage: w })}
          />
          <p className="num text-xs text-neutral-500">
            FOV {fov} MIL · first focal plane: 1 hash = 1 MIL at every zoom · <span className="text-neutral-400">Z / X</span> zoom
          </p>
        </div>

        <div className="order-3 space-y-4">
          {phase === "debrief" && result ? (
            <Debrief scenario={scenario} result={result} last={complete} onNext={advance} />
          ) : (
            <Controls
              scenario={scenario}
              elevation={state.elevation}
              windage={state.windage}
              estimate={state.estimate}
              disabled={phase !== "aiming"}
              zoom={state.zoom}
              elapsed={elapsed}
              onDial={(e, w) => dispatch({ type: "dial", elevation: e, windage: w })}
              onReset={() => dispatch({ type: "resetTurrets" })}
              onZoom={(delta) => dispatch({ type: "zoom", delta })}
              onEstimate={(value) => dispatch({ type: "estimate", value })}
              onFire={fire}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[11px] uppercase tracking-wider text-neutral-500">{k}</dt>
      <dd className="text-neutral-100">{v}</dd>
    </div>
  );
}
