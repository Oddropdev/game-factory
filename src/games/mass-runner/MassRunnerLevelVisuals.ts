// Level identity stays entirely game-local; no generic Factory theme system.
export const MASS_RUNNER_LEVEL_ACCENTS = [
  [0.38, 0.7, 1],    // BULK UP — electric blue
  [0.72, 0.53, 1],   // DOUBLE DOWN — violet
  [1, 0.68, 0.3],    // HEAVY TRAFFIC — amber
  [0.28, 0.94, 0.77],// CRITICAL MASS — teal
  [1, 0.43, 0.68]    // MASSIVE FINISH — magenta
] as const;

export function massRunnerLevelAccent(
  levelIndex: number
): readonly [number, number, number] {
  return MASS_RUNNER_LEVEL_ACCENTS[levelIndex] ??
    MASS_RUNNER_LEVEL_ACCENTS[0];
}
