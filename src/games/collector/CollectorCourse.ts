import { SeededRng } from '../../core/random/SeededRng';

export type CollectorResourceNode = {
  id: string;
  x: number;
  y: number;
  value: number;
};

export type CollectorCourse = {
  seed: number;
  carryCapacity: number;
  buildCost: number;
  buildStages: number;
  pickupRadius: number;
  buildZone: {
    x: number;
    y: number;
    radius: number;
  };
  resources: readonly CollectorResourceNode[];
};

export const COLLECTOR_SEED = 0xc011ec7;

const COLUMNS = [0.22, 0.5, 0.78] as const;
const ROWS = [0.28, 0.5] as const;

export function createCollectorCourse(seed = COLLECTOR_SEED): CollectorCourse {
  const rng = new SeededRng(seed);
  const resources: CollectorResourceNode[] = [];

  let index = 0;
  for (const row of ROWS) {
    for (const column of COLUMNS) {
      const jitterX = rng.range(-0.018, 0.018);
      const jitterY = rng.range(-0.018, 0.018);

      resources.push({
        id: `resource-${index + 1}`,
        x: column + jitterX,
        y: row + jitterY,
        value: 1
      });

      index += 1;
    }
  }

  return {
    seed,
    carryCapacity: 3,
    buildCost: 6,
    buildStages: 3,
    pickupRadius: 0.048,
    buildZone: {
      x: 0.5,
      y: 0.82,
      radius: 0.075
    },
    resources
  };
}

export function collectorCourseSignature(course: CollectorCourse): string {
  return [
    course.seed.toString(16),
    course.carryCapacity,
    course.buildCost,
    course.buildStages,
    ...course.resources.map(
      resource =>
        `${resource.id}:${resource.x.toFixed(4)}:${resource.y.toFixed(4)}`
    )
  ].join('|');
}
