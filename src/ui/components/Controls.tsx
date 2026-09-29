import { SCOPE } from "../../game/config";
import type { Scenario } from "../../game/types";
import { turret } from "../format";
import { Kbd, Panel } from "./ui";

interface TurretProps {
  label: string;
  value: number;
  pos: string;
  neg: string;
  decKey: string;
  incKey: string;
  disabled: boolean;
  onChange: (delta: number) => void;
}

function Turret({ label, value, pos, neg, decKey, incKey, disabled, onChange }: TurretProps) {
  const btn =
    "num rounded-md border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-40";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="text-[10px] text-neutral-600">
          <Kbd>{decKey}</Kbd> <Kbd>{incKey}</Kbd>
        </span>
      </div>
      <div className="grid grid-cols-[auto_auto_1fr_auto_auto] items-stretch gap-1">
        <button className={btn} disabled={disabled} onClick={() => onChange(-1)} aria-label={`${label} −1.0 mil`}>
          −1
        </button>
        <button className={btn} disabled={disabled} onClick={() => onChange(-SCOPE.clickMil)} aria-label={`${label} −0.1 mil`}>
          −.1
        </button>
        <output className="num flex items-center justify-center rounded-md bg-black px-2 text-lg text-amber-400" aria-live="polite">
          {turret(value, pos, neg)}
          <span className="ml-1 text-[10px] text-neutral-500">MIL</span>
        </output>
        <button className={btn} disabled={disabled} onClick={() => onChange(SCOPE.clickMil)} aria-label={`${label} +0.1 mil`}>
          +.1
        </button>
        <button className={btn} disabled={disabled} onClick={() => onChange(1)} aria-label={`${label} +1.0 mil`}>
          +1
        </button>
      </div>
    </div>
  );
}

interface Props {
  scenario: Scenario;
  elevation: number;
  windage: number;
  estimate: string;
  disabled: boolean;
  zoom: number;
  elapsed: number;
  onDial: (elevation: number, windage: number) => void;
  onReset: () => void;
  onZoom: (delta: number) => void;
  onEstimate: (v: string) => void;
  onFire: () => void;
}

export function Controls(p: Props) {
  return (
    <Panel title="Scope">
      <div className="space-y-4">
        <Turret label="Elevation" value={p.elevation} pos="U" neg="D" decKey="S" incKey="W" disabled={p.disabled} onChange={(d) => p.onDial(d, 0)} />
        <Turret label="Windage" value={p.windage} pos="R" neg="L" decKey="A" incKey="D" disabled={p.disabled} onChange={(d) => p.onDial(0, d)} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span className="label mr-1">Zoom</span>
            {SCOPE.fovMil.map((f, i) => (
              <button
                key={f}
                onClick={() => p.onZoom(i - p.zoom)}
                className={`num rounded px-2 py-1 text-xs ${i === p.zoom ? "bg-neutral-700 text-neutral-50" : "text-neutral-400 hover:bg-neutral-800"}`}
                aria-label={`Field of view ${f} mil`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={p.onReset} disabled={p.disabled} className="text-xs text-neutral-400 hover:text-neutral-100 disabled:opacity-40">
            Reset turrets <Kbd>R</Kbd>
          </button>
        </div>

        {p.scenario.mode === "challenge" && (
          <label className="block">
            <span className="label">Your range estimate (optional)</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={p.estimate}
                onChange={(e) => p.onEstimate(e.target.value)}
                disabled={p.disabled}
                inputMode="numeric"
                placeholder="e.g. 450"
                className="num w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
              />
              <span className="text-sm text-neutral-500">m</span>
            </div>
          </label>
        )}

        <button
          onClick={p.onFire}
          disabled={p.disabled}
          className="w-full rounded-md bg-amber-500 py-3 text-base font-semibold tracking-widest text-neutral-950 transition-colors hover:bg-amber-400 disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          {p.disabled ? "ROUND IN FLIGHT…" : "FIRE"}
          {!p.disabled && <span className="ml-2 text-xs font-normal opacity-70">Space</span>}
        </button>

        <div className="flex justify-between text-xs text-neutral-500">
          <span>
            Time <span className="num text-neutral-300">{p.elapsed.toFixed(1)} s</span>
          </span>
          <span>Drag / arrows to aim · wheel = elev</span>
        </div>
      </div>
    </Panel>
  );
}
