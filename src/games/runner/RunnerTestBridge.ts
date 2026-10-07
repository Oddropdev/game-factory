import type { RunnerGameTestState } from './RunnerGame';

export type RunnerTestBridge = {
  getState(): RunnerGameTestState;
};

declare global {
  interface Window {
    __GAME_FACTORY_RUNNER_TEST__: RunnerTestBridge;
  }
}

export function installRunnerTestBridge(bridge: RunnerTestBridge): void {
  window.__GAME_FACTORY_RUNNER_TEST__ = bridge;
}
