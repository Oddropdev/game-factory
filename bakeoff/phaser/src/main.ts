import Phaser from 'phaser';
import { SeededRng } from './SeededRng';

const SEED = 0x5eed1234;
const PLAYER_SIZE = 48;
const TARGET_SIZE = 42;

type BakeoffState = {
  engine: 'phaser';
  ready: boolean;
  paused: boolean;
  score: number;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
};

declare global {
  interface Window {
    __BAKEOFF__: {
      engine: 'phaser';
      getState(): BakeoffState;
      restart(): void;
      pause(): void;
      resume(): void;
    };
  }
}

let pausedState = false;

class BakeoffScene extends Phaser.Scene {
  private rng = new SeededRng(SEED);
  private player!: Phaser.GameObjects.Rectangle;
  private target!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private pointerEvents = 0;
  private restartCount = 0;
  private targetNormX = 0.5;
  private ready = false;

  constructor() {
    super('BakeoffScene');
  }

  init(data?: { restartCount?: number }): void {
    this.restartCount = data?.restartCount ?? 0;
    this.ready = false;
  }

  create(): void {
    this.player = this.add.rectangle(0, 0, PLAYER_SIZE, PLAYER_SIZE, 0x38bdf8);
    this.target = this.add.rectangle(0, 0, TARGET_SIZE, TARGET_SIZE, 0xfbbf24);
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff'
    });

    this.input.on('pointerdown', this.handlePointer, this);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.handlePointer(pointer);
    });
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    this.resetFoundation();
    this.ready = true;
  }

  private resetFoundation(): void {
    this.rng = new SeededRng(SEED);
    this.score = 0;
    this.pointerEvents = 0;
    this.targetNormX = this.rng.range(0.15, 0.85);
    this.scoreText?.setText('Score: 0');
    this.layout();
  }

  private layout(): void {
    if (!this.player || !this.target) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.player.y = height * 0.5;
    this.target.y = height * 0.5;
    this.player.x = width * 0.5;
    this.target.x = width * this.targetNormX;
  }

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    this.pointerEvents += 1;
    const half = PLAYER_SIZE * 0.5;
    this.player.x = Phaser.Math.Clamp(pointer.x, half, this.scale.width - half);
    this.checkCollection();
  }

  private checkCollection(): void {
    if (!Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.target.getBounds())) {
      return;
    }
    this.score += 1;
    this.targetNormX = this.rng.range(0.15, 0.85);
    this.target.x = this.scale.width * this.targetNormX;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  getBakeoffState(): BakeoffState {
    return {
      engine: 'phaser',
      ready: this.ready,
      paused: pausedState,
      score: this.score,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      targetNormX: this.targetNormX
    };
  }

  restartFoundation(): void {
    this.scene.restart({ restartCount: this.restartCount + 1 });
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  input: {
    activePointers: 2
  },
  scene: [BakeoffScene]
});

function scene(): BakeoffScene {
  return game.scene.getScene('BakeoffScene') as BakeoffScene;
}

window.__BAKEOFF__ = {
  engine: 'phaser',
  getState: () => scene().getBakeoffState(),
  restart: () => scene().restartFoundation(),
  pause: () => {
    pausedState = true;
    game.pause();
  },
  resume: () => {
    game.resume();
    pausedState = false;
  }
};
