import { describe, expect, it } from 'vitest';
import {
  MassRunnerAudio,
  massRunnerSoundPalette,
  type MassRunnerSoundCue,
  type MassRunnerSoundOutput
} from '../../src/games/mass-runner/MassRunnerAudio';
import type { MassRunnerPresentationEffect } from '../../src/games/mass-runner/MassRunnerPresentation';

const effect = (
  id: number,
  kind: MassRunnerSoundCue['kind'] = 'pickup',
  label = '+2'
): MassRunnerPresentationEffect => ({
  id, kind, label, age: 0, duration: 30, intensity: 1, seed: 12
});

class SpyOutput implements MassRunnerSoundOutput {
  enabled = false;
  unlocks = 0;
  plays: string[] = [];

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  unlock(): void {
    this.unlocks += 1;
  }

  play(cue: MassRunnerSoundCue, mass: number): void {
    if (!this.enabled) {
      throw new Error('muted output received a sound');
    }
    this.plays.push(`${cue.id}:${cue.kind}:${mass}`);
  }
}

describe('W8.2 MassRunnerAudio', () => {
  it('requires platform permission and a gesture before dispatching', () => {
    const output = new SpyOutput();
    const audio = new MassRunnerAudio(output);
    audio.consume([effect(1)], 8);
    audio.setEnabled(true);
    audio.consume([effect(1), effect(2)], 9);
    expect(output.plays).toEqual([]);

    audio.unlockFromGesture();
    audio.consume([effect(1), effect(2), effect(3)], 10);
    expect(output.plays).toEqual(['3:pickup:10']);
    expect(audio.snapshot().dispatched).toBe(1);
  });

  it('mutes immediately and never replays cues missed while muted', () => {
    const output = new SpyOutput();
    const audio = new MassRunnerAudio(output);
    audio.setEnabled(true);
    audio.unlockFromGesture();
    audio.consume([effect(1)], 4);
    audio.setEnabled(false);
    audio.consume([effect(1), effect(2), effect(3)], 7);
    audio.setEnabled(true);
    audio.consume([effect(1), effect(2), effect(3), effect(4)], 9);
    expect(output.plays).toEqual([
      '1:pickup:4', '4:pickup:9'
    ]);
  });

  it('delivers simultaneous semantic cues once and in order', () => {
    const output = new SpyOutput();
    const audio = new MassRunnerAudio(output);
    audio.setEnabled(true);
    audio.unlockFromGesture();
    const cues = [effect(1), effect(2, 'gate-positive', '×2')];
    audio.consume(cues, 15);
    audio.consume(cues, 15);
    expect(output.plays).toEqual([
      '1:pickup:15', '2:gate-positive:15'
    ]);
  });

  it('resets cue identity for retry without bypassing mute', () => {
    const output = new SpyOutput();
    const audio = new MassRunnerAudio(output);
    audio.setEnabled(true);
    audio.unlockFromGesture();
    audio.consume([effect(1)], 8);
    audio.reset();
    audio.consume([effect(1)], 9);
    expect(output.plays).toEqual([
      '1:pickup:8', '1:pickup:9'
    ]);
    audio.setEnabled(false);
    audio.reset();
    audio.consume([effect(1)], 9);
    expect(output.plays).toHaveLength(2);
  });

  it('uses distinct pitch mapping for mass and a layered multiplier hit', () => {
    const light = massRunnerSoundPalette(effect(1), 4);
    const heavy = massRunnerSoundPalette(effect(1), 40);
    expect(heavy[0]?.frequency).toBeGreaterThan(light[0]?.frequency);

    const plain = massRunnerSoundPalette(effect(2, 'gate-positive', '+4'), 8);
    const multiplier = massRunnerSoundPalette(effect(2, 'gate-positive', '×2'), 8);
    expect(multiplier.length).toBeGreaterThan(plain.length);
    expect(massRunnerSoundPalette(effect(3, 'complete'), 35).length)
      .toBeGreaterThan(2);
  });

  it('keeps all generated layers bounded and positive', () => {
    const kinds: MassRunnerSoundCue['kind'][] = [
      'pickup', 'gate-positive', 'gate-negative', 'hazard',
      'level-clear', 'level-fail', 'complete'
    ];
    for (const kind of kinds) {
      const layers = massRunnerSoundPalette(effect(1, kind), 99);
      expect(layers.length).toBeGreaterThan(0);
      for (const layer of layers) {
        expect(layer.frequency).toBeGreaterThan(0);
        expect(layer.endFrequency).toBeGreaterThan(0);
        expect(layer.duration).toBeGreaterThan(0);
        expect(layer.duration).toBeLessThan(0.5);
        expect(layer.volume).toBeGreaterThan(0);
        expect(layer.volume).toBeLessThan(0.2);
      }
    }
  });
});
