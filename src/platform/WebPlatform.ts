import type { PlatformBridge } from './PlatformBridge';

export class WebPlatform implements PlatformBridge {
  private initialized = false;

  init(): void {
    this.initialized = true;
  }

  ready(): void {
    if (!this.initialized) {
      throw new Error('WebPlatform.ready() called before init()');
    }
  }

  pause(): void {}

  resume(): void {}
}
