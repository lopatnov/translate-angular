import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type VadState = 'idle' | 'starting' | 'listening' | 'error';

/** RMS thresholds for low / medium / high microphone sensitivity. */
export const SENSITIVITY_THRESHOLDS = {
  low: 0.03, // noisy environment — only loud speech detected
  medium: 0.012, // typical office
  high: 0.005, // quiet room — picks up soft speech
} as const;

export type VadSensitivity = keyof typeof SENSITIVITY_THRESHOLDS;

export interface VadOptions {
  /** Microphone sensitivity preset (default: 'medium'). */
  sensitivity?: VadSensitivity;
  /** ms of silence to append after speech ends before emitting (default: 400). */
  silencePaddingMs?: number;
  /** Minimum speech duration to emit in ms (default: 300). */
  minSpeechMs?: number;
  /** Force-emit a chunk after this many ms even if speech continues (default: 8000). */
  maxSpeechMs?: number;
}

/**
 * Energy-based Voice Activity Detection via AudioWorklet.
 * Call `start()` to begin — it returns an Observable<Float32Array> that emits
 * one mono PCM chunk per detected speech phrase. Call `stop()` to close the mic.
 *
 * Uses `AudioContext({ sampleRate: 16000 })` so Whisper receives native-rate audio;
 * falls back to the browser's hardware rate if 16 kHz is not supported.
 */
@Injectable({ providedIn: 'root' })
export class VadService {
  readonly state = signal<VadState>('idle');
  readonly errorMessage = signal<string | null>(null);
  /** Actual AudioContext sample rate (set after mic is opened). */
  readonly sampleRate = signal(16_000);
  /** Seconds of uninterrupted silence since last speech segment. */
  readonly silenceSeconds = signal(0);

  private audioCtx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private silenceTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * When true, VAD still captures audio but does not emit speech segments.
   * Use while TTS is playing to prevent the speaker output from being re-translated.
   */
  private _suppress = false;

  /** Mute or un-mute segment emission (e.g. during TTS playback). */
  suppress(value: boolean): void {
    this._suppress = value;
  }

  start(options: VadOptions = {}): Observable<Float32Array> {
    // Stop any active session before starting a new one to prevent
    // orphaned timers, AudioWorklet nodes, and multiple microphone streams.
    this.stop();
    return new Observable<Float32Array>((subscriber) => {
      this.state.set('starting');
      this.errorMessage.set(null);
      this.silenceSeconds.set(0);

      navigator.mediaDevices
        .getUserMedia({
          audio: {
            // Disable Chrome's automatic audio processing — it can reduce signal
            // energy to near-zero and prevent VAD from detecting any speech.
            // echoCancellation stays ON so the speaker does not feed back into mic.
            echoCancellation: true,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: false,
        })
        .then(async (stream) => {
          this.stream = stream;

          // Request 16 kHz — some browsers honour this, others don't.
          this.audioCtx = new AudioContext({ sampleRate: 16_000 });
          // Chrome may start the AudioContext in a suspended state when it is
          // created inside an async callback rather than a synchronous user-
          // gesture handler.  resume() is a no-op when already running.
          await this.audioCtx.resume();
          const rate = this.audioCtx.sampleRate;
          this.sampleRate.set(rate);

          await this.audioCtx.audioWorklet.addModule('/pcm-worklet.js');

          this.workletNode = new AudioWorkletNode(
            this.audioCtx,
            'pcm-collector',
          );

          // ── VAD state ────────────────────────────────────────────────────
          const threshold =
            SENSITIVITY_THRESHOLDS[options.sensitivity ?? 'medium'];
          const frameSamples = 128; // AudioWorklet always delivers 128 samples
          const frameDurationMs = (frameSamples / rate) * 1000;

          const silencePaddingFrames = Math.ceil(
            (options.silencePaddingMs ?? 400) / frameDurationMs,
          );
          const minSpeechFrames = Math.ceil(
            (options.minSpeechMs ?? 300) / frameDurationMs,
          );
          const maxSpeechSamples = Math.ceil(
            ((options.maxSpeechMs ?? 8_000) / 1_000) * rate,
          );

          const speechBufs: Float32Array[] = [];
          let isSpeaking = false;
          let silenceFrames = 0;
          let speechFrames = 0;

          const emitAndReset = (): void => {
            // When suppressed (e.g. during TTS playback) we still reset state
            // so that TTS audio captured by the mic is discarded rather than
            // accumulated and emitted once suppression lifts.
            if (speechFrames >= minSpeechFrames && !this._suppress) {
              const total = speechBufs.reduce((n, b) => n + b.length, 0);
              const merged = new Float32Array(total);
              let pos = 0;
              for (const buf of speechBufs) {
                merged.set(buf, pos);
                pos += buf.length;
              }
              subscriber.next(merged);
            }
            speechBufs.length = 0;
            isSpeaking = false;
            silenceFrames = 0;
            speechFrames = 0;
          };

          // ── Silence-timeout counter (updates once per second) ────────────
          this.silenceTimer = setInterval(() => {
            if (!isSpeaking) {
              this.silenceSeconds.update((s) => s + 1);
            } else {
              this.silenceSeconds.set(0);
            }
          }, 1_000);

          // ── Process PCM frames from the worklet ──────────────────────────
          this.workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
            const frame = e.data;

            // RMS energy of this frame.
            let sum = 0;
            for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
            const rms = Math.sqrt(sum / frame.length);

            if (rms >= threshold) {
              isSpeaking = true;
              silenceFrames = 0;
              speechFrames++;
              speechBufs.push(frame);

              // Force-emit when chunk exceeds maxSpeechMs.
              const totalSamples = speechBufs.reduce((n, b) => n + b.length, 0);
              if (totalSamples >= maxSpeechSamples) emitAndReset();
            } else if (isSpeaking) {
              silenceFrames++;
              speechBufs.push(frame); // include silence padding in the chunk

              if (silenceFrames >= silencePaddingFrames) emitAndReset();
            }
          };

          // Source → worklet → muted gain → destination (keeps graph alive).
          const source = this.audioCtx.createMediaStreamSource(stream);
          const mute = this.audioCtx.createGain();
          mute.gain.value = 0;
          source.connect(this.workletNode);
          this.workletNode.connect(mute);
          mute.connect(this.audioCtx.destination);

          this.state.set('listening');
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

      // Teardown — called when the subscriber unsubscribes or component destroys.
      return () => this.stop();
    });
  }

  stop(): void {
    if (this.silenceTimer !== null) {
      clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.workletNode?.disconnect();
    if (this.stream) {
      for (const t of this.stream.getTracks()) {
        t.stop();
      }
    }
    void this.audioCtx?.close();
    this.workletNode = null;
    this.stream = null;
    this.audioCtx = null;
    this._suppress = false;
    if (this.state() === 'listening' || this.state() === 'starting') {
      this.state.set('idle');
    }
    this.silenceSeconds.set(0);
  }

  resetError(): void {
    if (this.state() === 'error') {
      this.state.set('idle');
      this.errorMessage.set(null);
    }
  }
}
