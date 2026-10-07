export type FoundationTestState = {
  ready: boolean;
  paused: boolean;
  seed: string;
  pointerEvents: number;
  pointerNormX: number;
  restartCount: number;
  probeNormX: number;
  viewport: {
    width: number;
    height: number;
  };
};

export type FoundationTestBridge = {
  getState(): FoundationTestState;
  restart(): void;
  pause(): void;
  resume(): void;
};

declare global {
  interface Window {
    __GAME_FACTORY_TEST__: FoundationTestBridge;
  }
}

export function installTestBridge(bridge: FoundationTestBridge): void {
  window.__GAME_FACTORY_TEST__ = bridge;
}
