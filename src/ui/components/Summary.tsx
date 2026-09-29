import { sessionStats } from "../../game/session";
import type { ShotResult } from "../../game/types";
import type { SessionSetup } from "../useGame";
import { Panel } from "./ui";

export function Summary({ setup, results, newBest, onAgain, onMenu }: { setup: SessionSetup; results: ShotResult[]; newBest: boolean; onAgain: () => void; onMenu: () => void }) {
  const st = sessionStats(results);
  const tiles = [
    ["Score", st.score.toLocaleString("en-US")],
    ["Hits", `${st.hits} / ${st.shots}`],
    ["Accuracy", `${Math.round(st.accuracy * 100)}%`],
    ["Best streak", st.bestStreak],
  ] as const;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="label">Session complete · {setup.mode} · {setup.difficultyId}</p>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-50">{newBest ? "New best score" : "Debrief"}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="label">{k}</div>
            <div className="num mt-1 text-2xl text-neutral-50">{v}</div>
          </div>
        ))}
      </div>
      <Panel title="Shots" className="mt-6">
        <div className="overflow-x-auto">
          <table className="num w-full text-sm">
            <thead className="text-left text-[11px] text-neutral-500">
              <tr>
                <th className="py-1 font-medium">#</th>
                <th className="font-medium">Result</th>
                <th className="text-right font-medium">Elev err</th>
                <th className="text-right font-medium">Wind err</th>
                <th className="text-right font-medium">Miss dist</th>
                <th className="text-right font-medium">Time</th>
                <th className="text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t border-neutral-800/70">
                  <td className="py-1.5 text-neutral-500">{i + 1}</td>
                  <td className={r.hit ? "text-emerald-400" : "text-red-400"}>{r.hit ? "HIT" : "MISS"}</td>
                  <td className="text-right">{r.dialErrorMil.y.toFixed(2)}</td>
                  <td className="text-right">{r.dialErrorMil.x.toFixed(2)}</td>
                  <td className="text-right">{r.errorDistM.toFixed(2)} m</td>
                  <td className="text-right">{r.input.timeS.toFixed(1)} s</td>
                  <td className="text-right text-amber-400">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="mt-6 flex gap-3">
        <button onClick={onAgain} className="rounded-md bg-amber-500 px-6 py-2.5 font-semibold tracking-wider text-neutral-950 hover:bg-amber-400">
          AGAIN
        </button>
        <button onClick={onMenu} className="rounded-md border border-neutral-700 px-6 py-2.5 font-semibold tracking-wider text-neutral-200 hover:border-neutral-500">
          MENU
        </button>
      </div>
    </div>
  );
}
