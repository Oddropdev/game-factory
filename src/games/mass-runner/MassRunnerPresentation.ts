import type {
  MassRunnerEvent,
  MassRunnerLevelSpec
} from './MassRunnerLevels';
import type {
  MassRunnerPhase,
  MassRunnerSnapshot
} from './MassRunnerModel';

export type MassRunnerPresentationMode =
  | 'baseline'
  | 'polished';

export type MassRunnerPresentationCue =
  | 'pickup'
  | 'gate-positive'
  | 'gate-negative'
  | 'hazard'
  | 'level-clear'
  | 'level-fail'
  | 'complete';

export type MassRunnerPresentationEffect = {
  id: number;
  kind: MassRunnerPresentationCue;
  age: number;
  duration: number;
  intensity: number;
  label: string;
  seed: number;
};

export type MassRunnerPresentationSnapshot = {
  mode: MassRunnerPresentationMode;
  tick: number;
  lean: number;
  scaleX: number;
  scaleY: number;
  trailStrength: number;
  shadowScale: number;
  massPulse: number;
  hudPulse: number;
  positiveFlash: number;
  negativeFlash: number;
  shakeX: number;
  shakeY: number;
  lastCue: MassRunnerPresentationCue | null;
  effects: readonly MassRunnerPresentationEffect[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function eventSeed(id: string): number {
  let hash = 2166136261;

  for (const char of id) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function operationLabel(
  event: Extract<MassRunnerEvent, { kind: 'gate' }>,
  previousMass: number,
  nextMass: number
): string {
  const operation =
    nextMass >= previousMass
      ? nextMass - previousMass
      : nextMass - previousMass;

  if (
    event.left.op === 'multiply' &&
    Math.round(previousMass * event.left.value) === nextMass
  ) {
    return `×${event.left.value}`;
  }

  if (
    event.right.op === 'multiply' &&
    Math.round(previousMass * event.right.value) === nextMass
  ) {
    return `×${event.right.value}`;
  }

  return operation >= 0 ? `+${operation}` : `${operation}`;
}

export function resolveMassRunnerPresentationMode(
  search = ''
): MassRunnerPresentationMode {
  const value = new URLSearchParams(search).get('presentation');

  return value === 'baseline' ? 'baseline' : 'polished';
}

export class MassRunnerPresentation {
  private tick = 0;
  private previousMass = 1;
  private previousPickups = 0;
  private previousHits = 0;
  private previousPhase: MassRunnerPhase = 'ready';
  private previousEventId: string | null = null;
  private effectId = 0;
  private effects: MassRunnerPresentationEffect[] = [];
  private lean = 0;
  private massPulse = 0;
  private hudPulse = 0;
  private positiveFlash = 0;
  private negativeFlash = 0;
  private trauma = 0;
  private lastCue: MassRunnerPresentationCue | null = null;

  constructor(
    private readonly mode: MassRunnerPresentationMode
  ) {}

  reset(snapshot: MassRunnerSnapshot): void {
    this.tick = 0;
    this.previousMass = snapshot.mass;
    this.previousPickups = snapshot.pickups;
    this.previousHits = snapshot.hits;
    this.previousPhase = snapshot.phase;
    this.previousEventId = snapshot.lastEventId;
    this.effectId = 0;
    this.effects = [];
    this.lean = 0;
    this.massPulse = 0;
    this.hudPulse = 0;
    this.positiveFlash = 0;
    this.negativeFlash = 0;
    this.trauma = 0;
    this.lastCue = null;
  }

  update(
    snapshot: MassRunnerSnapshot,
    level: MassRunnerLevelSpec,
    targetNormX: number
  ): void {
    this.tick += 1;

    const steerError = targetNormX - snapshot.playerNormX;
    this.lean =
      this.lean * 0.72 +
      clamp(steerError * 2.4, -1, 1) * 0.28;

    this.massPulse *= 0.78;
    this.hudPulse *= 0.8;
    this.positiveFlash *= 0.72;
    this.negativeFlash *= 0.68;
    this.trauma *= 0.74;

    this.effects = this.effects
      .map(effect => ({
        ...effect,
        age: effect.age + 1
      }))
      .filter(effect => effect.age < effect.duration);

    if (this.mode === 'polished') {
      this.detectEventCue(snapshot, level);
      this.detectPhaseCue(snapshot);
    }

    this.previousMass = snapshot.mass;
    this.previousPickups = snapshot.pickups;
    this.previousHits = snapshot.hits;
    this.previousPhase = snapshot.phase;
    this.previousEventId = snapshot.lastEventId;
  }

  snapshot(
    gameplay: MassRunnerSnapshot
  ): MassRunnerPresentationSnapshot {
    const steering = Math.abs(this.lean);
    const running = gameplay.phase === 'running';
    const wobble = running
      ? Math.sin(this.tick * 0.34 + gameplay.mass * 0.19) * 0.022
      : 0;

    const scaleX =
      1 +
      this.massPulse * 0.16 +
      steering * 0.08 -
      wobble;
    const scaleY =
      1 -
      this.massPulse * 0.09 -
      steering * 0.04 +
      wobble;

    const shakeX =
      Math.sin(this.tick * 2.41 + 0.8) *
      this.trauma *
      0.16;
    const shakeY =
      Math.cos(this.tick * 2.93 + 1.4) *
      this.trauma *
      0.08;

    return {
      mode: this.mode,
      tick: this.tick,
      lean: this.lean,
      scaleX,
      scaleY,
      trailStrength: running
        ? clamp(0.18 + steering * 0.5 + gameplay.mass / 140, 0, 0.85)
        : 0,
      shadowScale:
        1 + gameplay.mass / 70 + this.massPulse * 0.15,
      massPulse: this.massPulse,
      hudPulse: this.hudPulse,
      positiveFlash: this.positiveFlash,
      negativeFlash: this.negativeFlash,
      shakeX,
      shakeY,
      lastCue: this.lastCue,
      effects: this.effects
    };
  }

  private detectEventCue(
    snapshot: MassRunnerSnapshot,
    level: MassRunnerLevelSpec
  ): void {
    if (
      !snapshot.lastEventId ||
      snapshot.lastEventId === this.previousEventId
    ) {
      return;
    }

    const event = level.events.find(
      candidate => candidate.id === snapshot.lastEventId
    );

    if (!event) {
      return;
    }

    if (
      event.kind === 'orb' &&
      snapshot.pickups > this.previousPickups
    ) {
      this.trigger(
        'pickup',
        `+${event.amount}`,
        0.65,
        30,
        event.id
      );
      this.massPulse = 1;
      this.hudPulse = 0.8;
      this.positiveFlash = Math.max(this.positiveFlash, 0.22);
      return;
    }

    if (
      event.kind === 'hazard' &&
      snapshot.hits > this.previousHits
    ) {
      this.trigger(
        'hazard',
        `-${event.penalty}`,
        1,
        34,
        event.id
      );
      this.massPulse = 0.75;
      this.hudPulse = 1;
      this.negativeFlash = 0.8;
      this.trauma = 1;
      return;
    }

    if (event.kind === 'gate') {
      const positive = snapshot.mass >= this.previousMass;
      const cue = positive
        ? 'gate-positive'
        : 'gate-negative';
      const multiplier =
        event.left.op === 'multiply' ||
        event.right.op === 'multiply';
      const intensity = multiplier ? 1 : 0.78;

      this.trigger(
        cue,
        operationLabel(
          event,
          this.previousMass,
          snapshot.mass
        ),
        intensity,
        multiplier ? 42 : 34,
        event.id
      );

      this.massPulse = multiplier ? 1.15 : 0.88;
      this.hudPulse = 1;

      if (positive) {
        this.positiveFlash = multiplier ? 0.72 : 0.48;
        this.trauma = Math.max(this.trauma, multiplier ? 0.44 : 0.22);
      } else {
        this.negativeFlash = 0.62;
        this.trauma = Math.max(this.trauma, 0.5);
      }
    }
  }

  private detectPhaseCue(snapshot: MassRunnerSnapshot): void {
    if (snapshot.phase === this.previousPhase) {
      return;
    }

    if (snapshot.phase === 'level-clear') {
      this.trigger(
        'level-clear',
        'CLEAR!',
        1,
        70,
        `clear-${snapshot.levelId}`
      );
      this.positiveFlash = 0.7;
      this.massPulse = 1;
      this.hudPulse = 1;
      this.trauma = 0.35;
      return;
    }

    if (snapshot.phase === 'level-fail') {
      this.trigger(
        'level-fail',
        'RETRY',
        0.9,
        54,
        `fail-${snapshot.levelId}`
      );
      this.negativeFlash = 0.72;
      this.hudPulse = 1;
      this.trauma = 0.65;
      return;
    }

    if (snapshot.phase === 'complete') {
      this.trigger(
        'complete',
        'MASSIVE!',
        1.25,
        110,
        'session-complete'
      );
      this.positiveFlash = 1;
      this.massPulse = 1.35;
      this.hudPulse = 1.2;
      this.trauma = 0.55;
    }
  }

  private trigger(
    kind: MassRunnerPresentationCue,
    label: string,
    intensity: number,
    duration: number,
    seedLabel: string
  ): void {
    this.effectId += 1;
    this.lastCue = kind;
    this.effects.push({
      id: this.effectId,
      kind,
      age: 0,
      duration,
      intensity,
      label,
      seed: eventSeed(seedLabel)
    });
  }
}
