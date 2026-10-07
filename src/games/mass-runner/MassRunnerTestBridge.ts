import type { MassRunnerGameTestState } from './MassRunnerGame';

export type MassRunnerTestBridge = {
  getState(): MassRunnerGameTestState;
};

declare global {
  interface Window {
    __GAME_FACTORY_MASS_RUNNER_TEST__: MassRunnerTestBridge;
  }
}

export function installMassRunnerTestBridge(
  bridge: MassRunnerTestBridge
): void {
  window.__GAME_FACTORY_MASS_RUNNER_TEST__ = bridge;
}
