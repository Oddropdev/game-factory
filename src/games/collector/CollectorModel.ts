import type { CollectorCourse } from './CollectorCourse';

export type CollectorStatus = 'collecting' | 'complete';

export type CollectorResourceState = {
  id: string;
  x: number;
  y: number;
  active: boolean;
};

export type CollectorSnapshot = {
  status: CollectorStatus;
  playerNormX: number;
  playerNormY: number;
  targetNormX: number;
  targetNormY: number;
  carrying: number;
  collected: number;
  deposited: number;
  buildStage: number;
  depositTrips: number;
  resourcesRemaining: number;
  resources: readonly CollectorResourceState[];
};

const MOVE_PER_TICK = 0.022;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function distance(
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  return Math.hypot(ax - bx, ay - by);
}

export class CollectorModel {
  private status: CollectorStatus = 'collecting';
  private playerNormX = 0.5;
  private playerNormY = 0.72;
  private targetNormX = 0.5;
  private targetNormY = 0.72;
  private carrying = 0;
  private collected = 0;
  private deposited = 0;
  private buildStage = 0;
  private depositTrips = 0;
  private resources = this.createResourceState();

  constructor(private readonly course: CollectorCourse) {}

  reset(): void {
    this.status = 'collecting';
    this.playerNormX = 0.5;
    this.playerNormY = 0.72;
    this.targetNormX = 0.5;
    this.targetNormY = 0.72;
    this.carrying = 0;
    this.collected = 0;
    this.deposited = 0;
    this.buildStage = 0;
    this.depositTrips = 0;
    this.resources = this.createResourceState();
  }

  step(targetNormX: number, targetNormY: number): void {
    if (this.status === 'complete') {
      return;
    }

    this.targetNormX = clamp01(targetNormX);
    this.targetNormY = clamp01(targetNormY);
    this.moveTowardTarget();
    this.collectNearbyResource();
    this.depositAtBuildZone();
  }

  snapshot(): CollectorSnapshot {
    return {
      status: this.status,
      playerNormX: this.playerNormX,
      playerNormY: this.playerNormY,
      targetNormX: this.targetNormX,
      targetNormY: this.targetNormY,
      carrying: this.carrying,
      collected: this.collected,
      deposited: this.deposited,
      buildStage: this.buildStage,
      depositTrips: this.depositTrips,
      resourcesRemaining: this.resources.filter(resource => resource.active).length,
      resources: this.resources.map(resource => ({ ...resource }))
    };
  }

  getCourse(): CollectorCourse {
    return this.course;
  }

  private createResourceState(): CollectorResourceState[] {
    return this.course.resources.map(resource => ({
      id: resource.id,
      x: resource.x,
      y: resource.y,
      active: true
    }));
  }

  private moveTowardTarget(): void {
    const dx = this.targetNormX - this.playerNormX;
    const dy = this.targetNormY - this.playerNormY;
    const length = Math.hypot(dx, dy);

    if (length <= MOVE_PER_TICK) {
      this.playerNormX = this.targetNormX;
      this.playerNormY = this.targetNormY;
      return;
    }

    this.playerNormX = clamp01(
      this.playerNormX + (dx / length) * MOVE_PER_TICK
    );
    this.playerNormY = clamp01(
      this.playerNormY + (dy / length) * MOVE_PER_TICK
    );
  }

  private collectNearbyResource(): void {
    if (this.carrying >= this.course.carryCapacity) {
      return;
    }

    const resource = this.resources.find(
      candidate =>
        candidate.active &&
        distance(
          this.playerNormX,
          this.playerNormY,
          candidate.x,
          candidate.y
        ) <= this.course.pickupRadius
    );

    if (!resource) {
      return;
    }

    resource.active = false;
    this.carrying += 1;
    this.collected += 1;
  }

  private depositAtBuildZone(): void {
    if (this.carrying === 0) {
      return;
    }

    const buildZone = this.course.buildZone;
    const atBuildZone =
      distance(
        this.playerNormX,
        this.playerNormY,
        buildZone.x,
        buildZone.y
      ) <= buildZone.radius;

    if (!atBuildZone) {
      return;
    }

    this.deposited = Math.min(
      this.course.buildCost,
      this.deposited + this.carrying
    );
    this.carrying = 0;
    this.depositTrips += 1;

    const resourcesPerStage =
      this.course.buildCost / this.course.buildStages;
    this.buildStage = Math.min(
      this.course.buildStages,
      Math.ceil(this.deposited / resourcesPerStage)
    );

    if (this.deposited >= this.course.buildCost) {
      this.status = 'complete';
    }
  }
}
