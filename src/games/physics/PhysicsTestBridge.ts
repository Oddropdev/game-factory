import type { PhysicsGameTestState } from './PhysicsGame';

export type PhysicsTestBridge = {
  getState(): PhysicsGameTestState;
};

declare global {
  interface Window {
    __GAME_FACTORY_PHYSICS_TEST__: PhysicsTestBridge;
  }
}

export function installPhysicsTestBridge(bridge: PhysicsTestBridge): void {
  window.__GAME_FACTORY_PHYSICS_TEST__ = bridge;
}
