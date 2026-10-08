export type MassRunnerExperiment = 'a' | 'b' | 'c';

export function resolveMassRunnerExperiment(search = ''): MassRunnerExperiment {
  const value = new URLSearchParams(search).get('variant');
  return value === 'b' || value === 'c' ? value : 'a';
}

// W9.2B: do not mutate the accepted A game or its first-party level specs.
export function fluidSteeringStep(
  current: number,
  velocity: number,
  target: number
): { position: number; velocity: number } {
  const boundedTarget = Math.max(0, Math.min(1, target));
  const desired = Math.max(-0.09, Math.min(0.09, (boundedTarget - current) * 0.32));
  const nextVelocity = velocity + (desired - velocity) * 0.28;
  const position = Math.max(0, Math.min(1, current + nextVelocity));
  return { position, velocity: position === 0 || position === 1 ? 0 : nextVelocity };
}
