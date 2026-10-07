import { describe, expect, it } from 'vitest';
import { resolvePlatformId } from '../../src/platform/PlatformFactory';

describe('PlatformFactory', () => {
  it('defaults to standalone web', () => {
    expect(resolvePlatformId('')).toBe('web');
  });

  it('accepts supported query platforms', () => {
    expect(resolvePlatformId('?platform=youtube')).toBe('youtube');
    expect(resolvePlatformId('?platform=playable-ad')).toBe('playable-ad');
  });

  it('prefers the packaged platform over a query override', () => {
    expect(
      resolvePlatformId('?platform=web', 'youtube')
    ).toBe('youtube');
  });

  it('falls back to web for unknown query values', () => {
    expect(resolvePlatformId('?platform=unknown')).toBe('web');
  });
});
