import { milToMeters } from "../engine/units";
import type { Scenario, ShotResult } from "./types";

/** Errors smaller than this (mil) are not worth mentioning — below one turret click. */
const NEGLIGIBLE_MIL = 0.05;

export interface Cause {
  kind: "elevation" | "windage" | "aim-x" | "aim-y" | "range" | "clean";
  text: string;
}

const f = (v: number) => Math.abs(v).toFixed(2);

/** Plain-language breakdown of why the shot landed where it did. Deterministic and explainable. */
export function explainShot(s: Scenario, r: ShotResult): Cause[] {
  const R = s.distanceM;
  const causes: Cause[] = [];
  const { x: dx, y: dy } = r.dialErrorMil;
  const { x: ax, y: ay } = r.aimErrorMil;

  if (Math.abs(dy) >= NEGLIGIBLE_MIL) {
    causes.push({
      kind: "elevation",
      text: `Elevation ${f(dy)} MIL too ${dy < 0 ? "low" : "high"} → moves impact ${f(milToMeters(dy, R))} m ${dy < 0 ? "low" : "high"}.`,
    });
  }
  if (Math.abs(dx) >= NEGLIGIBLE_MIL) {
    causes.push({
      kind: "windage",
      text: `Windage ${f(dx)} MIL too far ${dx < 0 ? "left" : "right"} → moves impact ${f(milToMeters(dx, R))} m ${dx < 0 ? "left" : "right"}.`,
    });
  }
  if (Math.abs(ay) >= NEGLIGIBLE_MIL) {
    causes.push({
      kind: "aim-y",
      text: `Reticle was ${f(ay)} MIL ${ay < 0 ? "below" : "above"} the target centre${Math.sign(ay) === -Math.sign(dy) && Math.abs(dy) >= NEGLIGIBLE_MIL ? " (partly offsets the elevation error)" : ""}.`,
    });
  }
  if (Math.abs(ax) >= NEGLIGIBLE_MIL) {
    causes.push({
      kind: "aim-x",
      text: `Reticle was ${f(ax)} MIL ${ax < 0 ? "left" : "right"} of the target centre${Math.sign(ax) === -Math.sign(dx) && Math.abs(dx) >= NEGLIGIBLE_MIL ? " (partly offsets the windage error)" : ""}.`,
    });
  }
  const est = r.input.rangeEstimateM;
  if (est !== undefined && r.elevationAtEstimateMil !== undefined) {
    const diff = est - R;
    const de = r.elevationAtEstimateMil - r.optimal.elevationMil;
    causes.push({
      kind: "range",
      text:
        Math.abs(diff) < 1
          ? `Range estimate ${est} m was exact.`
          : `Range estimate ${est} m vs actual ${R} m (${diff > 0 ? "+" : ""}${Math.round(diff)} m). Dope for ${est} m is ${r.elevationAtEstimateMil.toFixed(2)} MIL, ${f(de)} MIL ${de < 0 ? "less" : "more"} than needed.`,
    });
  }
  if (causes.length === 0 || causes.every((c) => c.kind === "range")) {
    causes.unshift({ kind: "clean", text: "Dial and hold were both within half a click of perfect." });
  }
  return causes;
}
