import {
  drawCircle,
  drawEllipse,
  drawRect,
  drawText,
  drawTextScreen,
  rgb,
  vec2
} from 'littlejsengine';
import type {
  FoundationGameState,
  GameInputFrame,
  GameModule
} from '../../factory/GameModule';
import type { ViewportRuntime } from '../../runtime/ViewportRuntime';
import {
  applyMassOperation,
  MASS_RUNNER_LEVELS,
  massRunnerLevelSignature,
  type MassOperation,
  type MassRunnerEvent,
  type MassRunnerGateEvent,
  type MassRunnerLevelSpec
} from './MassRunnerLevels';
import { MassRunnerAudio, MassRunnerWebAudioOutput } from './MassRunnerAudio';
import { MassRunner3DRenderer } from './MassRunner3DRenderer';
import { resolveMassRunnerExperiment, type MassRunnerExperiment } from './MassRunnerExperiment';
import { massRunnerLevelAccent } from './MassRunnerLevelVisuals';
import { massRunnerHeroTarget } from './MassRunnerFeelRoute';
import {
  MassRunnerModel,
  type MassRunnerSnapshot
} from './MassRunnerModel';
import {
  MassRunnerPresentation,
  resolveMassRunnerPresentationMode,
  type MassRunnerPresentationSnapshot
} from './MassRunnerPresentation';

const TRACK_WIDTH = 8;

export type MassRunnerGameTestState = MassRunnerSnapshot & {
  ready: boolean;
  pointerEvents: number;
  restartCount: number;
  targetNormX: number;
  levelSignature: string;
  playerRenderY: number;
  visibleHalfHeight: number;
  presentationMode: 'baseline' | 'polished';
  presentationCue: string | null;
  presentationEffects: number;
  presentationMassPulse: number;
  heroAutoplay: boolean;
  soundEnabled: boolean;
  soundUnlocked: boolean;
  soundCuesDispatched: number;
  experiment: MassRunnerExperiment;
  webgl3d: boolean;
};

type Layout = {
  playerY: number;
  eventDistanceScale: number;
  visibleHalfHeight: number;
  trackHeight: number;
};

function unitHash(seed: number, index: number, salt = 0): number {
  const value = Math.sin(
    seed * 0.000013 +
    index * 12.9898 +
    salt * 78.233
  ) * 43758.5453;

  return value - Math.floor(value);
}

export class MassRunnerGame implements GameModule {
  private readonly model = new MassRunnerModel(
    MASS_RUNNER_LEVELS
  );
  private readonly presentationMode =
    resolveMassRunnerPresentationMode(
      typeof window === 'undefined'
        ? ''
        : window.location.search
    );
  private readonly presentation =
    new MassRunnerPresentation(this.presentationMode);
  private readonly experiment = resolveMassRunnerExperiment(
    typeof window === 'undefined' ? '' : window.location.search
  );
  private readonly audio = new MassRunnerAudio(
    new MassRunnerWebAudioOutput(this.experiment === 'a' ? 0.5 : 0.9)
  );
  private renderer3d: MassRunner3DRenderer | null = null;
  private readonly audioOff =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('audio') === 'off';
  private readonly heroAutoplay =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autoplay') ===
      'hero';
  private targetNormX = 0.5;
  private pointerEvents = 0;
  private restartCount = 0;
  private ready = false;

  constructor(private readonly viewport: ViewportRuntime) {}

  setAudioEnabled(enabled: boolean): void {
    this.audio.setEnabled(
      enabled && !this.audioOff && this.presentationMode === 'polished'
    );
  }

  init(): void {
    this.model.resetSession();
    this.targetNormX = 0.5;
    this.pointerEvents = 0;
    this.presentation.reset(this.model.snapshot());
    this.audio.reset();
    if (this.experiment === 'c' && this.presentationMode === 'polished' && !this.renderer3d) {
      this.renderer3d = new MassRunner3DRenderer();
    }
    this.ready = true;
  }

  update(input: GameInputFrame): void {
    if (input.pointerPressed) {
      this.pointerEvents += 1;
      this.audio.unlockFromGesture();
    }

    if (
      input.pointerPressed &&
      this.model.snapshot().phase !== 'running'
    ) {
      this.model.startOrAdvance();
    }

    const snapshot = this.model.snapshot();

    if (this.heroAutoplay && snapshot.phase === 'running') {
      this.targetNormX = massRunnerHeroTarget(
        snapshot,
        this.model.getCurrentLevel()
      );
    } else if (input.pointerPressed || input.pointerDown) {
      this.targetNormX = this.viewport.worldXToNormalized(
        input.pointerWorldX
      );
    }

    this.model.step(
      this.targetNormX,
      this.experiment === 'a' ? 'original' : 'fluid'
    );
    const updated = this.model.snapshot();
    this.presentation.update(
      updated,
      this.model.getCurrentLevel(),
      this.targetNormX
    );
    this.audio.consume(this.presentation.snapshot(updated).effects, updated.mass);
  }

  restart(): void {
    this.restartCount += 1;
    this.pointerEvents = 0;
    this.targetNormX = 0.5;
    this.model.resetSession();
    this.presentation.reset(this.model.snapshot());
    this.audio.reset();
  }

  render(): void {
    const snapshot = this.model.snapshot();
    const level = this.model.getCurrentLevel();
    const layout = this.layout();

    if (this.presentationMode === 'baseline') {
      this.renderBaseline(snapshot, level, layout);
      return;
    }

    this.renderPolished(
      snapshot,
      level,
      layout,
      this.presentation.snapshot(snapshot)
    );
    this.renderer3d?.render(snapshot, level);
  }

  renderHud(): void {
    const snapshot = this.model.snapshot();

    if (this.presentationMode === 'baseline') {
      this.renderBaselineHud(snapshot);
      return;
    }

    this.renderPolishedHud(
      snapshot,
      this.presentation.snapshot(snapshot)
    );
    this.renderer3d?.renderHud(snapshot, this.model.getCurrentLevel());
  }

  foundationState(): FoundationGameState {
    return {
      pointerEvents: this.pointerEvents,
      pointerNormX: this.targetNormX,
      restartCount: this.restartCount
    };
  }

  testState(): MassRunnerGameTestState {
    const layout = this.layout();
    const presentation = this.presentation.snapshot(
      this.model.snapshot()
    );

    return {
      ...this.model.snapshot(),
      ready: this.ready,
      pointerEvents: this.pointerEvents,
      restartCount: this.restartCount,
      targetNormX: this.targetNormX,
      levelSignature: massRunnerLevelSignature(),
      playerRenderY: layout.playerY,
      visibleHalfHeight: layout.visibleHalfHeight,
      presentationMode: presentation.mode,
      presentationCue: presentation.lastCue,
      presentationEffects: presentation.effects.length,
      presentationMassPulse: presentation.massPulse,
      heroAutoplay: this.heroAutoplay,
      soundEnabled: this.audio.snapshot().enabled,
      soundUnlocked: this.audio.snapshot().unlocked,
      soundCuesDispatched: this.audio.snapshot().dispatched,
      experiment: this.experiment,
      webgl3d: this.renderer3d?.supported === true
    };
  }

  private renderBaseline(
    snapshot: MassRunnerSnapshot,
    level: MassRunnerLevelSpec,
    layout: Layout
  ): void {
    drawRect(
      vec2(0, 0),
      vec2(10, layout.trackHeight),
      rgb(0.035, 0.055, 0.09)
    );

    drawRect(
      vec2(0, 0),
      vec2(TRACK_WIDTH, layout.trackHeight),
      rgb(0.08, 0.11, 0.17)
    );

    for (const x of [-4.08, -1.33, 1.33, 4.08]) {
      drawRect(
        vec2(x, 0),
        vec2(
          x === -4.08 || x === 4.08 ? 0.12 : 0.04,
          layout.trackHeight
        ),
        x === -4.08 || x === 4.08
          ? rgb(0.28, 0.35, 0.48)
          : rgb(0.15, 0.2, 0.3)
      );
    }

    if (snapshot.phase !== 'ready') {
      for (const event of level.events) {
        this.renderBaselineEvent(
          event,
          snapshot,
          layout.playerY,
          layout.eventDistanceScale,
          layout.visibleHalfHeight
        );
      }

      this.renderFinish(
        snapshot,
        level,
        layout,
        0,
        0
      );
    }

    const playerX = this.viewport.normalizedXToWorld(
      snapshot.playerNormX
    );
    const pulse =
      1 + Math.sin(snapshot.distance * 0.22) * 0.035;
    const radius =
      Math.min(1.18, 0.46 + snapshot.mass * 0.025) * pulse;

    drawCircle(
      vec2(playerX, layout.playerY),
      radius,
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.3, 0.92, 0.55)
        : rgb(0.25, 0.68, 1)
    );
    drawCircle(
      vec2(
        playerX - radius * 0.22,
        layout.playerY + radius * 0.18
      ),
      radius * 0.11,
      rgb(0.95, 0.98, 1)
    );
  }

  private renderPolished(
    snapshot: MassRunnerSnapshot,
    level: MassRunnerLevelSpec,
    layout: Layout,
    presentation: MassRunnerPresentationSnapshot
  ): void {
    const shakeX = presentation.shakeX;
    const shakeY = presentation.shakeY;
    const [accentR, accentG, accentB] = massRunnerLevelAccent(
      snapshot.levelIndex
    );

    drawRect(
      vec2(0, 0),
      vec2(10, layout.trackHeight),
      rgb(0.025, 0.04, 0.075)
    );
    drawRect(
      vec2(shakeX, shakeY),
      vec2(9.35, layout.trackHeight),
      rgb(0.075, 0.105, 0.17)
    );
    drawRect(
      vec2(shakeX, shakeY),
      vec2(TRACK_WIDTH, layout.trackHeight),
      rgb(0.105, 0.14, 0.22)
    );

    for (const x of [-4.08, -1.33, 1.33, 4.08]) {
      drawRect(
        vec2(x + shakeX, shakeY),
        vec2(
          x === -4.08 || x === 4.08 ? 0.16 : 0.045,
          layout.trackHeight
        ),
        x === -4.08 || x === 4.08
          ? rgb(accentR, accentG, accentB, 0.9)
          : rgb(accentR * 0.46, accentG * 0.46, accentB * 0.46, 0.65)
      );
    }

    if (snapshot.phase === 'running') {
      for (let index = 0; index < 12; index += 1) {
        const travel =
          (snapshot.distance * 0.13 + index * 2.37) %
          layout.trackHeight;
        const y =
          -layout.visibleHalfHeight +
          travel;
        const x =
          (index % 2 === 0 ? -1 : 1) *
          (2.35 + unitHash(991, index) * 1.25);

        drawRect(
          vec2(x + shakeX, y + shakeY),
          vec2(0.045, 0.65 + unitHash(447, index) * 0.85),
          rgb(accentR, accentG, accentB, 0.16 + presentation.trailStrength * 0.12)
        );
      }
    }

    if (snapshot.phase !== 'ready') {
      for (const event of level.events) {
        this.renderPolishedEvent(
          event,
          snapshot,
          layout,
          presentation
        );
      }

      this.renderFinish(
        snapshot,
        level,
        layout,
        shakeX,
        shakeY
      );
    }

    const playerX =
      this.viewport.normalizedXToWorld(snapshot.playerNormX) +
      shakeX;
    const playerY = layout.playerY + shakeY;
    const radius =
      Math.min(1.25, 0.46 + snapshot.mass * 0.025);
    const bodyColor =
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.24, 0.94, 0.58)
        : rgb(0.18, 0.64, 1);

    drawEllipse(
      vec2(playerX, playerY - radius * 0.86),
      vec2(
        radius * 2.2 * presentation.shadowScale,
        radius * 0.62
      ),
      rgb(0.01, 0.02, 0.04, 0.36)
    );

    for (let index = 3; index >= 1; index -= 1) {
      const alpha =
        presentation.trailStrength *
        (0.11 - index * 0.018);
      const offsetX =
        -presentation.lean * index * 0.22;
      const offsetY =
        -index * (0.28 + presentation.trailStrength * 0.12);

      drawEllipse(
        vec2(
          playerX + offsetX,
          playerY + offsetY
        ),
        vec2(
          radius * 1.5,
          radius * 1.28
        ),
        rgb(0.2, 0.68, 1, Math.max(0, alpha))
      );
    }

    drawEllipse(
      vec2(playerX, playerY),
      vec2(
        radius * 2 * presentation.scaleX,
        radius * 2 * presentation.scaleY
      ),
      bodyColor,
      presentation.lean * -0.22,
      0.06,
      rgb(0.04, 0.12, 0.2, 0.75)
    );

    drawEllipse(
      vec2(
        playerX - radius * 0.26,
        playerY + radius * 0.28
      ),
      vec2(radius * 0.42, radius * 0.25),
      rgb(0.95, 0.99, 1, 0.92),
      presentation.lean * -0.16
    );

    drawCircle(
      vec2(
        playerX + radius * 0.28,
        playerY + radius * 0.08
      ),
      radius * 0.065,
      rgb(0.02, 0.08, 0.14)
    );

    this.renderPresentationEffects(
      presentation,
      playerX,
      playerY,
      radius
    );

    if (presentation.positiveFlash > 0.02) {
      drawRect(
        vec2(0, 0),
        vec2(10, this.viewport.visibleWorldHeight()),
        rgb(0.15, 1, 0.62, presentation.positiveFlash * 0.08)
      );
    }

    if (presentation.negativeFlash > 0.02) {
      drawRect(
        vec2(0, 0),
        vec2(10, this.viewport.visibleWorldHeight()),
        rgb(1, 0.16, 0.2, presentation.negativeFlash * 0.1)
      );
    }
  }

  private renderPresentationEffects(
    presentation: MassRunnerPresentationSnapshot,
    playerX: number,
    playerY: number,
    radius: number
  ): void {
    for (const effect of presentation.effects) {
      const progress = effect.age / effect.duration;
      const alpha = Math.max(0, 1 - progress);
      const positive =
        effect.kind === 'pickup' ||
        effect.kind === 'gate-positive' ||
        effect.kind === 'level-clear' ||
        effect.kind === 'complete';
      const color = positive
        ? rgb(0.3, 1, 0.62, alpha)
        : rgb(1, 0.28, 0.32, alpha);

      if (
        effect.kind === 'level-clear' ||
        effect.kind === 'complete'
      ) {
        const count =
          effect.kind === 'complete' ? 18 : 12;

        for (let index = 0; index < count; index += 1) {
          const direction =
            unitHash(effect.seed, index, 1) * Math.PI * 2;
          const speed =
            0.8 + unitHash(effect.seed, index, 2) * 2.3;
          const spread =
            progress * speed * effect.intensity;
          const x =
            playerX + Math.cos(direction) * spread;
          const y =
            playerY +
            Math.sin(direction) * spread +
            progress * 0.7;

          drawRect(
            vec2(x, y),
            vec2(
              0.08 + unitHash(effect.seed, index, 3) * 0.13,
              0.18 + unitHash(effect.seed, index, 4) * 0.22
            ),
            index % 2 === 0
              ? rgb(1, 0.74, 0.16, alpha)
              : color,
            direction
          );
        }
      } else {
        const count =
          effect.kind === 'hazard' ? 8 : 10;

        for (let index = 0; index < count; index += 1) {
          const direction =
            unitHash(effect.seed, index, 5) * Math.PI * 2;
          const spread =
            progress *
            (0.45 + unitHash(effect.seed, index, 6) * 1.2) *
            effect.intensity;

          drawCircle(
            vec2(
              playerX + Math.cos(direction) * spread,
              playerY + Math.sin(direction) * spread
            ),
            Math.max(0.035, 0.12 * alpha),
            color
          );
        }
      }

      if (effect.age < effect.duration * 0.72) {
        drawText(
          effect.label,
          vec2(
            playerX,
            playerY + radius + 0.75 + progress * 1.05
          ),
          0.48 + effect.intensity * 0.12,
          color,
          0.045,
          rgb(0.02, 0.04, 0.08, alpha)
        );
      }
    }
  }

  private renderPolishedEvent(
    event: MassRunnerEvent,
    snapshot: MassRunnerSnapshot,
    layout: Layout,
    presentation: MassRunnerPresentationSnapshot
  ): void {
    if (event.distance <= snapshot.distance) {
      return;
    }

    const y =
      layout.playerY +
      (event.distance - snapshot.distance) *
        layout.eventDistanceScale +
      presentation.shakeY;

    if (
      y < -layout.visibleHalfHeight - 1 ||
      y > layout.visibleHalfHeight + 1
    ) {
      return;
    }

    if (event.kind === 'gate') {
      const leftMass = applyMassOperation(
        snapshot.mass,
        event.left
      );
      const rightMass = applyMassOperation(
        snapshot.mass,
        event.right
      );
      const leftBetter = leftMass >= rightMass;
      const leftColor = leftBetter
        ? rgb(0.16, 0.9, 0.5, 0.92)
        : rgb(0.94, 0.24, 0.3, 0.92);
      const rightColor = leftBetter
        ? rgb(0.94, 0.24, 0.3, 0.92)
        : rgb(0.16, 0.9, 0.5, 0.92);

      drawRect(
        vec2(-2.05 + presentation.shakeX, y),
        vec2(3.75, 0.64),
        leftColor
      );
      drawRect(
        vec2(2.05 + presentation.shakeX, y),
        vec2(3.75, 0.64),
        rightColor
      );

      drawText(
        this.operationLabel(event.left, snapshot.mass),
        vec2(-2.05 + presentation.shakeX, y + 0.02),
        0.48,
        rgb(1, 1, 1),
        0.04,
        rgb(0.03, 0.05, 0.08, 0.75)
      );
      drawText(
        this.operationLabel(event.right, snapshot.mass),
        vec2(2.05 + presentation.shakeX, y + 0.02),
        0.48,
        rgb(1, 1, 1),
        0.04,
        rgb(0.03, 0.05, 0.08, 0.75)
      );
      return;
    }

    const x =
      this.viewport.normalizedXToWorld(event.x) +
      presentation.shakeX;

    if (event.kind === 'orb') {
      const pulse =
        1 + Math.sin(presentation.tick * 0.18 + event.distance) * 0.08;
      const radius =
        (0.31 + event.amount * 0.045) * pulse;

      drawCircle(
        vec2(x, y),
        radius * 1.65,
        rgb(1, 0.74, 0.16, 0.12)
      );
      drawCircle(
        vec2(x, y),
        radius,
        rgb(1, 0.74, 0.16)
      );
      drawCircle(
        vec2(x - radius * 0.2, y + radius * 0.2),
        radius * 0.22,
        rgb(1, 0.96, 0.72)
      );
      return;
    }

    drawRect(
      vec2(x, y),
      vec2(
        Math.max(0.72, event.width * 10),
        0.78
      ),
      rgb(0.95, 0.18, 0.27)
    );
    drawRect(
      vec2(x, y + 0.18),
      vec2(
        Math.max(0.55, event.width * 8.2),
        0.12
      ),
      rgb(1, 0.48, 0.42, 0.92)
    );
  }

  private renderBaselineEvent(
    event: MassRunnerEvent,
    snapshot: MassRunnerSnapshot,
    playerY: number,
    eventDistanceScale: number,
    visibleHalfHeight: number
  ): void {
    if (event.distance <= snapshot.distance) {
      return;
    }

    const y =
      playerY +
      (event.distance - snapshot.distance) *
        eventDistanceScale;

    if (
      y < -visibleHalfHeight - 1 ||
      y > visibleHalfHeight + 1
    ) {
      return;
    }

    if (event.kind === 'gate') {
      const leftMass = applyMassOperation(
        snapshot.mass,
        event.left
      );
      const rightMass = applyMassOperation(
        snapshot.mass,
        event.right
      );
      const leftBetter = leftMass >= rightMass;

      drawRect(
        vec2(-2.05, y),
        vec2(3.8, 0.48),
        leftBetter
          ? rgb(0.2, 0.82, 0.46)
          : rgb(0.9, 0.24, 0.28)
      );
      drawRect(
        vec2(2.05, y),
        vec2(3.8, 0.48),
        leftBetter
          ? rgb(0.9, 0.24, 0.28)
          : rgb(0.2, 0.82, 0.46)
      );
      return;
    }

    const x = this.viewport.normalizedXToWorld(event.x);

    if (event.kind === 'orb') {
      drawCircle(
        vec2(x, y),
        0.34 + event.amount * 0.04,
        rgb(1, 0.74, 0.16)
      );
      return;
    }

    drawRect(
      vec2(x, y),
      vec2(Math.max(0.7, event.width * 10), 0.72),
      rgb(0.95, 0.25, 0.3)
    );
  }

  private renderFinish(
    snapshot: MassRunnerSnapshot,
    level: MassRunnerLevelSpec,
    layout: Layout,
    offsetX: number,
    offsetY: number
  ): void {
    const finishY =
      layout.playerY +
      (level.finishDistance - snapshot.distance) *
        layout.eventDistanceScale +
      offsetY;

    if (
      finishY > -layout.visibleHalfHeight - 1 &&
      finishY < layout.visibleHalfHeight + 1
    ) {
      drawRect(
        vec2(offsetX, finishY),
        vec2(TRACK_WIDTH, 0.2),
        rgb(0.92, 0.96, 1)
      );
    }
  }

  private renderBaselineHud(
    snapshot: MassRunnerSnapshot
  ): void {
    drawTextScreen(
      'MASS RUNNER',
      vec2(110, 28),
      24,
      rgb(1, 1, 1)
    );
    drawTextScreen(
      `LEVEL ${snapshot.levelNumber}/${snapshot.totalLevels}  ${snapshot.levelName}`,
      vec2(150, 56),
      16,
      rgb(0.72, 0.82, 0.96)
    );
    drawTextScreen(
      `MASS ${snapshot.mass} / ${snapshot.targetMass}`,
      vec2(88, 84),
      20,
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.35, 0.95, 0.58)
        : rgb(0.98, 0.78, 0.25)
    );
    drawTextScreen(
      `SCORE ${snapshot.totalScore}`,
      vec2(72, 110),
      16,
      rgb(0.9, 0.94, 1)
    );

    this.renderPhaseHud(snapshot, 0, false);
  }

  private renderPolishedHud(
    snapshot: MassRunnerSnapshot,
    presentation: MassRunnerPresentationSnapshot
  ): void {
    drawTextScreen(
      'MASS RUNNER',
      vec2(110, 28),
      24,
      rgb(0.96, 0.98, 1)
    );
    const [accentR, accentG, accentB] = massRunnerLevelAccent(
      snapshot.levelIndex
    );
    const accent = rgb(accentR, accentG, accentB);
    drawTextScreen(
      `LEVEL ${snapshot.levelNumber}/${snapshot.totalLevels} · ${snapshot.levelName}`,
      vec2(155, 56),
      15,
      accent
    );
    drawTextScreen(
      `${Math.round(snapshot.progress * 100)}%`,
      vec2(this.viewport.snapshot().width - 45, 28),
      16,
      accent
    );

    const massColor =
      snapshot.mass >= snapshot.targetMass
        ? rgb(0.32, 0.98, 0.58)
        : rgb(1, 0.78, 0.22);

    drawTextScreen(
      `${snapshot.mass}`,
      vec2(50, 91),
      28 + presentation.hudPulse * 8,
      massColor
    );
    drawTextScreen(
      `/ ${snapshot.targetMass} MASS`,
      vec2(123, 91),
      16,
      rgb(0.86, 0.91, 1)
    );
    drawTextScreen(
      `SCORE ${snapshot.totalScore}`,
      vec2(72, 122),
      15,
      rgb(0.8, 0.87, 0.98)
    );

    this.renderPhaseHud(
      snapshot,
      presentation.tick,
      true
    );
  }

  private renderPhaseHud(
    snapshot: MassRunnerSnapshot,
    tick: number,
    polished: boolean
  ): void {
    const centerX = polished
      ? this.viewport.snapshot().width * 0.5
      : 195;
    if (snapshot.phase === 'ready') {
      drawTextScreen(
        'TAP TO RUN',
        vec2(centerX, 166),
        polished
          ? 34 + Math.sin(tick * 0.12) * 2
          : 32,
        rgb(1, 0.88, 0.32)
      );
      if (polished) {
        drawTextScreen(
          'GET BIG · PICK THE BETTER GATE',
          vec2(centerX, 198),
          14,
          rgb(0.74, 0.82, 0.94)
        );
      }
      return;
    }

    if (snapshot.phase === 'level-clear') {
      drawTextScreen(
        'LEVEL CLEAR',
        vec2(centerX, 160),
        polished ? 36 : 32,
        rgb(0.35, 0.95, 0.58)
      );
      drawTextScreen(
        'TAP FOR NEXT',
        vec2(centerX, 192),
        18,
        rgb(0.9, 0.95, 1)
      );
      return;
    }

    if (snapshot.phase === 'level-fail') {
      drawTextScreen(
        'NOT ENOUGH MASS',
        vec2(centerX, 160),
        polished ? 30 : 28,
        rgb(0.98, 0.36, 0.35)
      );
      drawTextScreen(
        'TAP TO RETRY',
        vec2(centerX, 192),
        18,
        rgb(0.9, 0.95, 1)
      );
      return;
    }

    if (snapshot.phase === 'complete') {
      drawTextScreen(
        'MASSIVE!',
        vec2(centerX, 160),
        polished ? 44 : 38,
        rgb(0.35, 0.95, 0.58)
      );
      drawTextScreen(
        `FINAL SCORE ${snapshot.totalScore}`,
        vec2(centerX, 198),
        20,
        rgb(1, 0.88, 0.32)
      );
      drawTextScreen(
        'TAP TO RUN AGAIN',
        vec2(centerX, 226),
        16,
        rgb(0.9, 0.95, 1)
      );
      return;
    }

    const nextGate = this.nextGate(snapshot);

    if (nextGate) {
      const left = this.operationLabel(
        nextGate.left,
        snapshot.mass
      );
      const right = this.operationLabel(
        nextGate.right,
        snapshot.mass
      );

      drawTextScreen(
        `NEXT  ${left}  |  ${right}`,
        vec2(centerX, 154),
        polished ? 19 : 18,
        rgb(0.88, 0.92, 1)
      );
    }
  }

  private layout(): Layout {
    const visibleWorldHeight =
      this.viewport.visibleWorldHeight();
    const visibleHalfHeight = visibleWorldHeight * 0.5;

    return {
      playerY: Math.max(
        -4.2,
        -visibleHalfHeight * 0.7
      ),
      eventDistanceScale: Math.min(
        0.13,
        visibleWorldHeight / 52
      ),
      visibleHalfHeight,
      trackHeight: Math.max(
        12,
        visibleWorldHeight * 1.05
      )
    };
  }

  private nextGate(
    snapshot: MassRunnerSnapshot
  ): MassRunnerGateEvent | undefined {
    return this.model
      .getCurrentLevel()
      .events.find(
        (event): event is MassRunnerGateEvent =>
          event.kind === 'gate' &&
          event.distance > snapshot.distance
      );
  }

  private operationLabel(
    operation: MassOperation,
    mass: number
  ): string {
    const next = applyMassOperation(mass, operation);
    const delta = next - mass;

    if (operation.op === 'multiply') {
      return `×${operation.value}`;
    }

    return delta >= 0 ? `+${delta}` : `${delta}`;
  }
}
