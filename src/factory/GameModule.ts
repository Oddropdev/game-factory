export type GameInputFrame = {
  pointerPressed: boolean;
  pointerDown: boolean;
  pointerWorldX: number;
  pointerWorldY: number;
};

export type FoundationGameState = {
  pointerEvents: number;
  pointerNormX: number;
  restartCount: number;
};

export interface GameModule {
  init(): void;
  update(input: GameInputFrame): void;
  render(): void;
  renderHud(): void;
  restart(): void;
  foundationState(): FoundationGameState;
}
