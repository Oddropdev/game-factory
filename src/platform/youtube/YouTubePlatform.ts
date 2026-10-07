import type {
  AudioEnabledHandler,
  PlatformBridge,
  PlatformLifecycleHandlers
} from '../PlatformBridge';
import type { YouTubePlayablesSdk } from './YouTubeSdk';

export class YouTubePlatform implements PlatformBridge {
  readonly id = 'youtube' as const;

  private initialized = false;
  private firstFrameSignaled = false;
  private readySignaled = false;

  constructor(
    private readonly sdk: YouTubePlayablesSdk | undefined = window.ytgame
  ) {}

  init(): void {
    if (!this.sdk) {
      throw new Error(
        'YouTube Playables SDK missing. Load https://www.youtube.com/game_api/v1 before game code.'
      );
    }

    this.initialized = true;
  }

  firstFrameReady(): void {
    this.assertInitialized();

    if (this.firstFrameSignaled) {
      return;
    }

    this.sdk!.game.firstFrameReady();
    this.firstFrameSignaled = true;
  }

  ready(): void {
    this.assertInitialized();

    if (!this.firstFrameSignaled) {
      throw new Error(
        'YouTubePlatform.ready() called before firstFrameReady()'
      );
    }

    if (this.readySignaled) {
      return;
    }

    this.sdk!.game.gameReady();
    this.readySignaled = true;
  }

  bindLifecycle(handlers: PlatformLifecycleHandlers): () => void {
    this.assertInitialized();

    const unsubscribePause = this.sdk!.system.onPause(
      handlers.pause
    );
    const unsubscribeResume = this.sdk!.system.onResume(
      handlers.resume
    );

    return () => {
      unsubscribePause();
      unsubscribeResume();
    };
  }

  isAudioEnabled(): boolean {
    this.assertInitialized();
    return this.sdk!.system.isAudioEnabled();
  }

  onAudioEnabledChange(handler: AudioEnabledHandler): () => void {
    this.assertInitialized();
    return this.sdk!.system.onAudioEnabledChange(handler);
  }

  private assertInitialized(): void {
    if (!this.initialized || !this.sdk) {
      throw new Error('YouTubePlatform used before init()');
    }
  }
}
