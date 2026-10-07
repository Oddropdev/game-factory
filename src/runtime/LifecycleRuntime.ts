import { setPaused } from 'littlejsengine';
import type { PlatformBridge } from '../platform/PlatformBridge';

export class LifecycleRuntime {
  private paused = false;
  private attached = false;

  constructor(private readonly platform: PlatformBridge) {}

  attach(): void {
    if (this.attached) {
      return;
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.attached = true;
  }

  dispose(): void {
    if (!this.attached) {
      return;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.attached = false;
  }

  pause(): void {
    if (this.paused) {
      return;
    }

    setPaused(true);
    this.paused = true;
    this.platform.pause();
  }

  resume(): void {
    if (!this.paused) {
      return;
    }

    setPaused(false);
    this.paused = false;
    this.platform.resume();
  }

  isPaused(): boolean {
    return this.paused;
  }

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };
}
