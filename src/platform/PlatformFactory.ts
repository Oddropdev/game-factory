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
  search = window.location.search,
  packagedPlatform = window.__GAME_FACTORY_PLATFORM__
): PlatformId {
  if (packagedPlatform && PLATFORM_IDS.includes(packagedPlatform)) {
    return packagedPlatform;
  }

  const requested = new URLSearchParams(search).get('platform');

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
