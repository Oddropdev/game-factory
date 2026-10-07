import type { RunnerCourse, RunnerCourseEvent } from './RunnerCourse';

export type RunnerStatus = 'running' | 'finished';

export type RunnerSnapshot = {
  status: RunnerStatus;
  distance: number;
  progress: number;
  playerNormX: number;
  score: number;
  pickups: number;
  hits: number;
  gatesPassed: number;
  eventsProcessed: number;
  lastEventId: string | null;
};

const FORWARD_PER_TICK = 0.5;
const STEER_PER_TICK = 0.055;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export class RunnerModel {
  private status: RunnerStatus = 'running';
  private distance = 0;
  private playerNormX = 0.5;
  private score = 0;
  private pickups = 0;
  private hits = 0;
  private gatesPassed = 0;
  private lastEventId: string | null = null;
  private readonly processed = new Set<string>();

  constructor(private readonly course: RunnerCourse) {}

  reset(): void {
    this.status = 'running';
    this.distance = 0;
    this.playerNormX = 0.5;
    this.score = 0;
    this.pickups = 0;
    this.hits = 0;
    this.gatesPassed = 0;
    this.lastEventId = null;
    this.processed.clear();
  }

  step(targetNormX: number): void {
    if (this.status === 'finished') {
      return;
    }

    const target = clamp01(targetNormX);
    const steeringDelta = Math.min(
      STEER_PER_TICK,
      Math.max(-STEER_PER_TICK, target - this.playerNormX)
    );
    this.playerNormX = clamp01(this.playerNormX + steeringDelta);

    const previousDistance = this.distance;
    this.distance = Math.min(
      this.course.finishDistance,
      this.distance + FORWARD_PER_TICK
    );

    for (const event of this.course.events) {
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

    if (this.distance >= this.course.finishDistance) {
      this.status = 'finished';
    }
  }

  snapshot(): RunnerSnapshot {
    return {
      status: this.status,
      distance: this.distance,
      progress: this.distance / this.course.finishDistance,
      playerNormX: this.playerNormX,
      score: this.score,
      pickups: this.pickups,
      hits: this.hits,
      gatesPassed: this.gatesPassed,
      eventsProcessed: this.processed.size,
      lastEventId: this.lastEventId
    };
  }

  getCourse(): RunnerCourse {
    return this.course;
  }

  private processEvent(event: RunnerCourseEvent): void {
    if (event.kind === 'gate') {
      this.gatesPassed += 1;
      const delta =
        this.playerNormX < event.split ? event.leftDelta : event.rightDelta;
      this.score = Math.max(0, this.score + delta);
      return;
    }

    const collided =
      Math.abs(this.playerNormX - event.x) <= event.width * 0.5;

    if (!collided) {
      return;
    }

    if (event.kind === 'pickup') {
      this.pickups += 1;
      this.score += event.points;
      return;
    }

    this.hits += 1;
    this.score = Math.max(0, this.score - event.penalty);
  }
}
