import { memo, type ReactNode } from "react";
import { createRng, type Rng } from "../../engine/rng";
import { EYE_HEIGHT_M } from "../../game/config";
import { SILHOUETTE, silhouetteHeadRadius } from "../../game/hit";
import type { Environment, Scenario } from "../../game/types";

/**
 * Procedural scene. Everything is drawn in scene mils: x right, SVG y = −(mil up).
 * An object `h` metres tall at distance `d` is `h/d·1000` mil tall, and the ground at
 * distance `d` sits `EYE_HEIGHT/d·1000` mil below the horizon, so distance reads naturally.
 */
interface Palette {
  skyTop: string;
  skyHorizon: string;
  haze: string;
  hills: string[];
  groundFar: string;
  groundNear: string;
  stripe: string;
  foliage: string[];
  trunk: string;
  rock: string;
}

const PALETTES: Record<Environment, Palette> = {
  field: {
    skyTop: "#5d7a94",
    skyHorizon: "#c9d3d6",
    haze: "#b9c3c2",
    hills: ["#8e9c9b", "#6f8173", "#5a6d55"],
    groundFar: "#7c8a57",
    groundNear: "#4f5f2e",
    stripe: "#6b7a45",
    foliage: ["#3f5227", "#4b5f2c", "#34461f"],
    trunk: "#3b3024",
    rock: "#7d786b",
  },
  forest: {
    skyTop: "#4f6679",
    skyHorizon: "#b7c2c4",
    haze: "#a7b2b0",
    hills: ["#7f8f8c", "#5b6e60", "#3f5443"],
    groundFar: "#5f6d3f",
    groundNear: "#3a4722",
    stripe: "#4f5c33",
    foliage: ["#23361f", "#2c4226", "#1d2e1a"],
    trunk: "#2e261d",
    rock: "#6b675c",
  },
  desert: {
    skyTop: "#6b8db0",
    skyHorizon: "#e6dccb",
    haze: "#ddd1bd",
    hills: ["#c9b597", "#b69c78", "#a58762"],
    groundFar: "#cdb48a",
    groundNear: "#b08d5f",
    stripe: "#c2a676",
    foliage: ["#77764a", "#8a8656", "#666640"],
    trunk: "#5a4631",
    rock: "#9a8264",
  },
};

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

/** SVG y (mil, down) of a point `h` metres above the ground at distance `d`. */
const yAt = (d: number, h = 0) => ((EYE_HEIGHT_M - h) / d) * 1000;
const k = (d: number) => 1000 / d; // metres → mil at distance d
const haze = (p: Palette, color: string, d: number) => mix(color, p.haze, Math.min(0.75, d / 2600));

interface Obj {
  d: number;
  node: ReactNode;
}

function hills(p: Palette, rng: Rng): ReactNode[] {
  return p.hills.map((color, layer) => {
    const base = 0.4 + layer * 0.15;
    const amp = 3.2 - layer * 1.1;
    let x = -140;
    const pts: string[] = [`-140,0.3`];
    let h = rng.range(0, amp);
    while (x <= 140) {
      h = Math.max(0.1, Math.min(amp, h + rng.range(-0.6, 0.6)));
      pts.push(`${x.toFixed(1)},${(-(base + h) + 0.3).toFixed(2)}`);
      x += rng.range(2, 6);
    }
    pts.push(`140,0.3`);
    return <polygon key={layer} points={pts.join(" ")} fill={color} />;
  });
}

function tree(p: Palette, rng: Rng, d: number, x: number, conifer: boolean, key: string): Obj {
  const s = k(d);
  const h = rng.range(7, 14);
  const trunkW = 0.35;
  const g = yAt(d);
  const col = haze(p, rng.pick(p.foliage), d);
  const trunk = haze(p, p.trunk, d);
  const node = conifer ? (
    <g key={key}>
      <rect x={x - (trunkW / 2) * s} y={g - 1.5 * s} width={trunkW * s} height={1.5 * s} fill={trunk} />
      {[0, 1, 2].map((i) => {
        const w = (h * 0.42 * (3 - i)) / 3;
        const y0 = g - (1.2 + i * h * 0.26) * s;
        return (
          <polygon
            key={i}
            points={`${x - w * s},${y0} ${x + w * s},${y0} ${x},${y0 - h * 0.45 * s}`}
            fill={col}
          />
        );
      })}
    </g>
  ) : (
    <g key={key}>
      <rect x={x - (trunkW / 2) * s} y={g - h * 0.45 * s} width={trunkW * s} height={h * 0.45 * s} fill={trunk} />
      <ellipse cx={x} cy={g - h * 0.65 * s} rx={h * 0.3 * s} ry={h * 0.33 * s} fill={col} />
      <ellipse cx={x - h * 0.12 * s} cy={g - h * 0.55 * s} rx={h * 0.2 * s} ry={h * 0.2 * s} fill={col} />
    </g>
  );
  return { d, node };
}

function Target({ s }: { s: Scenario }) {
  const d = s.distanceM;
  const t = s.target;
  const m = k(d);
  const g = yAt(d);
  const cx = t.centerMil.x;
  if (t.type === "plate") {
    const r = (t.widthM / 2) * m;
    const cy = -t.centerMil.y;
    return (
      <g>
        <rect x={cx - 0.03 * m} y={cy} width={0.06 * m} height={g - cy} fill="#2a2a28" />
        <rect x={cx - 0.25 * m} y={g - 0.04 * m} width={0.5 * m} height={0.04 * m} fill="#2a2a28" />
        <circle cx={cx} cy={cy} r={r} fill="#ecebe4" stroke="#3c3c38" strokeWidth={r * 0.06} />
        <circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke="#c9c7bd" strokeWidth={r * 0.04} />
      </g>
    );
  }
  const h = t.heightM;
  const w = t.widthM;
  const hr = silhouetteHeadRadius(t);
  const bodyTop = g - (SILHOUETTE.bodyTop - SILHOUETTE.bottom) * h * m;
  const headCy = g - (h - hr) * m;
  const shoulder = w * 0.18 * m;
  return (
    <g fill="#b99c6b" stroke="#6e5a39" strokeWidth={0.012 * m}>
      <path
        d={`M${cx - (w / 2) * m},${g} L${cx - (w / 2) * m},${bodyTop + shoulder} Q${cx - (w / 2) * m},${bodyTop} ${cx - (w / 2) * m + shoulder},${bodyTop}
            L${cx + (w / 2) * m - shoulder},${bodyTop} Q${cx + (w / 2) * m},${bodyTop} ${cx + (w / 2) * m},${bodyTop + shoulder} L${cx + (w / 2) * m},${g} Z`}
      />
      <circle cx={cx} cy={headCy} r={hr * m} />
    </g>
  );
}

function Flag({ s, p }: { s: Scenario; p: Palette }) {
  const d = s.flagDistanceM;
  const m = k(d);
  const g = yAt(d);
  const x = s.flagXMil;
  const poleH = 3.5;
  // The flag shows the crosswind component: ~12° from vertical per m/s, pointing downwind.
  const cross = s.wind.crossMs;
  const angle = Math.min(88, Math.abs(cross) * 12) * (Math.PI / 180);
  const len = 1.3;
  const dir = cross >= 0 ? 1 : -1;
  const top = g - poleH * m;
  const dx = Math.sin(angle) * len * m * dir;
  const dy = Math.cos(angle) * len * m;
  const fw = 0.45 * m;
  const pole = haze(p, "#d8d4c8", d);
  return (
    <g>
      <line x1={x} y1={g} x2={x} y2={top} stroke={pole} strokeWidth={0.05 * m} />
      <polygon
        className={s.wind.speedMs > 0.5 ? "flag-flutter" : undefined}
        points={`${x},${top} ${x + dx},${top + dy} ${x + dx + (dir * fw * Math.cos(angle)) / 3},${top + dy - (fw * Math.sin(angle)) / 3 + fw * 0.6} ${x},${top + fw}`}
        fill={haze(p, "#d9612c", d * 0.6)}
      />
    </g>
  );
}

function SceneImpl({ scenario: s }: { scenario: Scenario }) {
  const p = PALETTES[s.environment];
  const rng = createRng(s.seed ^ 0x5bd1e995);
  const R = s.distanceM;
  const t = s.target;
  const targetHalfW = ((t.widthM / 2) * 1000) / R + 0.8;
  const clearOfTarget = (x: number, d: number) => d > R || Math.abs(x - t.centerMil.x) > targetHalfW + 2;

  const objs: Obj[] = [];

  // ground stripes (furrows/terrain bands) give a sense of depth
  const bands = [15, 20, 26, 34, 45, 60, 80, 105, 140, 185, 245, 320, 420, 560, 740, 980, 1300, 1800, 2600];
  const stripes = bands.slice(0, -1).map((d, i) => (
    <rect
      key={d}
      x={-160}
      y={yAt(bands[i + 1])}
      width={320}
      height={yAt(d) - yAt(bands[i + 1])}
      fill={i % 2 ? mix(p.groundNear, p.groundFar, Math.min(1, Math.log10(d) / 3.2)) : mix(p.stripe, p.groundFar, Math.min(1, Math.log10(d) / 3.2))}
      opacity={0.55}
    />
  ));

  // scattered tufts / rocks, uniform in screen space (sample 1/d)
  const nTufts = s.environment === "desert" ? 140 : 260;
  for (let i = 0; i < nTufts; i++) {
    const d = 1 / rng.range(1 / 2400, 1 / 70);
    const x = rng.range(-70, 70);
    if (!clearOfTarget(x, d)) continue;
    const m = k(d);
    const g = yAt(d);
    if (rng.next() < (s.environment === "desert" ? 0.55 : 0.2)) {
      const w = rng.range(0.08, 0.3);
      objs.push({ d, node: <ellipse key={`r${i}`} cx={x} cy={g - w * 0.2 * m} rx={w * m} ry={w * 0.45 * m} fill={haze(p, p.rock, d)} /> });
    } else {
      // grass tuft: a few thin blades
      const h = rng.range(0.15, 0.4);
      const c = haze(p, rng.pick(p.foliage), d);
      const blades = [-0.12, -0.05, 0.03, 0.1].map((o) => {
        const lean = rng.range(-0.08, 0.08);
        const bh = h * rng.range(0.6, 1);
        return `M${x + (o - 0.03) * m},${g} L${x + (o + lean) * m},${g - bh * m} L${x + (o + 0.03) * m},${g} Z`;
      });
      objs.push({ d, node: <path key={`t${i}`} d={blades.join(" ")} fill={c} /> });
    }
  }

  // trees
  if (s.environment === "forest") {
    const line = R + rng.range(40, 220);
    for (let x = -90; x < 90; x += rng.range(0.8, 2.6)) {
      if (rng.next() < 0.12) continue;
      objs.push(tree(p, rng, line + rng.range(-25, 60), x, rng.next() < 0.6, `f${x}`));
    }
    for (let i = 0; i < 10; i++) {
      const d = rng.range(Math.max(150, R * 0.4), R * 0.9);
      const x = rng.range(-60, 60);
      if (Math.abs(x - t.centerMil.x) > 14 && Math.abs(x - s.flagXMil) > 4) objs.push(tree(p, rng, d, x, rng.next() < 0.5, `n${i}`));
    }
  } else if (s.environment === "field") {
    for (let i = 0; i < 9; i++) {
      const d = rng.range(R * 0.6, 2200);
      const x = rng.range(-80, 80);
      if (clearOfTarget(x, d) && Math.abs(x - s.flagXMil) > 3) objs.push(tree(p, rng, d, x, false, `ft${i}`));
    }
  }

  objs.push({ d: R, node: <Target key="target" s={s} /> });
  objs.push({ d: s.flagDistanceM, node: <Flag key="flag" s={s} p={p} /> });
  objs.sort((a, b) => b.d - a.d);

  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyHorizon} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.groundFar} />
          <stop offset="1" stopColor={p.groundNear} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-80} width={400} height={80.5} fill="url(#sky)" />
      {hills(p, rng)}
      <rect x={-200} y={0} width={400} height={60} fill="url(#ground)" />
      {stripes}
      {objs.map((o) => o.node)}
    </g>
  );
}

export const Scene = memo(SceneImpl, (a, b) => a.scenario === b.scenario);
