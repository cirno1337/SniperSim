import { useEffect, useRef, useState } from "react";
import type { Scenario, ShotResult, Vec } from "../../game/types";
import type { Phase } from "../useGame";
import { Reticle } from "./Reticle";
import { Scene } from "./Scene";

interface Props {
  scenario: Scenario;
  aim: Vec;
  fov: number;
  phase: Phase;
  result: ShotResult | null;
  shotCount: number;
  onAim: (dx: number, dy: number) => void;
  onWheel: (elevation: number, windage: number) => void;
}

/** Drag sensitivity: fraction of the pointer travel applied to the aim (lower = finer). */
const DRAG_SENSITIVITY = 0.5;

export function Scope({ scenario, aim, fov, phase, result, shotCount, onAim, onWheel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const wheelRef = useRef(onWheel);
  useEffect(() => {
    wheelRef.current = onWheel;
  }, [onWheel]);

  // non-passive wheel listener so the page does not scroll while dialling
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e: WheelEvent) => {
      e.preventDefault();
      const step = (e.deltaY < 0 ? 1 : -1) * 0.1;
      if (e.shiftKey) wheelRef.current(0, step);
      else wheelRef.current(step, 0);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);

  const view = phase === "aiming" ? aim : (result?.input.aimMil ?? aim);
  const viewBox = `${view.x - fov / 2} ${-view.y - fov / 2} ${fov} ${fov}`;
  const showImpact = phase === "debrief" && result;
  const markR = fov / 120;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,78vh)]">
      <div
        ref={ref}
        role="application"
        aria-label="Rifle scope. Drag or use the arrow keys to aim; mouse wheel dials elevation, shift + wheel dials windage."
        tabIndex={0}
        className={`absolute inset-0 overflow-hidden rounded-full bg-black shadow-[0_0_0_10px_#0c0c0c,0_0_0_12px_#262626,0_20px_60px_rgba(0,0,0,0.6)] ${
          dragging ? "cursor-grabbing" : "cursor-crosshair"
        } touch-none select-none`}
        onPointerDown={(e) => {
          if (phase !== "aiming") return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY };
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !ref.current) return;
          const k = (fov / ref.current.clientWidth) * DRAG_SENSITIVITY;
          onAim((e.clientX - drag.current.x) * k, -(e.clientY - drag.current.y) * k);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div key={shotCount} className={phase !== "aiming" ? "recoil absolute inset-0" : "absolute inset-0"}>
          <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
            <Scene scenario={scenario} />
            {showImpact && (
              <g>
                <line
                  x1={scenario.target.centerMil.x}
                  y1={-scenario.target.centerMil.y}
                  x2={result.impactMil.x}
                  y2={-result.impactMil.y}
                  stroke="#fbbf24"
                  strokeDasharray="3 3"
                  className="nss"
                  strokeWidth={1}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
                <g stroke="#22c55e" strokeWidth={1.5} style={{ vectorEffect: "non-scaling-stroke" }}>
                  <line x1={scenario.target.centerMil.x - markR * 1.6} y1={-scenario.target.centerMil.y} x2={scenario.target.centerMil.x + markR * 1.6} y2={-scenario.target.centerMil.y} style={{ vectorEffect: "non-scaling-stroke" }} />
                  <line x1={scenario.target.centerMil.x} y1={-scenario.target.centerMil.y - markR * 1.6} x2={scenario.target.centerMil.x} y2={-scenario.target.centerMil.y + markR * 1.6} style={{ vectorEffect: "non-scaling-stroke" }} />
                </g>
                <circle className="impact-puff" cx={result.impactMil.x} cy={-result.impactMil.y} r={markR * 2.5} fill={result.hit ? "#fde68a" : "#d6c7a1"} />
                <circle className="impact-ring" cx={result.impactMil.x} cy={-result.impactMil.y} r={markR * 1.5} fill="none" stroke={result.hit ? "#f59e0b" : "#ef4444"} strokeWidth={1.5} style={{ vectorEffect: "non-scaling-stroke" }} />
                <circle cx={result.impactMil.x} cy={-result.impactMil.y} r={markR * 0.7} fill={result.hit ? "#f59e0b" : "#ef4444"} stroke="#000" strokeWidth={0.8} style={{ vectorEffect: "non-scaling-stroke" }} />
              </g>
            )}
          </svg>
          <svg viewBox={`${-fov / 2} ${-fov / 2} ${fov} ${fov}`} className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
            <Reticle fov={fov} />
          </svg>
        </div>
        {phase === "inflight" && <div key={`f${shotCount}`} className="muzzle-flash pointer-events-none absolute inset-0 bg-amber-50" />}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_60px_30px_rgba(0,0,0,0.85)]" />
      </div>
    </div>
  );
}
