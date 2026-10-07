# GameSpec / LevelSpec Conventions

Date: 2026-10-07

Status: **ACCEPTED W5 CONVENTION**

## Purpose

W5 does not introduce a universal `GameSpec` or `LevelSpec` runtime type.

The three proof families show that configuration is useful, but their content semantics are materially different. The factory therefore standardizes **where data belongs and what properties it should have**, not one cross-family schema.

## GameSpec convention

A game may add a `GameSpec` only when multiple variants need to tune the same implementation.

A GameSpec should be:

- data-only;
- deterministic;
- JSON-compatible when practical;
- free of engine objects and callbacks;
- owned by one game or one proven family;
- safe for an agent to generate and diff.

A GameSpec should not contain lifecycle methods, rendering objects, platform SDK objects or mutable runtime state.

## LevelSpec convention

Level data remains family-owned.

Examples from the proof corpus:

- Runner → ordered distance/events and gate outcomes;
- Collector / Builder → resource layout, capacity and build targets;
- Physics / Puzzle → geometry, bounds, obstacle and goal parameters.

Do not force those into one union or inheritance tree.

A LevelSpec should become a named schema only when the same game/family needs multiple authored or generated levels.

## Determinism

When procedural generation is used:

```text
spec + seed -> deterministic course / level
```

The seed is explicit evidence input. Rendering must not be the source of gameplay randomness.

## Validation

Add schema validation only when external/generated data crosses a trust boundary or when malformed content has become a demonstrated failure mode.

Do not add validation libraries merely because a spec exists.

## File placement

Preferred family-local shape:

```text
src/games/<game>/
  <Game>Game.ts
  <Game>Model.ts       # when a pure model is useful
  <Game>Course.ts      # when deterministic content generation is useful
  <Game>Spec.ts        # only when variants justify it
  levels/              # only when multiple levels justify it
```

## Extraction rule

A future shared GameSpec/LevelSpec type requires new cross-family evidence.

Until then, the factory standardizes conventions and automation, not gameplay data semantics.
