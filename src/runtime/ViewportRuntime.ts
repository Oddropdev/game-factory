import { mainCanvasSize, setCameraPos, setCameraScale, vec2 } from 'littlejsengine';

export type ViewportSnapshot = {
  width: number;
  height: number;
  worldWidth: number;
};

export class ViewportRuntime {
  private width = 0;
  private height = 0;

  constructor(private readonly worldWidth = 10) {}

  sync(): boolean {
    const width = Math.max(1, mainCanvasSize.x || window.innerWidth);
    const height = Math.max(1, mainCanvasSize.y || window.innerHeight);

    if (width === this.width && height === this.height) {
      return false;
    }

    this.width = width;
    this.height = height;

    setCameraPos(vec2(0, 0));
    setCameraScale(width / this.worldWidth);
    return true;
  }

  normalizedXToWorld(normalizedX: number): number {
    return (normalizedX - 0.5) * this.worldWidth;
  }

  worldXToNormalized(worldX: number): number {
    return Math.min(1, Math.max(0, worldX / this.worldWidth + 0.5));
  }

  snapshot(): ViewportSnapshot {
    return {
      width: this.width,
      height: this.height,
      worldWidth: this.worldWidth
    };
  }
}
