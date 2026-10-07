import {
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  type MassRunnerEvent,
  type MassRunnerLevelSpec
} from './MassRunnerLevels';

export type MassRunnerPhase =
  | 'ready'
  | 'running'
  | 'level-clear'
  | 'level-fail'
  | 'complete';

export type MassRunnerSnapshot = {
  phase: MassRunnerPhase;
  levelIndex: number;
  levelId: string;
  levelName: string;
  levelNumber: number;
  totalLevels: number;
  distance: number;
  progress: number;
  playerNormX: number;
  mass: number;
  targetMass: number;
  totalScore: number;
  pickups: number;
  hits: number;
  gatesPassed: number;
  levelsCleared: number;
  eventsProcessed: number;
  lastEventId: string | null;
};

const FORWARD_PER_TICK = 0.65;
const STEER_PER_TICK = 0.08;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export class MassRunnerModel {
  private phase: MassRunnerPhase = 'ready';
  private levelIndex = 0;
  private distance = 0;
  private playerNormX = 0.5;
  private mass = 1;
  private totalScore = 0;
  private pickups = 0;
  private hits = 0;
  private gatesPassed = 0;
  private levelsCleared = 0;
  private lastEventId: string | null = null;
  private readonly processed = new Set<string>();

  constructor(
    private readonly levels: readonly MassRunnerLevelSpec[] =
      MASS_RUNNER_LEVELS
  ) {
    if (levels.length === 0) {
      throw new Error('Mass Runner requires at least one level');
    }

    this.loadLevel(0);
  }

  startOrAdvance(): void {
    if (this.phase === 'ready') {
      this.phase = 'running';
      return;
    }

    if (this.phase === 'level-clear') {
      this.loadLevel(this.levelIndex + 1);
      this.phase = 'running';
      return;
    }

    if (this.phase === 'level-fail') {
      this.loadLevel(this.levelIndex);
      this.phase = 'running';
      return;
    }

    if (this.phase === 'complete') {
      this.resetSession();
      this.phase = 'running';
    }
  }

  resetSession(): void {
    this.totalScore = 0;
    this.levelsCleared = 0;
    this.loadLevel(0);
    this.phase = 'ready';
  }

  step(targetNormX: number): void {
    if (this.phase !== 'running') {
      return;
    }

    const target = clamp01(targetNormX);
    const steeringDelta = Math.min(
      STEER_PER_TICK,
      Math.max(-STEER_PER_TICK, target - this.playerNormX)
    );

    this.playerNormX = clamp01(
      this.playerNormX + steeringDelta
    );

    const level = this.currentLevel();
    const previousDistance = this.distance;
    this.distance = Math.min(
      level.finishDistance,
      this.distance + FORWARD_PER_TICK
    );

    for (const event of level.events) {
      if (
        !this.processed.has(event.id) &&
        event.distance > previousDistance &&
        event.distance <= this.distance
      ) {
        this.processEvent(event);
        this.processed.add(event.id);
        this.lastEventId = event.id;
      }
    }

    if (this.distance >= level.finishDistance) {
      this.finishLevel();
    }
  }

  snapshot(): MassRunnerSnapshot {
    const level = this.currentLevel();

    return {
      phase: this.phase,
      levelIndex: this.levelIndex,
      levelId: level.id,
      levelName: level.name,
      levelNumber: this.levelIndex + 1,
      totalLevels: this.levels.length,
      distance: this.distance,
      progress: this.distance / level.finishDistance,
      playerNormX: this.playerNormX,
      mass: this.mass,
      targetMass: level.targetMass,
      totalScore: this.totalScore,
      pickups: this.pickups,
      hits: this.hits,
      gatesPassed: this.gatesPassed,
      levelsCleared: this.levelsCleared,
      eventsProcessed: this.processed.size,
      lastEventId: this.lastEventId
    };
  }

  getCurrentLevel(): MassRunnerLevelSpec {
    return this.currentLevel();
  }

  private currentLevel(): MassRunnerLevelSpec {
    const level = this.levels[this.levelIndex];

    if (!level) {
      throw new Error(
        `Missing Mass Runner level at index ${this.levelIndex}`
      );
    }

    return level;
  }

  private loadLevel(index: number): void {
    if (index < 0 || index >= this.levels.length) {
      throw new Error(`Invalid Mass Runner level index: ${index}`);
    }

    this.levelIndex = index;
    const level = this.currentLevel();
    this.distance = 0;
    this.playerNormX = 0.5;
    this.mass = level.startMass;
    this.pickups = 0;
    this.hits = 0;
    this.gatesPassed = 0;
    this.lastEventId = null;
    this.processed.clear();
  }

  private finishLevel(): void {
    const level = this.currentLevel();

    if (this.mass < level.targetMass) {
      this.phase = 'level-fail';
      return;
    }

    this.levelsCleared += 1;
    this.totalScore +=
      this.mass * 10 +
      this.pickups * 5 -
      this.hits * 3;

    this.phase =
      this.levelIndex === this.levels.length - 1
        ? 'complete'
        : 'level-clear';
  }

  private processEvent(event: MassRunnerEvent): void {
    if (event.kind === 'gate') {
      this.gatesPassed += 1;
      const operation =
        this.playerNormX < event.split
          ? event.left
          : event.right;
      this.mass = applyMassOperation(this.mass, operation);
      return;
    }

    const collided =
      Math.abs(this.playerNormX - event.x) <=
      (event.kind === 'orb' ? 0.1 : event.width * 0.5);

    if (!collided) {
      return;
    }

    if (event.kind === 'orb') {
      this.mass = Math.min(99, this.mass + event.amount);
      this.pickups += 1;
      return;
    }

    this.mass = Math.max(1, this.mass - event.penalty);
    this.hits += 1;
  }
}
