import { useState } from "react";
import { DIFFICULTIES, SESSION_LENGTHS, WEAPONS } from "../../game/config";
import type { Mode } from "../../game/types";
import { bestKey, bestScores } from "../storage";
import type { SessionSetup } from "../useGame";
import { Kbd, Panel, Segmented } from "./ui";

const MODES: { id: Mode; title: string; body: string }[] = [
  {
    id: "training",
    title: "Training",
    body: "Distance and wind are given. After each shot you see your settings next to the optimal solution, and the reason for the miss.",
  },
  {
    id: "challenge",
    title: "Challenge",
    body: "Distance is hidden (and wind too on medium/hard). Range the target with the mil reticle, read the wind flag, then solve.",
  },
];

export function Menu({ initial, onStart }: { initial: SessionSetup; onStart: (s: SessionSetup) => void }) {
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [difficultyId, setDifficultyId] = useState(initial.difficultyId);
  const [weaponId, setWeaponId] = useState(initial.weaponId);
  const [lengthId, setLengthId] = useState(initial.lengthId);
  const length = SESSION_LENGTHS.find((l) => l.id === lengthId)!;
  const setup: SessionSetup = { mode, difficultyId, weaponId, lengthId, shots: length.shots };
  const best = bestScores()[bestKey(setup)];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
      <p className="text-sm font-semibold tracking-[0.3em] text-neutral-100">
        SCOPE<span className="text-amber-500">/</span>TRAINER
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-neutral-50 lg:text-4xl">
        Dial it, hold it, send it. Ballistics from the FM 3-05.222 tables.
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-400">
        Each target is procedurally generated. Work out elevation and windage from your DOPE card, dial the turrets, aim and fire.
        Every impact is calculated from the Appendix H trajectory data for 5.56 and 7.62 NATO.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`rounded-lg border p-5 text-left transition-colors ${
              mode === m.id ? "border-amber-500 bg-amber-500/5" : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-neutral-50">{m.title}</span>
              <span className={`h-3 w-3 rounded-full border ${mode === m.id ? "border-amber-400 bg-amber-400" : "border-neutral-600"}`} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">{m.body}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <div className="label mb-2">Difficulty</div>
          <Segmented label="Difficulty" value={difficultyId} onChange={setDifficultyId} options={DIFFICULTIES.map((d) => ({ id: d.id, label: d.label, hint: d.description }))} />
          <p className="mt-2 text-xs text-neutral-500">{DIFFICULTIES.find((d) => d.id === difficultyId)?.description}</p>
        </div>
        <div>
          <div className="label mb-2">Rifle</div>
          <Segmented
            label="Rifle"
            value={weaponId}
            onChange={setWeaponId}
            options={[{ id: "random", label: "Random" }, ...WEAPONS.map((w) => ({ id: w.id, label: w.caliber.replace(" NATO", ""), hint: `${w.rifle}, ${w.ammo}` }))]}
          />
          <p className="mt-2 text-xs text-neutral-500">5.56: 100–600 m · 7.62: 100–800 m · both zeroed at 100 m</p>
        </div>
        <div>
          <div className="label mb-2">Session</div>
          <Segmented label="Session" value={lengthId} onChange={setLengthId} options={SESSION_LENGTHS.map((l) => ({ id: l.id, label: l.shots ? String(l.shots) : "∞", hint: l.label }))} />
          <p className="mt-2 text-xs text-neutral-500">
            {length.label}
            {best ? ` · best ${best.toLocaleString("en-US")}` : ""}
          </p>
        </div>
      </div>

      <button
        onClick={() => onStart(setup)}
        className="mt-8 rounded-md bg-amber-500 px-8 py-3 text-base font-semibold tracking-widest text-neutral-950 hover:bg-amber-400"
      >
        START
      </button>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Panel title="How a shot works">
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-neutral-300">
            <li>Read the task: distance, wind, target. In challenge mode, measure them yourself.</li>
            <li>Look up elevation and wind per m/s on the DOPE card and interpolate.</li>
            <li>Dial elevation (up) and windage (into the wind) in 0.1 MIL clicks.</li>
            <li>Put the reticle centre on the target centre and fire.</li>
            <li>The round flies the tabulated trajectory. The debrief shows exactly why it hit or missed.</li>
          </ol>
        </Panel>
        <Panel title="Controls">
          <ul className="space-y-1.5 text-sm text-neutral-300">
            <li><Kbd>Drag</Kbd> / <Kbd>←↑↓→</Kbd> aim (0.1 MIL, <Kbd>Shift</Kbd> 1 MIL)</li>
            <li><Kbd>W</Kbd> <Kbd>S</Kbd> or wheel: elevation · <Kbd>A</Kbd> <Kbd>D</Kbd> or <Kbd>Shift</Kbd>+wheel: windage</li>
            <li><Kbd>Z</Kbd> <Kbd>X</Kbd> zoom · <Kbd>R</Kbd> reset turrets</li>
            <li><Kbd>Space</Kbd> fire · <Kbd>Enter</Kbd> next target</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
