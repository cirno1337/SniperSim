import type { ReactNode } from "react";

export function Panel({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 ${className}`}>
      {title && <h2 className="label mb-3">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, value, hidden, hint }: { label: string; value: ReactNode; hidden?: boolean; hint?: ReactNode }) {
  return (
    <div className="border-b border-neutral-800/80 py-2 last:border-0">
      <div className="label">{label}</div>
      <div className={`num mt-0.5 text-[15px] ${hidden ? "text-amber-400/80" : "text-neutral-100"}`}>{hidden ? "????" : value}</div>
      {hint && <div className="mt-0.5 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="num rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">{children}</kbd>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-neutral-800 bg-neutral-950 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          title={o.hint}
          onClick={() => onChange(o.id)}
          className={`rounded px-2 py-1.5 text-sm font-medium transition-colors ${
            value === o.id ? "bg-amber-500 text-neutral-950" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
