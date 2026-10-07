import type { CollectorGameTestState } from './CollectorGame';

export type CollectorTestBridge = {
  getState(): CollectorGameTestState;
};

declare global {
  interface Window {
    __GAME_FACTORY_COLLECTOR_TEST__: CollectorTestBridge;
  }
}

export function installCollectorTestBridge(
  bridge: CollectorTestBridge
): void {
  window.__GAME_FACTORY_COLLECTOR_TEST__ = bridge;
}
