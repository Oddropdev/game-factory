export type YouTubePlayablesSdk = {
  IN_PLAYABLES_ENV: boolean;
  SDK_VERSION?: string;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    loadData(): Promise<string>;
    saveData(data: string): Promise<void>;
  };
  system: {
    getLanguage?(): Promise<string>;
    isAudioEnabled(): boolean;
    onAudioEnabledChange(
      callback: (isAudioEnabled: boolean) => void
    ): () => void;
    onPause(callback: () => void): () => void;
    onResume(callback: () => void): () => void;
  };
  engagement?: {
    sendScore?(score: { value: number }): Promise<void>;
  };
};

declare global {
  interface Window {
    ytgame?: YouTubePlayablesSdk;
  }
}
