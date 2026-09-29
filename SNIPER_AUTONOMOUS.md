# Sniper Scope Trainer — specification for Claude Code

## 1. Context

Existing project:

```text
/home/alek/Kucowansko/sniper/
```

This project already contains ballistic calculators and logic related to sniper shooting, weapons, ammunition and ballistic calculations.

The goal is to build an **interactive sniper scope aiming trainer / small game** on top of the existing project.

The new application should reuse existing ballistic calculations wherever possible instead of duplicating or replacing them.

The game should initially support **only two ammunition categories**:

* 5.56 NATO
* 7.62 NATO

The application is intended primarily as a **training/game experience**, not as a generic ballistic calculator.

---

# 2. IMPORTANT: analyse first, implement later

Before changing or creating any code, thoroughly inspect:

```text
/home/alek/Kucowansko/sniper/
```

Identify:

* project structure
* language/framework
* existing UI
* existing ballistic calculators
* ballistic formulas
* weapon definitions
* ammunition definitions
* projectile parameters
* trajectory calculations
* zeroing calculations
* elevation calculations
* windage calculations
* MOA/MIL handling
* unit conversions
* existing target/visualisation components
* existing tests
* existing reusable components
* configuration files
* build/run commands

Do NOT immediately start rewriting or restructuring the existing application.

The first task is analysis.

Create a short internal/project analysis containing:

1. What already exists.
2. Which components can be reused.
3. Which components should remain untouched.
4. Which components need small extensions.
5. What needs to be newly implemented.
6. Recommended architecture for the game.
7. Recommended MVP scope.

Do not duplicate existing ballistic logic if equivalent functionality already exists.

---

# 3. Core game concept

The application should behave like a **scope aiming trainer / sniper challenge game**.

The player receives a randomly generated scenario.

Example:

```text
DISTANCE
623 m

RIFLE
7.62 NATO

AMMUNITION
[appropriate ammunition profile]

WIND
3 m/s from left

TEMPERATURE
15°C

TARGET
unknown / visible in scope
```

The player then has to configure the scope correctly and fire.

The goal is to hit the target as accurately and quickly as possible.

The application calculates the actual projectile trajectory using the existing ballistic engine.

The player should NOT simply receive the correct elevation/windage values before shooting.

The gameplay should require the player to make the adjustment.

---

# 4. Gameplay loop

The basic gameplay loop:

```text
GENERATE SCENARIO
        ↓
DISPLAY TARGET / ENVIRONMENT
        ↓
PLAYER OBSERVES PARAMETERS
        ↓
PLAYER ADJUSTS SCOPE
        ↓
PLAYER FIRES
        ↓
BALLISTIC CALCULATION
        ↓
PROJECTILE / IMPACT VISUALIZATION
        ↓
HIT / MISS
        ↓
SCORE
        ↓
NEXT CHALLENGE
```

A complete challenge should ideally take approximately:

```text
10–60 seconds
```

depending on difficulty.

---

# 5. Weapons / ammunition

For MVP, keep the system deliberately small.

Only:

```text
5.56 NATO
7.62 NATO
```

Do not introduce a huge ammunition database unless the existing project already contains it and it is trivial to reuse.

The architecture should nevertheless allow additional ammunition types to be added later.

Use a data-driven structure where possible.

Example conceptual model:

```text
Weapon
  ├── name
  ├── caliber
  ├── muzzleVelocity
  ├── zeroDistance
  ├── scope
  └── ammunition

Ammunition
  ├── name
  ├── caliber
  ├── ballisticCoefficient
  ├── muzzleVelocity
  └── other ballistic parameters
```

Do not invent new ballistic values if equivalent values already exist in the project.

---

# 6. Scenario generation

Each challenge should be procedurally generated.

A scenario should contain some or all of:

```text
distance
weapon
ammunition
wind speed
wind direction
temperature
atmospheric conditions
target position
target size
target type
elevation difference
```

For the MVP, keep environmental parameters manageable.

Recommended initial scenario parameters:

```text
Distance
5.56 / 7.62
Wind speed
Wind direction
Target position
Target size
```

Later difficulty levels can add:

```text
temperature
altitude
air pressure
humidity
uphill/downhill angle
moving targets
partial cover
```

Do not make every parameter random from the beginning.

---

# 7. Distance generation

Distances should be randomized within sensible ranges.

Example:

### 5.56

```text
100–600 m
```

### 7.62

```text
100–800 m
```

These are gameplay ranges and should be configurable.

Do not hardcode them throughout the application.

Create a difficulty/scenario configuration.

---

# 8. Scope UI

The central gameplay element should be a visual representation of looking through a rifle scope.

The scope should contain:

* reticle
* target
* target environment
* optionally range indicators
* optionally MIL/MOA markings

The player should be able to adjust:

```text
Elevation
Windage
```

For example:

```text
ELEVATION
[-]  4.20 MIL  [+]

WINDAGE
[-]  0.80 MIL  [+]

[FIRE]
```

The controls should support reasonably precise adjustments.

Possible interaction:

* mouse wheel
* buttons
* keyboard shortcuts
* drag controls
* sliders

Choose the interaction that fits the existing UI framework best.

---

# 9. Reticle

Create a realistic but clean reticle.

Prefer SVG or Canvas rather than a static image.

The reticle should be resolution-independent.

Possible reticle:

```text
                 │
                 │
        ─────────┼─────────
                 │
                 │
                 ●
                 │
                 │
```

If appropriate, add MIL-based markings:

```text
       ·   ·   ·   ·
────────────┼────────────
       ·   ·   ●   ·   ·
────────────┼────────────
       ·   ·   ·   ·
```

The exact visual design can be improved later.

Do not spend excessive time making the reticle photorealistic during MVP.

---

# 10. Target rendering

Targets should preferably be generated procedurally.

Do NOT depend on external image-generation APIs for every challenge.

Use:

* SVG
* Canvas
* CSS
* procedural shapes

Possible environments:

```text
OPEN FIELD
FOREST
URBAN
MOUNTAIN
DESERT
```

For MVP, one or two environments are sufficient.

Possible target types:

```text
circular target
silhouette
small plate
simple geometric target
```

Target position and size should be randomized.

The visual scene should make different distances feel different.

For example:

```text
closer target → larger apparent target
farther target → smaller apparent target
```

---

# 11. Firing simulation

When the player presses:

```text
FIRE
```

the application should:

1. Capture current scope elevation.
2. Capture current scope windage.
3. Read current scenario parameters.
4. Run the existing ballistic calculation.
5. Calculate impact point.
6. Determine hit/miss.
7. Display the projectile impact.

Do not simply compare:

```text
playerElevation === correctElevation
```

The game should ideally calculate the actual impact point and compare it to the target.

---

# 12. Hit detection

A target should have a defined hit radius/shape.

Example:

```text
distance from impact → target center
```

Then:

```text
distance <= target radius
```

means a hit.

For more advanced targets, use a hitbox.

Accuracy should also be calculated.

Example:

```text
Target center:
X = 0
Y = 0

Impact:
X = 0.12
Y = -0.08

Error:
0.14
```

Display useful feedback after the shot.

---

# 13. Result screen

After firing:

```text
HIT
```

or:

```text
MISS
```

Show:

```text
Distance:       623 m
Weapon:         7.62 NATO

Elevation:      4.20 MIL
Windage:        0.80 MIL

Impact error:   0.14 m
Time:           13.4 s

Accuracy:       96%
Score:          842
```

For a miss, also show how far the shot landed from the target.

Example:

```text
MISS

Impact:
0.8 m left
0.4 m high
```

This feedback is important because the application should also function as a trainer.

---

# 14. Scoring

Create a simple but configurable scoring system.

Score should depend on:

```text
accuracy
time
distance
difficulty
```

Possible conceptual formula:

```text
baseScore
× accuracyMultiplier
× distanceMultiplier
× speedMultiplier
```

Avoid overly complicated scoring in MVP.

The exact formula should be easy to modify later.

---

# 15. Difficulty levels

Implement a simple difficulty system.

### EASY

* shorter distances
* low/no wind
* larger targets
* no atmospheric complexity

### MEDIUM

* longer distances
* moderate wind
* smaller targets

### HARD

* long distances
* stronger wind
* small targets
* more environmental variation

### EXTREME

Future feature.

Possible parameters:

* difficult visibility
* unknown distance
* target movement
* uphill/downhill
* changing wind

---

# 16. Training mode

Include a mode where the correct solution is easier to understand.

Example:

```text
TRAINING

Distance: 400 m
Wind: 2 m/s from left

Adjust the scope and fire.

After the shot:
```

Show:

```text
YOUR SETTINGS
Elevation: 2.84 MIL
Windage:   0.45 MIL

OPTIMAL SETTINGS
Elevation: 2.91 MIL
Windage:   0.50 MIL

ERROR
Elevation: -0.07 MIL
Windage:   -0.05 MIL
```

This mode should teach the relationship between scope adjustments and impact.

---

# 17. Challenge mode

Challenge mode should hide some information.

Example:

```text
7.62 NATO

TARGET DETECTED

Distance:
????

Wind:
????
```

The player may need to estimate distance or infer it from available information.

This should be a later feature, not necessarily MVP.

---

# 18. Optional range estimation mechanic

A particularly interesting future feature:

The player must estimate target distance.

For example, the target has a known approximate size.

The player uses the reticle/MIL markings to estimate distance.

The game then evaluates the estimated distance.

This creates a second skill:

```text
RANGE ESTIMATION
        +
BALLISTIC ADJUSTMENT
        +
AIMING
```

This could become one of the main gameplay mechanics.

---

# 19. Session mode

Add an option:

```text
QUICK CHALLENGE
```

and later:

```text
5 SHOT SESSION
10 SHOT SESSION
ENDLESS
```

Example:

```text
SESSION 4 / 10

Hits:       3
Misses:     1
Accuracy:   84%
Score:      3,240
Streak:     2
```

This makes the application replayable.

---

# 20. UI philosophy

The UI should be:

* clean
* technical
* dark
* minimal
* readable
* responsive
* desktop-first

Avoid excessive military clichés.

The application should feel like:

```text
modern tactical training software
```

rather than:

```text
generic FPS game HUD
```

---

# 21. Architecture requirements

Prefer separation between:

```text
BALLISTIC ENGINE
        ↓
SCENARIO GENERATOR
        ↓
GAME STATE
        ↓
SCOPE / VISUALIZATION
        ↓
INPUT
        ↓
SCORING
```

The ballistic engine should remain independent from the UI.

The scenario generator should also be independent from rendering.

This will make future features easier.

---

# 22. Existing project compatibility

Most important rule:

> Reuse existing project logic whenever it already solves the problem.

Before implementing any ballistic calculation, search the project for existing implementations.

Do NOT create a second implementation of:

* projectile trajectory
* ballistic coefficient handling
* gravity
* drag
* zeroing
* wind drift
* MOA/MIL conversion
* unit conversion

unless the existing implementation is genuinely unsuitable.

If existing code needs modification, make the smallest reasonable change.

---

# 23. Testing

Create tests for the important deterministic parts.

At minimum:

### Scenario generation

Verify:

* distances stay within configured ranges
* valid ammunition is selected
* wind stays within limits
* target coordinates are valid

### Ballistic integration

Verify that:

* known input produces expected impact
* zeroed rifle behaves correctly
* wind changes impact appropriately

### Hit detection

Test:

```text
direct hit
edge hit
near miss
clear miss
```

### Scoring

Test:

```text
high accuracy + fast time
high accuracy + slow time
low accuracy
```

---

# 24. MVP definition

Do NOT over-engineer the first version.

The MVP should contain:

```text
[✓] Existing ballistic engine reused
[✓] 5.56 NATO
[✓] 7.62 NATO
[✓] Random distance
[✓] Random wind
[✓] Random target position
[✓] Scope view
[✓] Reticle
[✓] Elevation adjustment
[✓] Windage adjustment
[✓] Fire button
[✓] Ballistic impact calculation
[✓] Hit/miss detection
[✓] Result screen
[✓] Score
[✓] Training mode
[✓] Challenge mode
```

Do NOT initially implement:

```text
[ ] multiplayer
[ ] accounts
[ ] online leaderboard
[ ] AI-generated environments
[ ] moving targets
[ ] complex weather simulation
[ ] advanced weapon customization
[ ] dozens of ammunition types
```

These can be future features.

---

# 25. Development process

Work incrementally.

### Phase 1 — Analyse

Inspect the existing project.

Do not modify code.

Produce an architecture proposal.

### Phase 2 — MVP foundation

Implement:

* game state
* scenario generator
* integration with ballistic engine
* basic scope
* target
* elevation/windage controls

### Phase 3 — Firing

Implement:

* fire action
* ballistic calculation
* impact point
* hit detection

### Phase 4 — Scoring

Implement:

* accuracy
* time
* score
* result screen

### Phase 5 — Game modes

Implement:

* training
* challenge

### Phase 6 — Polish

Improve:

* visual design
* animations
* scope rendering
* sound if appropriate
* responsive layout

---

# 26. Important UX requirement

The application should always make it obvious:

```text
WHAT IS THE TASK?
WHAT INFORMATION IS KNOWN?
WHAT DOES THE PLAYER CONTROL?
WHAT HAPPENS AFTER FIRING?
```

The player should never be confused about whether a miss was caused by:

* incorrect elevation
* incorrect windage
* incorrect distance
* incorrect ammunition
* target movement

For the MVP, keep the causes deterministic and explainable.

---

# 27. Future features

Keep the architecture extensible for:

### Range estimation

Player estimates distance using MIL reticle.

### Moving targets

Calculate lead.

### Variable wind

Different wind at different distances.

### Uphill/downhill shots

Introduce angle.

### Atmospheric conditions

Temperature, pressure, altitude, humidity.

### Multiple targets

Choose correct target.

### Time pressure

Countdown timer.

### Streak system

Consecutive hits.

### Leaderboard

Local high scores first, online later.

### Scenario editor

Allow the user to manually configure:

```text
distance
weapon
ammo
wind
target
environment
```

---

# 28. Final instruction to Claude

Start by analysing:

```text
/home/alek/Kucowansko/sniper/
```

Do NOT start implementing the game immediately.

First determine exactly what already exists and how the current ballistic calculations work.

Then provide:

```text
1. Existing architecture
2. Reusable components
3. Ballistic engine capabilities
4. Missing functionality
5. Proposed game architecture
6. Proposed file structure
7. MVP implementation plan
8. Potential technical problems
```

Wait for approval before performing a large refactor or implementing the complete game.

When implementation begins:

* preserve existing functionality
* avoid unnecessary dependencies
* reuse existing ballistic code
* keep the ballistic engine separate from UI
* write tests for deterministic calculations
* keep configuration data-driven
* make the application runnable locally with a simple command
* document how to run it

The final result should feel like a **small, polished sniper scope training game**, not merely another ballistic calculator.
