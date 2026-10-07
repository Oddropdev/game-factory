import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/SeededRng';

describe('SeededRng', () => {
  it('replays the same sequence after reset', () => {
    const rng = new SeededRng(0x5eed);
    const first = [rng.next(), rng.next(), rng.next()];
    rng.reset();
    expect([rng.next(), rng.next(), rng.next()]).toEqual(first);
  });

  it('maps values into the requested range', () => {
    const rng = new SeededRng(123);
    for (let i = 0; i < 100; i += 1) {
      const value = rng.range(0.15, 0.85);
      expect(value).toBeGreaterThanOrEqual(0.15);
      expect(value).toBeLessThan(0.85);
    }
  });
});
