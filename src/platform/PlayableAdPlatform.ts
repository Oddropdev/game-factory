import type {
  AudioEnabledHandler,
  PlatformBridge,
  PlatformLifecycleHandlers
} from './PlatformBridge';

export class PlayableAdPlatform implements PlatformBridge {
  readonly id = 'playable-ad' as const;

  private initialized = false;
  private firstFrameSignaled = false;

  init(): void {
    this.initialized = true;
  }

  firstFrameReady(): void {
    this.assertInitialized();
    this.firstFrameSignaled = true;
  }

  ready(): void {
    this.assertInitialized();

    if (!this.firstFrameSignaled) {
      throw new Error(
        'PlayableAdPlatform.ready() called before firstFrameReady()'
      );
    }
  }

  bindLifecycle(handlers: PlatformLifecycleHandlers): () => void {
    this.assertInitialized();

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        handlers.pause();
      } else {
        handlers.resume();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );
    };
  }

  isAudioEnabled(): boolean {
    return true;
  }

  onAudioEnabledChange(_handler: AudioEnabledHandler): () => void {
    return () => {};
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error('PlayableAdPlatform used before init()');
    }
  }
}
