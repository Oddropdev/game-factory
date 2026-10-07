import { PlayableAdPlatform } from './PlayableAdPlatform';
import type { PlatformBridge, PlatformId } from './PlatformBridge';
import { WebPlatform } from './WebPlatform';
import { YouTubePlatform } from './youtube/YouTubePlatform';

const PLATFORM_IDS: readonly PlatformId[] = [
  'web',
  'youtube',
  'playable-ad'
];

export function resolvePlatformId(
  search?: string,
  packagedPlatform?: PlatformId
): PlatformId {
  const effectivePackagedPlatform =
    packagedPlatform ??
    (typeof window === 'undefined'
      ? undefined
      : window.__GAME_FACTORY_PLATFORM__);

  if (
    effectivePackagedPlatform &&
    PLATFORM_IDS.includes(effectivePackagedPlatform)
  ) {
    return effectivePackagedPlatform;
  }

  const effectiveSearch =
    search ??
    (typeof window === 'undefined' ? '' : window.location.search);
  const requested = new URLSearchParams(effectiveSearch).get(
    'platform'
  );

  return PLATFORM_IDS.includes(requested as PlatformId)
    ? (requested as PlatformId)
    : 'web';
}

export function createPlatform(
  id: PlatformId
): PlatformBridge {
  if (id === 'youtube') {
    return new YouTubePlatform();
  }

  if (id === 'playable-ad') {
    return new PlayableAdPlatform();
  }

  return new WebPlatform();
}
