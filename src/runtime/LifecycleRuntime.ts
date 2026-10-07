import { setPaused } from 'littlejsengine';
import type {
  PlatformBridge,
  PlatformLifecycleHandlers
} from '../platform/PlatformBridge';

export class LifecycleRuntime {
  private paused = false;
  private attached = false;
  private detachLifecycle: (() => void) | null = null;

  constructor(private readonly platform: PlatformBridge) {}

  attach(): void {
    if (this.attached) {
      return;
    }

    const handlers: PlatformLifecycleHandlers = {
      pause: () => this.pause(),
      resume: () => this.resume()
    };

    this.detachLifecycle = this.platform.bindLifecycle(handlers);
    this.attached = true;
  }

  dispose(): void {
    if (!this.attached) {
      return;
    }

    this.detachLifecycle?.();
    this.detachLifecycle = null;
    this.attached = false;
  }

  pause(): void {
    if (this.paused) {
      return;
    }

    setPaused(true);
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) {
      return;
    }

    setPaused(false);
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }
}
