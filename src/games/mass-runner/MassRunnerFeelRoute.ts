import {
  applyMassOperation,
  type MassRunnerEvent,
  type MassRunnerLevelSpec
} from './MassRunnerLevels';
import type { MassRunnerSnapshot } from './MassRunnerModel';

export function massRunnerHeroTarget(
  snapshot: MassRunnerSnapshot,
  level: MassRunnerLevelSpec
): number {
  const event = level.events[snapshot.eventsProcessed];

  if (!event) {
    return snapshot.playerNormX;
  }

  return targetForEvent(event, snapshot.mass);
}

function targetForEvent(
  event: MassRunnerEvent,
  mass: number
): number {
  if (event.kind === 'orb') {
    return event.x;
  }

  if (event.kind === 'hazard') {
    return event.x < 0.5 ? 0.86 : 0.14;
  }

  const left = applyMassOperation(mass, event.left);
  const right = applyMassOperation(mass, event.right);

  return left >= right ? 0.25 : 0.75;
}
