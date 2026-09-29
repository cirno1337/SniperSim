# Sniper Scope Trainer: Phase 1 analysis

Analysis of `/home/alek/Kucowansko/sniper/` (GitHub: `cirno1337/sniper`) done before any
game code was written, as required by `SNIPER_AUTONOMOUS.md` §2 and §28.

## 1. Existing architecture

| Aspect | Finding |
|---|---|
| Purpose | Study SPA for FM 3-05.222 (lessons, quizzes, flashcards, exam, calculators), UI in Polish |
| Stack | Vite 8 + React 19 + TypeScript 6 + Tailwind 4 + React Router 7, oxlint |
| Hosting | GitHub Pages under `/sniper/`, deployed from `main` by `.github/workflows/deploy.yml` |
| State | `localStorage` progress (`hooks/useProgress.ts`, `context/ProgressContext.tsx`) |
| Tests | **None** (only `scripts/validate-content.mjs` for content structure) |
| Build/run | `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` |

Relevant files:

- `src/data/ballistics.ts`: **the ballistic data source.** `BallisticLoad[]` holding 9 loads transcribed
  from Appendix H (Sierra Ballistics III). Every 100 m each row has velocity (fps), energy (ft-lb),
  bullet path relative to line of sight (in), drop (in), **wind drift at a 10 mph full-value crosswind**
  (in) and time of flight (s). Reference atmosphere is 59 °F, 29.53 inHg, 78 % RH.
- `src/data/units.ts`: unit categories with `toBase` factors and `convert()`, plus °F/°C.
- `src/components/tools/BallisticsCalculator.tsx`: UI that **only looks up** table rows (no interpolation).
- `src/components/tools/RangeEstimator.tsx`: the mil-relation formula `(size m × 1000) / mils`, written
  inline in a UI component and not exported.
- `src/components/tools/UnitConverter.tsx`: UI over `units.ts`.

## 2. Reusable components

- `ballisticLoads` from `src/data/ballistics.ts`, used directly for both game calibres:
  - **5.56 NATO** → load `556` (77 gr SPR, table zero 200 m, sight height 2.0 in)
  - **7.62 NATO** → load `m118lr` (M118LR 175 gr SMK; bullet path crosses 0 at 200 m in the data)
- `unitCategories` / `convert()` from `src/data/units.ts` for inch → metre conversion.
- Visual language (dark neutral palette with amber accent, Tailwind) for a consistent look.

## 3. Ballistic engine capabilities

"Engine" here means **tabulated trajectory data**, not a numerical solver. Available:

- bullet path relative to the line of sight for the table's own zero, every 100 m
- pure drop, velocity, energy, time of flight
- wind drift for a 10 mph full-value crosswind

Not available:

- values between the 100 m rows
- re-zeroing to a different zero distance
- wind drift for other wind speeds or angles
- MIL/MOA solutions
- impact point computation
- any atmospheric correction

## 4. Missing functionality (smallest extensions over the tables)

These are thin adapter functions that read the existing tables. None of them re-implements drag,
gravity or a trajectory integrator:

1. **Interpolation** between 100 m rows (4-point cubic Lagrange; exact at table rows).
2. **Re-zeroing** by line-of-sight rotation: `path_Z(R) = path(R) − path(Z)·R/Z`.
3. **Wind scaling**: drift is linear in the crosswind component, so `drift(R, w) = drift10mph(R)·w/4.4704 m/s`,
   using the full-value component `w·sin(clock angle)`.
4. **MIL conversion**: `mil = metres / km`.
5. **Impact point** from dialled elevation/windage and the aim point, plus hit detection and scoring.

Atmospheric effects (temperature, pressure, altitude) cannot be derived from the tables. They stay
out of the MVP and are listed as future work, per §6 and §24 of the spec.

## 5. What stays untouched

The whole `sniper` project. The game **imports** `src/data/ballistics.ts` and `src/data/units.ts`
read-only through the `@sniper` alias, which points at the local checkout (default `../sniper`).
No file in `sniper` was modified.

## 6. Proposed game architecture

```text
@sniper/data/ballistics.ts (existing tables)
        ↓
src/engine/     ballistics adapter (interpolate, re-zero, wind, mil), rng. Pure TS, no UI.
        ↓
src/game/       config (weapons, difficulty, scoring), scenario generator, shot resolution,
                hit detection, scoring, session reducer. Pure TS, no UI.
        ↓
src/ui/         React: menu, briefing, SVG scope (scene + FFP mil reticle), turret controls,
                result/debrief, session summary, sound.
```

The scope is an SVG whose `viewBox` is expressed **in mils**. The reticle is therefore
first-focal-plane correct at every zoom level, and target apparent size is `size/distance·1000` mil.
That makes range estimation with the reticle work for real.

## 7. File structure

```text
src/engine/ballistics.ts   units.ts   rng.ts
src/game/config.ts   types.ts   scenario.ts   shot.ts   hit.ts   scoring.ts   session.ts
src/ui/App.tsx   components/*   audio.ts   storage.ts
src/**/*.test.ts           (vitest)
```

## 8. MVP plan

Phase 2 is the foundation (engine adapter, scenario, scope, target, turrets). Phase 3 is firing
(impact and hit). Phase 4 is scoring and the result screen. Phase 5 adds training and challenge modes
plus sessions. Phase 6 is polish (animation, sound, zoom, responsive layout).

## 9. Potential technical problems

- **Table resolution**: 100 m steps. A leave-one-out check interpolated each row with its
  neighbours removed (200 m gaps). Worst error was 0.011 mil (5.56) and 0.006 mil (7.62), well
  below one 0.1 mil turret click.
- **Table zeros differ** between loads (200 m for both chosen loads, though the M118LR label says
  600 m). The game re-zeros both rifles to a common, configurable 100 m.
- **Head/tail wind** does not change drop in this model (the tables have no data for it), so only the
  crosswind component matters. The UI says so.
- **Cross-repo dependency**: the build needs the `sniper` checkout next to this repo (or `SNIPER_PATH`).
  A git submodule would make the repo self-contained; it was not added automatically.
