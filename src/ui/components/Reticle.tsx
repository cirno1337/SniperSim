import { memo } from "react";

/**
 * First-focal-plane mil reticle drawn in mil units: it scales with the scene at every zoom,
 * so it can be used to measure targets (range estimation) and to hold over.
 */
function ReticleImpl({ fov }: { fov: number }) {
  const edge = fov / 2 + 1;
  // Stroke widths in mil, derived from the field of view so lines stay ~1.5 px at every zoom.
  const line = fov / 520;
  const dotR = Math.max(0.06, fov / 320);
  const ticks: React.ReactNode[] = [];
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue;
    const big = i % 5 === 0;
    const l = big ? 0.45 : 0.28;
    ticks.push(<line key={`h${i}`} x1={i} y1={-l} x2={i} y2={l} />);
    ticks.push(<line key={`v${i}`} x1={-l} y1={i} x2={l} y2={i} />);
    if (Math.abs(i) <= 5) {
      ticks.push(<line key={`hh${i}`} x1={i - 0.5 * Math.sign(i)} y1={-0.14} x2={i - 0.5 * Math.sign(i)} y2={0.14} />);
      ticks.push(<line key={`vh${i}`} x1={-0.14} y1={i - 0.5 * Math.sign(i)} x2={0.14} y2={i - 0.5 * Math.sign(i)} />);
    }
  }
  // holdover tree: wind dots every mil on the even rows below centre
  const dots: React.ReactNode[] = [];
  for (let row = 2; row <= 8; row += 2) {
    const n = row / 2 + 1;
    for (let j = -n; j <= n; j++) if (j !== 0) dots.push(<circle key={`${row}:${j}`} cx={j} cy={row} r={dotR} />);
  }
  const labels = [2, 4, 6, 8, 10].flatMap((v) => [
    <text key={`lr${v}`} x={v} y={-0.75} textAnchor="middle">{v}</text>,
    <text key={`ll${v}`} x={-v} y={-0.75} textAnchor="middle">{v}</text>,
    <text key={`ld${v}`} x={0.75} y={v + 0.2} textAnchor="start">{v}</text>,
  ]);
  const lines = (
    <>
      <line x1={-10} y1={0} x2={10} y2={0} />
      <line x1={0} y1={-10} x2={0} y2={10} />
      {ticks}
    </>
  );
  const posts = (w: number) => (
    <g strokeWidth={w} strokeLinecap="butt">
      <line x1={-edge} y1={0} x2={-10.5} y2={0} />
      <line x1={10.5} y1={0} x2={edge} y2={0} />
      <line x1={0} y1={10.5} x2={0} y2={edge} />
      <line x1={0} y1={-10.5} x2={0} y2={-edge} />
    </g>
  );
  return (
    <g>
      {/* light halo underneath keeps the reticle legible on dark foliage */}
      <g stroke="rgba(255,255,255,0.4)" strokeWidth={line * 3}>
        {lines}
      </g>
      <g stroke="#0b0b0b" strokeWidth={line}>
        {lines}
      </g>
      <g fill="#0b0b0b">{dots}</g>
      <g stroke="#0b0b0b">{posts(0.35)}</g>
      <g fill="#0b0b0b" fontSize={fov / 55} fontFamily="ui-monospace, monospace" style={{ userSelect: "none" }}>
        {labels}
      </g>
      <circle cx={0} cy={0} r={Math.max(0.05, fov / 400)} fill="#ef4444" />
    </g>
  );
}

export const Reticle = memo(ReticleImpl);
