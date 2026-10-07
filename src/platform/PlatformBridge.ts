export interface PlatformBridge {
  init(): void;
  ready(): void;
  pause(): void;
  resume(): void;
}
