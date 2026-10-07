import { SeededRng } from '../../core/random/SeededRng';

export type PhysicsObstacle = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type PhysicsCourse = {
  seed: number;
  ballRadius: number;
  gravity: number;
  restitution: number;
  bounds: {
    left: number;
    right: number;
    top: number;
    floor: number;
  };
  start: {
    x: number;
    y: number;
  };
  goal: {
    x: number;
    y: number;
    radius: number;
  };
  obstacle: PhysicsObstacle;
  solutionAim: {
    x: number;
    y: number;
  };
};

export const PHYSICS_SEED = 0x50485953;

export function createPhysicsCourse(seed = PHYSICS_SEED): PhysicsCourse {
  const rng = new SeededRng(seed);
  const obstacleXMin = rng.range(0.465, 0.485);

  return {
    seed,
    ballRadius: 0.025,
    gravity: 0.0007,
    restitution: 0.55,
    bounds: {
      left: 0.04,
      right: 0.96,
      top: 0.05,
      floor: 0.92
    },
    start: {
      x: 0.18,
      y: 0.74
    },
    goal: {
      x: 0.8,
      y: 0.74,
      radius: 0.065
    },
    obstacle: {
      xMin: obstacleXMin,
      xMax: obstacleXMin + 0.1,
      yMin: 0.64,
      yMax: 0.96
    },
    solutionAim: {
      x: 0.8,
      y: 0.29
    }
  };
}

export function physicsCourseSignature(course: PhysicsCourse): string {
  return [
    course.seed.toString(16),
    course.start.x.toFixed(4),
    course.start.y.toFixed(4),
    course.goal.x.toFixed(4),
    course.goal.y.toFixed(4),
    course.obstacle.xMin.toFixed(4),
    course.obstacle.xMax.toFixed(4),
    course.solutionAim.x.toFixed(4),
    course.solutionAim.y.toFixed(4)
  ].join('|');
}
