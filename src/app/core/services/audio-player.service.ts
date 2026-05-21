import { Injectable, type OnDestroy, signal } from '@angular/core';
import { base64ToAudioUrl, downloadWav } from '@core/utils/audio-url.util';

/**
 * Per-component service that manages a single audio Blob URL lifecycle.
 * Revokes the previous URL automatically on each new audio load, on clear,
 * and on component destroy — preventing memory leaks.
 *
 * Usage: add `providers: [AudioPlayerService]` to the host component so each
 * component gets its own instance (do NOT use `providedIn: 'root'`).
 */
@Injectable()
export class AudioPlayerService implements OnDestroy {
  readonly audioUrl = signal<string | null>(null);
  readonly sampleRate = signal<number | null>(null);

  /**
   * Converts base64 WAV data to a Blob URL and stores it.
   * Revokes any previously stored URL first.
   */
  setAudio(base64: string, sampleRate?: number): void {
    this.revokeCurrent();
    this.audioUrl.set(base64ToAudioUrl(base64));
    this.sampleRate.set(sampleRate ?? null);
  }

  /** Triggers a browser download of the current audio URL. */
  download(filename: string): void {
    const url = this.audioUrl();
    if (url) downloadWav(url, filename);
  }

  /** Revokes the current Blob URL and resets all signals. */
  clear(): void {
    this.revokeCurrent();
    this.audioUrl.set(null);
    this.sampleRate.set(null);
  }

  ngOnDestroy(): void {
    this.revokeCurrent();
  }

  private revokeCurrent(): void {
    const url = this.audioUrl();
    if (url) URL.revokeObjectURL(url);
  }
}
