import type {
  PhysicsCourse,
  PhysicsObstacle
} from './PhysicsCourse';

export type PhysicsStatus = 'ready' | 'flying' | 'solved';
export type PhysicsCollision = 'bounds' | 'obstacle' | null;

export type PhysicsSnapshot = {
  status: PhysicsStatus;
  ballX: number;
  ballY: number;
  velocityX: number;
  velocityY: number;
  aimX: number;
  aimY: number;
  shots: number;
  collisions: number;
  ticks: number;
  lastCollision: PhysicsCollision;
};

const MIN_LAUNCH_SPEED = 0.002;
const SETTLE_SPEED = 0.0015;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  return Math.hypot(ax - bx, ay - by);
}

export class PhysicsModel {
  private status: PhysicsStatus = 'ready';
  private ballX: number;
  private ballY: number;
  private velocityX = 0;
  private velocityY = 0;
  private aimX: number;
  private aimY: number;
  private shots = 0;
  private collisions = 0;
  private ticks = 0;
  private lastCollision: PhysicsCollision = null;

  constructor(private readonly course: PhysicsCourse) {
    this.ballX = course.start.x;
    this.ballY = course.start.y;
    this.aimX = course.solutionAim.x;
    this.aimY = course.solutionAim.y;
  }

  reset(): void {
    this.status = 'ready';
    this.ballX = this.course.start.x;
    this.ballY = this.course.start.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.aimX = this.course.solutionAim.x;
    this.aimY = this.course.solutionAim.y;
    this.shots = 0;
    this.collisions = 0;
    this.ticks = 0;
    this.lastCollision = null;
  }

  launch(targetX: number, targetY: number): boolean {
    if (this.status !== 'ready') {
      return false;
    }

    const normalizedTargetX = clamp(targetX, 0, 1);
    const normalizedTargetY = clamp(targetY, 0, 1);
    const velocityX = clamp(
      (normalizedTargetX - this.ballX) * 0.02,
      -0.018,
      0.018
    );
    const velocityY = clamp(
      (normalizedTargetY - this.ballY) * 0.04,
      -0.024,
      0.018
    );

    if (Math.hypot(velocityX, velocityY) < MIN_LAUNCH_SPEED) {
      return false;
    }

    this.aimX = normalizedTargetX;
    this.aimY = normalizedTargetY;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.status = 'flying';
    this.shots += 1;
    return true;
  }

  step(): void {
    if (this.status !== 'flying') {
      return;
    }

    this.ticks += 1;
    this.lastCollision = null;

    this.velocityY += this.course.gravity;
    this.ballX += this.velocityX;
    this.ballY += this.velocityY;

    this.resolveBounds();
    this.resolveObstacle(this.course.obstacle);

    if (
      distance(
        this.ballX,
        this.ballY,
        this.course.goal.x,
        this.course.goal.y
      ) <= this.course.goal.radius + this.course.ballRadius
    ) {
      this.status = 'solved';
      this.velocityX = 0;
      this.velocityY = 0;
    }
  }

  snapshot(): PhysicsSnapshot {
    return {
      status: this.status,
      ballX: this.ballX,
      ballY: this.ballY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      aimX: this.aimX,
      aimY: this.aimY,
      shots: this.shots,
      collisions: this.collisions,
      ticks: this.ticks,
      lastCollision: this.lastCollision
    };
  }

  getCourse(): PhysicsCourse {
    return this.course;
  }

  private resolveBounds(): void {
    const { ballRadius: radius, bounds, restitution } = this.course;

    if (this.ballX - radius < bounds.left) {
      this.ballX = bounds.left + radius;
      this.velocityX = Math.abs(this.velocityX) * restitution;
      this.recordCollision('bounds');
    } else if (this.ballX + radius > bounds.right) {
      this.ballX = bounds.right - radius;
      this.velocityX = -Math.abs(this.velocityX) * restitution;
      this.recordCollision('bounds');
    }

    if (this.ballY - radius < bounds.top) {
      this.ballY = bounds.top + radius;
      this.velocityY = Math.abs(this.velocityY) * restitution;
      this.recordCollision('bounds');
    }

    if (this.ballY + radius > bounds.floor) {
      this.ballY = bounds.floor - radius;

      if (
        Math.abs(this.velocityY) < SETTLE_SPEED &&
        Math.abs(this.velocityX) < SETTLE_SPEED
      ) {
        this.velocityX = 0;
        this.velocityY = 0;
        this.status = 'ready';
        return;
      }

      this.velocityY = -Math.abs(this.velocityY) * restitution;
      this.velocityX *= 0.86;
      this.recordCollision('bounds');
    }
  }

  private resolveObstacle(obstacle: PhysicsObstacle): void {
    if (this.status !== 'flying') {
      return;
    }

    const radius = this.course.ballRadius;
    const closestX = clamp(this.ballX, obstacle.xMin, obstacle.xMax);
    const closestY = clamp(this.ballY, obstacle.yMin, obstacle.yMax);
    const dx = this.ballX - closestX;
    const dy = this.ballY - closestY;

    if (dx * dx + dy * dy >= radius * radius) {
      return;
    }

    const expandedLeft = obstacle.xMin - radius;
    const expandedRight = obstacle.xMax + radius;
    const expandedTop = obstacle.yMin - radius;
    const expandedBottom = obstacle.yMax + radius;

    const distances = [
      { side: 'left' as const, value: Math.abs(this.ballX - expandedLeft) },
      { side: 'right' as const, value: Math.abs(expandedRight - this.ballX) },
      { side: 'top' as const, value: Math.abs(this.ballY - expandedTop) },
      { side: 'bottom' as const, value: Math.abs(expandedBottom - this.ballY) }
    ];

    distances.sort((a, b) => a.value - b.value);
    const side = distances[0]?.side;

    if (side === 'left') {
      this.ballX = expandedLeft;
      this.velocityX = -Math.abs(this.velocityX) * this.course.restitution;
    } else if (side === 'right') {
      this.ballX = expandedRight;
      this.velocityX = Math.abs(this.velocityX) * this.course.restitution;
    } else if (side === 'top') {
      this.ballY = expandedTop;
      this.velocityY = -Math.abs(this.velocityY) * this.course.restitution;
    } else if (side === 'bottom') {
      this.ballY = expandedBottom;
      this.velocityY = Math.abs(this.velocityY) * this.course.restitution;
    }

    this.recordCollision('obstacle');
  }

  private recordCollision(kind: Exclude<PhysicsCollision, null>): void {
    this.collisions += 1;
    this.lastCollision = kind;
  }
}
