import { getDifficulty, getWeapon } from "../../game/config";
import { explainShot } from "../../game/explain";
import { distanceMultiplier, speedMultiplier } from "../../game/scoring";
import type { Scenario, ShotResult } from "../../game/types";
import { clockName, metersDir, turret } from "../format";
import { Kbd, Panel } from "./ui";

function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-sm">
      <span className="text-neutral-500">{k}</span>
      <span className={`num text-right ${strong ? "text-neutral-50" : "text-neutral-200"}`}>{v}</span>
    </div>
  );
}

const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;

export function Debrief({ scenario: s, result: r, last, onNext }: { scenario: Scenario; result: ShotResult; last: boolean; onNext: () => void }) {
  const w = getWeapon(s.weaponId);
  const d = getDifficulty(s.difficultyId);
  const causes = explainShot(s, r);
  return (
    <Panel className="fade-up">
      <div className="flex items-baseline justify-between">
        <h2 className={`text-3xl font-bold tracking-[0.2em] ${r.hit ? "text-emerald-400" : "text-red-400"}`}>{r.hit ? "HIT" : "MISS"}</h2>
        <span className="num text-2xl text-amber-400">{r.score.toLocaleString("en-US")}</span>
      </div>
      <p className="num mt-1 text-sm text-neutral-300">
        Impact {metersDir(r.errorM.x, "right", "left")} · {metersDir(r.errorM.y, "high", "low")}
      </p>

      <table className="num mt-4 w-full text-sm">
        <thead className="text-[11px] text-neutral-500">
          <tr>
            <th className="text-left font-medium" />
            <th className="text-right font-medium">Yours</th>
            <th className="text-right font-medium">Optimal</th>
            <th className="text-right font-medium">Error</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 text-neutral-500">Elev</td>
            <td className="text-right">{turret(r.input.elevationMil, "U", "D")}</td>
            <td className="text-right text-emerald-300">{turret(r.optimal.elevationMil, "U", "D")}</td>
            <td className="text-right">{signed(r.dialErrorMil.y)}</td>
          </tr>
          <tr>
            <td className="py-1 text-neutral-500">Wind</td>
            <td className="text-right">{turret(r.input.windageMil, "R", "L")}</td>
            <td className="text-right text-emerald-300">{turret(r.optimal.windageMil, "R", "L")}</td>
            <td className="text-right">{signed(r.dialErrorMil.x)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-neutral-600">Optimal values are exact; turrets click in 0.1 MIL.</p>

      <h3 className="label mb-1.5 mt-4">Why it landed there</h3>
      <ul className="space-y-1.5 text-sm text-neutral-300">
        {causes.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>{c.text}</span>
          </li>
        ))}
      </ul>

      <h3 className="label mb-1 mt-4">Shot</h3>
      <Row k="Distance" v={`${s.distanceM} m${s.hidden.distance ? " (revealed)" : ""}`} />
      {r.input.rangeEstimateM !== undefined && <Row k="Your estimate" v={`${r.input.rangeEstimateM} m`} />}
      <Row k="Wind" v={s.wind.speedMs === 0 ? "calm" : `${s.wind.speedMs} m/s, ${clockName(s.wind.fromClock)}`} />
      <Row k="Weapon" v={w.caliber} />
      <Row k="Time of flight" v={`${r.tof.toFixed(2)} s`} />
      <Row k="Impact error" v={`${r.errorDistM.toFixed(2)} m`} />
      <Row k="Time" v={`${r.input.timeS.toFixed(1)} s (par ${d.parTimeS} s)`} />
      <Row k="Accuracy" v={`${Math.round(r.accuracy * 100)}%`} strong />
      <Row
        k="Score"
        v={
          r.hit
            ? `1000 × ${r.accuracy.toFixed(2)} × ${distanceMultiplier(s.distanceM).toFixed(2)} dist × ${speedMultiplier(r.input.timeS, d.parTimeS).toFixed(2)} speed × ${d.scoreMultiplier} diff`
            : "0 (miss)"
        }
      />

      <button
        onClick={onNext}
        autoFocus
        className="mt-4 w-full rounded-md bg-neutral-100 py-2.5 text-sm font-semibold tracking-wider text-neutral-950 hover:bg-white"
      >
        {last ? "SESSION SUMMARY" : "NEXT TARGET"} <span className="ml-1 text-xs font-normal opacity-60">Enter</span>
      </button>
      <p className="mt-2 text-center text-[11px] text-neutral-600">
        Green cross = target centre · coloured dot = impact · <Kbd>N</Kbd> next
      </p>
    </Panel>
  );
}
