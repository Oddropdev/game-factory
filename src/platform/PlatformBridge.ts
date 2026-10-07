export type PlatformId = 'web' | 'youtube' | 'playable-ad';

export type PlatformLifecycleHandlers = {
  pause(): void;
  resume(): void;
};

export type AudioEnabledHandler = (enabled: boolean) => void;

export interface PlatformBridge {
  readonly id: PlatformId;

  init(): void;
  firstFrameReady(): void;
  ready(): void;

  bindLifecycle(handlers: PlatformLifecycleHandlers): () => void;

  isAudioEnabled(): boolean;
  onAudioEnabledChange(handler: AudioEnabledHandler): () => void;
}

declare global {
  interface Window {
    __GAME_FACTORY_PLATFORM__?: PlatformId;
  }
}
