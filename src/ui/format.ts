export const fmt = (v: number, digits = 1) => (Object.is(Math.round(v * 10 ** digits), -0) ? 0 : v).toFixed(digits);

/** "1.2 MIL U" style turret readout. */
export function turret(v: number, pos: string, neg: string): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return "0.0";
  return `${Math.abs(r).toFixed(1)} ${r > 0 ? pos : neg}`;
}

export function clockName(c: number): string {
  if (c === 12) return "12 o'clock (head)";
  if (c === 6) return "6 o'clock (tail)";
  if (c === 3) return "3 o'clock (from right)";
  if (c === 9) return "9 o'clock (from left)";
  return `${c} o'clock (from ${c < 6 ? "right" : "left"})`;
}

/** Wind value: fraction of the full crosswind for a clock position. */
export function windValue(c: number): string {
  const v = Math.abs(Math.sin((c / 12) * 2 * Math.PI));
  if (v < 0.01) return "no value";
  if (v > 0.99) return "full value";
  if (Math.abs(v - 0.5) < 0.01) return "half value";
  return `${v.toFixed(2)} value`;
}

export function metersDir(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(2)} m ${v >= 0 ? pos : neg}`;
}
