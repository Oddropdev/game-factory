import type { MassRunnerPresentationEffect } from './MassRunnerPresentation';

export type MassRunnerSoundCue = Pick<
  MassRunnerPresentationEffect,
  'id' | 'kind' | 'intensity' | 'label'
>;

export interface MassRunnerSoundOutput {
  setEnabled(enabled: boolean): void;
  unlock(): void;
  play(cue: MassRunnerSoundCue, mass: number): void;
}

type Tone = {
  offset: number;
  frequency: number;
  endFrequency: number;
  duration: number;
  volume: number;
  wave: OscillatorType;
};

// Original synthesis: no samples, third-party sound assets or external requests.
export function massRunnerSoundPalette(
  cue: MassRunnerSoundCue,
  mass: number
): readonly Tone[] {
  const weight = Math.min(1.28, 1 + Math.max(0, mass) * 0.006);
  const layer = (
    frequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    offset = 0,
    wave: OscillatorType = 'sine'
  ): Tone => ({
    offset, frequency, endFrequency, duration,
    volume: volume * Math.min(1.1, Math.max(0.5, cue.intensity)),
    wave
  });

  switch (cue.kind) {
    case 'pickup':
      return [
        layer(680 * weight, 960 * weight, 0.105, 0.065, 0, 'triangle'),
        layer(1030 * weight, 1200 * weight, 0.065, 0.022, 0.026)
      ];
    case 'gate-positive':
      return cue.label.startsWith('×')
        ? [
            layer(180, 93, 0.21, 0.1, 0, 'triangle'),
            layer(550, 940, 0.16, 0.062, 0.018),
            layer(88, 64, 0.23, 0.065)
          ]
        : [
            layer(210, 120, 0.13, 0.085, 0, 'triangle'),
            layer(630, 830, 0.12, 0.052, 0.022)
          ];
    case 'gate-negative':
      return [
        layer(155, 80, 0.19, 0.08, 0, 'triangle'),
        layer(210, 93, 0.1, 0.027, 0, 'square')
      ];
    case 'hazard':
      return [
        layer(125, 56, 0.22, 0.11, 0, 'triangle'),
        layer(170, 67, 0.085, 0.032, 0, 'sawtooth')
      ];
    case 'level-clear':
      return [
        layer(440, 570, 0.12, 0.055),
        layer(554, 720, 0.14, 0.054, 0.085),
        layer(659, 880, 0.21, 0.065, 0.17)
      ];
    case 'level-fail':
      return [
        layer(330, 240, 0.13, 0.052),
        layer(220, 150, 0.17, 0.054, 0.09),
        layer(164, 92, 0.25, 0.065, 0.17)
      ];
    case 'complete':
      return [
        layer(105, 64, 0.33, 0.13, 0, 'triangle'),
        layer(523, 610, 0.17, 0.056, 0.045),
        layer(659, 780, 0.2, 0.057, 0.15),
        layer(784, 1046, 0.36, 0.07, 0.26)
      ];
  }
}

export class MassRunnerWebAudioOutput implements MassRunnerSoundOutput {
  private enabled = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly voices = new Set<OscillatorNode>();

  constructor(private readonly masterLevel = 0.5) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (this.master && this.context) {
      if (!enabled) {
        // Stop scheduled voices too: unmuting never resumes an old stinger.
        for (const voice of this.voices) {
          try {
            voice.stop(this.context.currentTime);
          } catch {
            // A completed oscillator may already have stopped.
          }
        }
        this.voices.clear();
      }
      // Kill output immediately on platform mute, including already scheduled tails.
      this.master.gain.setValueAtTime(
        enabled ? this.masterLevel : 0,
        this.context.currentTime
      );
      if (!enabled && this.context.state === 'running') {
        void this.context.suspend().catch(() => {});
      } else if (enabled && this.context.state !== 'running') {
        void this.context.resume().catch(() => {});
      }
    }
  }

  unlock(): void {
    if (!this.enabled || typeof AudioContext === 'undefined') {
      return;
    }

    if (!this.context) {
      try {
        const context = new AudioContext({ latencyHint: 'interactive' });
        const master = context.createGain();
        master.gain.value = this.masterLevel;
        master.connect(context.destination);
        this.context = context;
        this.master = master;
      } catch {
        // Sound is optional: unsupported/restricted audio never blocks gameplay.
        return;
      }
    }

    if (this.context.state !== 'running') {
      void this.context.resume().catch(() => {});
    }
  }

  play(cue: MassRunnerSoundCue, mass: number): void {
    if (
      !this.enabled ||
      !this.context ||
      !this.master ||
      this.context.state !== 'running'
    ) {
      return;
    }

    const context = this.context;
    const start = context.currentTime + 0.006;

    for (const tone of massRunnerSoundPalette(cue, mass)) {
      const onset = start + tone.offset;
      const end = onset + tone.duration;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = tone.wave;
      oscillator.frequency.setValueAtTime(tone.frequency, onset);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, tone.endFrequency),
        end
      );
      envelope.gain.setValueAtTime(0.0001, onset);
      envelope.gain.exponentialRampToValueAtTime(
        tone.volume,
        onset + Math.min(0.012, tone.duration * 0.2)
      );
      envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(envelope);
      envelope.connect(this.master);
      this.voices.add(oscillator);
      oscillator.onended = () => {
        this.voices.delete(oscillator);
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(onset);
      oscillator.stop(end + 0.012);
    }
  }
}

// Game-local cue router; mute, gesture-gate and cue identity are unit-testable
// without constructing a browser AudioContext.
export class MassRunnerAudio {
  private enabled = false;
  private unlocked = false;
  private lastEffectId = 0;
  private dispatched = 0;

  constructor(
    private readonly output: MassRunnerSoundOutput =
      new MassRunnerWebAudioOutput()
  ) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.output.setEnabled(enabled);
  }

  unlockFromGesture(): void {
    this.unlocked = true;
    if (this.enabled) {
      this.output.unlock();
    }
  }

  reset(): void {
    this.lastEffectId = 0;
  }

  consume(
    effects: readonly MassRunnerPresentationEffect[],
    mass: number
  ): void {
    for (const effect of effects) {
      if (effect.id <= this.lastEffectId) {
        continue;
      }

      // Advance even when muted: re-enabling must not replay old cues.
      this.lastEffectId = effect.id;

      if (this.enabled && this.unlocked) {
        this.output.play(effect, mass);
        this.dispatched += 1;
      }
    }
  }

  snapshot(): {
    enabled: boolean;
    unlocked: boolean;
    dispatched: number;
  } {
    return {
      enabled: this.enabled,
      unlocked: this.unlocked,
      dispatched: this.dispatched
    };
  }
}
