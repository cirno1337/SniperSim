# Scope Trainer (SniperSim)

A small sniper scope aiming trainer. Every target is procedurally generated. You work out elevation and
windage from a DOPE card, dial the turrets, aim through a first-focal-plane mil reticle and fire.
The impact is computed from the **existing FM 3-05.222 Appendix H ballistic tables** of the
[`sniper`](https://github.com/cirno1337/sniper) project (5.56 NATO 77 gr and 7.62 NATO M118LR).

## Run

This repo reuses the ballistic data from the `sniper` project and does not copy it. It expects that
project checked out next to it:

```text
Kucowansko/
  sniper/       ← existing project (data read-only: src/data/ballistics.ts, src/data/units.ts)
  SniperSim/    ← this repo
```

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest: engine, scenarios, hit detection, scoring, explanations, UI smoke render
npm run build      # type-check + production build to dist/
```

If `sniper` lives elsewhere, run with `SNIPER_PATH=/path/to/sniper npm run dev`.

## How to play

1. **Task panel**: distance, rifle, zero, wind and target. In challenge mode the distance is hidden
   (and so is the wind on medium/hard).
2. **DOPE card**: elevation per range and wind per 1 m/s of full-value crosswind. Interpolate for the
   actual distance, multiply wind by speed and clock value, and dial into the wind.
3. **Dial**: <kbd>W</kbd>/<kbd>S</kbd> or the mouse wheel for elevation, <kbd>A</kbd>/<kbd>D</kbd> or
   <kbd>Shift</kbd>+wheel for windage (0.1 MIL; hold <kbd>Shift</kbd> for 1 MIL).
4. **Aim**: drag the scope or use the arrow keys. <kbd>Z</kbd>/<kbd>X</kbd> zooms. The reticle is
   first focal plane, so one hash is 1 MIL at every zoom. Range = target size (m) × 1000 ÷ size in MIL.
5. **Fire** with <kbd>Space</kbd>. After the time of flight the impact appears, and the debrief shows your
   settings against the optimal ones and explains the miss: elevation, windage, aim point or range estimate.

Sessions: quick (1 shot), 5, 10 or endless. Best scores are kept in the browser.

## Architecture

```text
@sniper/data/ballistics.ts   existing tables (not modified)
src/engine/     table adapter: interpolation, re-zeroing, wind scaling, MIL, seeded RNG. No UI.
src/game/       config (weapons, difficulty, scoring), scenario generator, shot resolution,
                hit detection, scoring, DOPE card, shot explanation, session stats. No UI.
src/ui/         React: menu, scope (SVG in mil units), procedural scene, reticle, turrets, debrief.
```

Everything tunable lives in `src/game/config.ts`: distance bands (5.56: 100–600 m, 7.62: 100–800 m),
difficulty levels, wind ranges, target sizes, zero distance, turret limits and the scoring formula
(`base × accuracy × distance × speed × difficulty`). To add a calibre, add a `WeaponConfig` that points
at another load id from the sniper tables.

See [ANALYSIS.md](ANALYSIS.md) for the Phase 1 analysis of the existing project.

## Model limitations (by design, for explainable results)

- Trajectory comes only from the tables: standard atmosphere, no temperature, altitude or angle corrections.
- Only the crosswind component matters. Head and tail wind do not change drop.
- No spin drift, Coriolis, shooter wobble or moving targets. A miss is always explained by dial, hold or range error.

## Future ideas

Range-estimation-only drills, moving targets (lead), variable wind along the path, uphill/downhill,
atmospherics, multiple targets, countdown timers, local leaderboard view and a scenario editor.
