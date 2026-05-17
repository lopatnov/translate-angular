import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { encodeWav } from '@core/utils/wav-encoder';

export type RecorderState = 'idle' | 'recording' | 'error';

/** MIME types tried in order of preference. */
const CANDIDATE_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

function pickMimeType(): string | undefined {
  return CANDIDATE_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * Singleton service that wraps MediaRecorder.
 * Call `start()` to begin recording — it returns an Observable that emits
 * one `File` (WAV) when `stop()` is called, then completes.
 * The WAV file is mono, 16-bit PCM at the browser's native sample rate;
 * the backend (NAudio) resamples it to 16 kHz for Whisper.
 */
@Injectable({ providedIn: 'root' })
export class RecorderService {
  /** Current recording state. */
  readonly state = signal<RecorderState>('idle');
  /** Elapsed recording time in whole seconds. */
  readonly elapsedSeconds = signal(0);
  /** Human-readable error set when state === 'error'. */
  readonly errorMessage = signal<string | null>(null);

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Request microphone access and start recording.
   * Emits one WAV `File` on stop, then completes.
   * Errors when microphone access is denied or encoding fails.
   */
  start(): Observable<File> {
    return new Observable<File>((subscriber) => {
      this.chunks = [];
      this.elapsedSeconds.set(0);
      this.errorMessage.set(null);

      navigator.mediaDevices
        .getUserMedia({
          audio: {
            // Disable Chrome's automatic audio processing to prevent it from
            // suppressing speech energy to near-zero (observed as [BLANK_AUDIO]
            // from Whisper on Chrome while Firefox works fine).
            // echoCancellation is intentionally left at browser default (true)
            // for acoustic comfort; AGC and noise suppression are the culprits.
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        })
        .then((stream) => {
          const mimeType = pickMimeType();
          this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
          };

          this.mediaRecorder.onstop = () => {
            this._clearTimer();
            stream.getTracks().forEach((t) => t.stop());

            const blob = new Blob(this.chunks, { type: mimeType ?? 'audio/webm' });
            blob
              .arrayBuffer()
              .then((ab) => new AudioContext().decodeAudioData(ab))
              .then((decoded) => {
                const wavBuffer = encodeWav(decoded);
                const file = new File([wavBuffer], 'recording.wav', { type: 'audio/wav' });
                this.state.set('idle');
                subscriber.next(file);
                subscriber.complete();
              })
              .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Audio encoding failed';
                this.state.set('error');
                this.errorMessage.set(msg);
                subscriber.error(new Error(msg));
              });
          };

          // timeslice=250ms ensures Chrome flushes audio chunks regularly;
          // without it, Chrome may produce a malformed webm that decodes as silence.
          this.mediaRecorder.start(250);
          this.state.set('recording');

          this.timerHandle = setInterval(() => {
            this.elapsedSeconds.update((s) => s + 1);
          }, 1000);
        })
        .catch((err: unknown) => {
          const name = err instanceof DOMException ? err.name : '';
          const msg =
            name === 'NotAllowedError' || name === 'PermissionDeniedError'
              ? 'Microphone access denied. Allow it in browser settings and try again.'
              : err instanceof Error
                ? `Microphone unavailable: ${err.message}`
                : 'Microphone unavailable.';
          this.state.set('error');
          this.errorMessage.set(msg);
          subscriber.error(new Error(msg));
        });

      // Teardown: stop recording if the subscriber unsubscribes early.
      return () => this.stop();
    });
  }

  /** Stop an active recording. The Observable will emit the WAV file and complete. */
  stop(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this._clearTimer();
  }

  /** Reset error state so the Record button becomes available again. */
  resetError(): void {
    if (this.state() === 'error') {
      this.state.set('idle');
      this.errorMessage.set(null);
    }
  }

  private _clearTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }
}
