import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LanguageSelectComponent } from '@app/shared/components/language-select/language-select.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { CapabilitiesService } from '@core/services/capabilities.service';
import { TranslateApiService } from '@core/services/translate-api.service';
import {
  VadService,
  type VadSensitivity,
} from '@core/services/vad.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { LANGUAGES } from '@core/utils/languages';
import { encodeWavFromPcm } from '@core/utils/wav-encoder';
import { map, of, switchMap, take } from 'rxjs';

export interface LiveSegment {
  id: number;
  status: 'processing' | 'done' | 'error';
  original: string;
  translated: string;
  detectedLanguage: string;
  error: string | null;
}

const SENSITIVITY_LABELS: Record<VadSensitivity, string> = {
  low:    'Low — noisy environments',
  medium: 'Medium — typical room',
  high:   'High — quiet room',
};

@Component({
  selector: 'app-live-translation',
  imports: [ReactiveFormsModule, LanguageSelectComponent, PageHeaderComponent, RouterLink],
  templateUrl: './live-translation.component.html',
  styleUrl: './live-translation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveTranslationComponent {
  private readonly api  = inject(TranslateApiService);
  private readonly fb   = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly vad  = inject(VadService);
  protected readonly caps = inject(CapabilitiesService);

  protected readonly languages = LANGUAGES;
  protected readonly sensitivityOptions = Object.entries(SENSITIVITY_LABELS) as [VadSensitivity, string][];

  protected readonly liveFeed        = signal<LiveSegment[]>([]);
  protected readonly elapsedSeconds  = signal(0);
  protected readonly suggestStop     = signal(false);
  /** True while TTS audio is playing (suppresses VAD emission). */
  protected readonly isSpeakingTts   = signal(false);

  private _nextId     = 0;
  private _timerHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly form = this.fb.nonNullable.group({
    source_language:    [''],          // Whisper language hint — empty = auto
    target_language:    ['en'],        // Translation target (required)
    model:              [''],          // Translation model — empty = default
    sensitivity:        ['medium' as VadSensitivity],
    speak_translation:  [false],       // Speak each translated segment via TTS
  });

  constructor() {
    // Reflect VAD state → start/stop the elapsed timer.
    effect(() => {
      const s = this.vad.state();
      if (s === 'listening') {
        this._startTimer();
      } else if (s === 'idle' || s === 'error') {
        this._stopTimer();
      }
    });

    // Suggest stopping after 60 s of silence.
    effect(() => {
      if (this.vad.silenceSeconds() >= 60 && this.vad.state() === 'listening') {
        this.suggestStop.set(true);
      }
    });
  }

  startLive(): void {
    this.suggestStop.set(false);

    const { sensitivity } = this.form.getRawValue();

    this.vad
      .start({ sensitivity: sensitivity as VadSensitivity })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pcm) => this._processSegment(pcm),
        error: () => { /* errorMessage already set on VadService */ },
      });
  }

  stopLive(): void {
    this.vad.stop();
    this._stopTimer();
    this.suggestStop.set(false);
  }

  clear(): void {
    this.vad.stop();
    this._stopTimer();
    this.liveFeed.set([]);
    this.elapsedSeconds.set(0);
    this.suggestStop.set(false);
    this.vad.resetError();
  }

  copyAll(): void {
    const text = this.liveFeed()
      .filter((s) => s.status === 'done')
      .map((s) => `${s.original}\n${s.translated}`)
      .join('\n\n');
    void navigator.clipboard.writeText(text);
  }

  protected doneCount(): number {
    return this.liveFeed().filter((s) => s.status === 'done').length;
  }

  protected formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _processSegment(pcm: Float32Array): void {
    const id = this._nextId++;
    const segment: LiveSegment = {
      id,
      status: 'processing',
      original: '',
      translated: '',
      detectedLanguage: '',
      error: null,
    };
    this.liveFeed.update((feed) => [...feed, segment]);

    const rate = this.vad.sampleRate();
    const wavBuffer = encodeWavFromPcm(pcm, rate);
    const file = new File([wavBuffer], `seg-${id}.wav`, { type: 'audio/wav' });

    const { source_language, target_language, model } = this.form.getRawValue();

    this.api
      .transcribe(file, source_language || 'auto', 'bcp47')
      .pipe(
        switchMap((t) => {
          const original = t.fullText.trim();
          const detected = t.detectedLanguage ?? '';

          // Update segment with transcription immediately.
          this.liveFeed.update((feed) =>
            feed.map((s) =>
              s.id === id ? { ...s, original, detectedLanguage: detected } : s,
            ),
          );

          // Skip empty transcriptions (silence / noise detected as speech).
          if (!original) return of(null);

          const context = this._buildContext();
          return this.api
            .translate({
              text: original,
              source_language: detected || source_language || undefined,
              target_language,
              model: model || undefined,
              context: context || undefined,
              language_format: 'bcp47',
            })
            .pipe(map((r) => r.translatedText));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (translated) => {
          if (translated === null) {
            // Empty transcription — remove the placeholder segment.
            this.liveFeed.update((feed) => feed.filter((s) => s.id !== id));
          } else {
            this.liveFeed.update((feed) =>
              feed.map((s) =>
                s.id === id ? { ...s, status: 'done', translated } : s,
              ),
            );
            // Speak the translation if the checkbox is enabled and TTS is
            // available. Skip if another segment is already being spoken.
            const { speak_translation, target_language } = this.form.getRawValue();
            if (speak_translation && this.caps.ttsAvailable() && !this.isSpeakingTts()) {
              this._speakSegment(translated, target_language);
            }
          }
        },
        error: (err) => {
          this.liveFeed.update((feed) =>
            feed.map((s) =>
              s.id === id
                ? { ...s, status: 'error', error: apiErrorMessage(err, 'Processing failed') }
                : s,
            ),
          );
        },
      });
  }

  /**
   * Synthesize `text` via TTS and play it back.
   * VAD emission is suppressed for the duration so the speaker does not
   * re-translate its own output (echoCancellation handles the acoustic path,
   * this handles the VAD path).
   */
  private _speakSegment(text: string, language: string): void {
    this.isSpeakingTts.set(true);
    this.vad.suppress(true);

    this.api
      .synthesize({ text, language, language_format: 'bcp47' })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const bytes = Uint8Array.from(atob(res.audio_data_base64), (c) =>
            c.charCodeAt(0),
          );
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          const cleanup = (): void => {
            URL.revokeObjectURL(url);
            this.isSpeakingTts.set(false);
            this.vad.suppress(false);
          };
          audio.addEventListener('ended', cleanup, { once: true });
          audio.addEventListener('error', cleanup, { once: true });
          void audio.play().catch(cleanup);
        },
        error: () => {
          this.isSpeakingTts.set(false);
          this.vad.suppress(false);
        },
      });
  }

  /** Last ≤3 translated segments, up to 500 characters, for translation context. */
  private _buildContext(): string {
    const done = this.liveFeed().filter(
      (s) => s.status === 'done' && s.translated,
    );
    const text = done
      .slice(-3)
      .map((s) => s.translated)
      .join(' ');
    return text.length > 500 ? text.slice(-500) : text;
  }

  private _startTimer(): void {
    if (this._timerHandle !== null) return;
    this._timerHandle = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);
    }, 1_000);
  }

  private _stopTimer(): void {
    if (this._timerHandle !== null) {
      clearInterval(this._timerHandle);
      this._timerHandle = null;
    }
  }
}
