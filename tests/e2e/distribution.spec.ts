import { expect, test } from '@playwright/test';
import type { RunnerTestBridge } from '../../src/games/runner/RunnerTestBridge';
import type {
  FoundationTestBridge,
  FoundationTestState
} from '../../src/testing/TestBridge';

type YouTubeTestControl = {
  calls: string[];
  audioEnabled: boolean;
  pause?: () => void;
  resume?: () => void;
  audioChange?: (enabled: boolean) => void;
};

async function foundationState(
  page: import('@playwright/test').Page
): Promise<FoundationTestState> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __GAME_FACTORY_TEST__: FoundationTestBridge;
        }
      ).__GAME_FACTORY_TEST__.getState()
  );
}

async function runnerSignature(
  page: import('@playwright/test').Page
): Promise<string> {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __GAME_FACTORY_RUNNER_TEST__: RunnerTestBridge;
        }
      ).__GAME_FACTORY_RUNNER_TEST__.getState().courseSignature
  );
}

test('W6 keeps identical runner gameplay behind web, playable-ad and YouTube adapters', async ({ page }) => {
  await page.goto('/?game=runner&platform=web');
  await expect
    .poll(async () => (await foundationState(page)).platformReady)
    .toBe(true);

  const webState = await foundationState(page);
  const webSignature = await runnerSignature(page);

  expect(webState.platformId).toBe('web');

  await page.goto('/?game=runner&platform=playable-ad');
  await expect
    .poll(async () => (await foundationState(page)).platformReady)
    .toBe(true);

  const playableState = await foundationState(page);
  const playableSignature = await runnerSignature(page);

  expect(playableState.platformId).toBe('playable-ad');
  expect(playableSignature).toBe(webSignature);
  expect(playableState.seed).toBe(webState.seed);

  await page.addInitScript(() => {
    const control: YouTubeTestControl = {
      calls: [],
      audioEnabled: false
    };

    (
      window as unknown as {
        __YT_TEST__: YouTubeTestControl;
      }
    ).__YT_TEST__ = control;

    (
      window as unknown as {
        ytgame: {
          IN_PLAYABLES_ENV: boolean;
          SDK_VERSION: string;
          game: {
            firstFrameReady(): void;
            gameReady(): void;
            loadData(): Promise<string>;
            saveData(data: string): Promise<void>;
          };
          system: {
            isAudioEnabled(): boolean;
            onAudioEnabledChange(
              callback: (enabled: boolean) => void
            ): () => void;
            onPause(callback: () => void): () => void;
            onResume(callback: () => void): () => void;
          };
        };
      }
    ).ytgame = {
      IN_PLAYABLES_ENV: true,
      SDK_VERSION: 'w6-test',
      game: {
        firstFrameReady() {
          control.calls.push('firstFrameReady');
        },
        gameReady() {
          control.calls.push('gameReady');
        },
        async loadData() {
          return '';
        },
        async saveData(_data: string) {}
      },
      system: {
        isAudioEnabled() {
          return control.audioEnabled;
        },
        onAudioEnabledChange(callback) {
          control.audioChange = callback;
          return () => {
            control.audioChange = undefined;
          };
        },
        onPause(callback) {
          control.pause = callback;
          return () => {
            control.pause = undefined;
          };
        },
        onResume(callback) {
          control.resume = callback;
          return () => {
            control.resume = undefined;
          };
        }
      }
    };
  });

  await page.goto('/?game=runner&platform=youtube');

  await expect
    .poll(async () => (await foundationState(page)).platformReady)
    .toBe(true);

  const youtubeState = await foundationState(page);
  const youtubeSignature = await runnerSignature(page);

  expect(youtubeState.platformId).toBe('youtube');
  expect(youtubeSignature).toBe(webSignature);
  expect(youtubeState.seed).toBe(webState.seed);
  expect(youtubeState.audioEnabled).toBe(false);

  const calls = await page.evaluate(
    () =>
      (
        window as unknown as {
          __YT_TEST__: YouTubeTestControl;
        }
      ).__YT_TEST__.calls
  );

  expect(calls).toEqual(['firstFrameReady', 'gameReady']);

  await page.evaluate(() => {
    (
      window as unknown as {
        __YT_TEST__: YouTubeTestControl;
      }
    ).__YT_TEST__.pause?.();
  });

  await expect
    .poll(async () => (await foundationState(page)).paused)
    .toBe(true);

  await page.evaluate(() => {
    (
      window as unknown as {
        __YT_TEST__: YouTubeTestControl;
      }
    ).__YT_TEST__.resume?.();
  });

  await expect
    .poll(async () => (await foundationState(page)).paused)
    .toBe(false);

  await page.evaluate(() => {
    const control = (
      window as unknown as {
        __YT_TEST__: YouTubeTestControl;
      }
    ).__YT_TEST__;

    control.audioEnabled = true;
    control.audioChange?.(true);
  });

  await expect
    .poll(async () => (await foundationState(page)).audioEnabled)
    .toBe(true);
});
