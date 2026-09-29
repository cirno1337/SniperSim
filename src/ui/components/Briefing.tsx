import { getDifficulty, getWeapon } from "../../game/config";
import { dopeCard } from "../../game/dope";
import type { Scenario } from "../../game/types";
import { clockName, windValue } from "../format";
import { Field, Panel } from "./ui";

function targetLabel(s: Scenario): string {
  const t = s.target;
  return t.type === "plate"
    ? `Steel plate Ø ${Math.round(t.widthM * 100)} cm`
    : `Silhouette ${Math.round(t.widthM * 100)} × ${Math.round(t.heightM * 100)} cm`;
}

export function Briefing({ scenario: s }: { scenario: Scenario }) {
  const w = getWeapon(s.weaponId);
  const challenge = s.mode === "challenge";
  return (
    <Panel title="Task">
      <p className="mb-3 text-sm leading-relaxed text-neutral-300">
        {challenge ? (
          <>
            Range the target with the reticle, read the wind from the flag, dial your solution from the DOPE card, then put the
            reticle on the target centre and fire.
          </>
        ) : (
          <>Work out elevation and windage from the DOPE card, dial them in, put the reticle on the target centre and fire.</>
        )}
      </p>
      <Field label="Distance" value={`${s.distanceM} m`} hidden={s.hidden.distance} hint={s.hidden.distance ? "Range = size (m) × 1000 ÷ size in mils" : undefined} />
      <Field label="Rifle" value={`${w.caliber} · ${w.rifle}`} />
      <Field label="Ammunition" value={w.ammo} />
      <Field label="Zero" value={`${w.zeroM} m`} />
      <Field
        label="Wind"
        value={s.wind.speedMs === 0 ? "Calm" : `${s.wind.speedMs} m/s from ${clockName(s.wind.fromClock)}`}
        hidden={s.hidden.wind}
        hint={s.hidden.wind ? "Read the flag: ~12° from vertical per 1 m/s of crosswind" : s.wind.speedMs ? windValue(s.wind.fromClock) : undefined}
      />
      <Field label="Target" value={targetLabel(s)} hint={s.target.type === "silhouette" ? "Aim point: centre of the chest" : undefined} />
    </Panel>
  );
}

export function DopeCard({ scenario: s }: { scenario: Scenario }) {
  const w = getWeapon(s.weaponId);
  const rows = dopeCard(w, getDifficulty(s.difficultyId).dopeStepM);
  return (
    <Panel title={`DOPE card · ${w.caliber} · ${w.zeroM} m zero`}>
      <div className="max-h-72 overflow-y-auto">
        <table className="num w-full text-sm">
          <thead className="sticky top-0 bg-neutral-900 text-left text-[11px] text-neutral-500">
            <tr>
              <th className="py-1 font-medium">Range</th>
              <th className="py-1 text-right font-medium">Elev MIL</th>
              <th className="py-1 text-right font-medium">Wind / 1 m/s</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.distanceM} className="border-t border-neutral-800/70">
                <td className="py-1 text-neutral-400">{r.distanceM} m</td>
                <td className="py-1 text-right text-neutral-100">{r.elevationMil.toFixed(1)}</td>
                <td className="py-1 text-right text-neutral-300">{r.windPer1MsMil.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Interpolate between rows. Wind: multiply by speed and clock value (full at 3/9, half at 1/5/7/11), dial into the wind.
        Head or tail wind has no effect here. Source: FM 3-05.222 Appendix H tables.
      </p>
    </Panel>
  );
}
