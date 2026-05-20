import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CopyButtonComponent } from '@app/shared/components/copy-button/copy-button.component';
import { ErrorAlertComponent } from '@app/shared/components/error-alert/error-alert.component';
import { LanguageSelectComponent } from '@app/shared/components/language-select/language-select.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { SubmitButtonComponent } from '@app/shared/components/submit-button/submit-button.component';
import { AudioPlayerService } from '@core/services/audio-player.service';
import { CapabilitiesService } from '@core/services/capabilities.service';
import { RecorderService } from '@core/services/recorder.service';
import { TranslateApiService } from '@core/services/translate-api.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import type { TranslateAudioResponse } from '@shared/api.types';

@Component({
  selector: 'app-speech-to-speech',
  imports: [
    ReactiveFormsModule,
    LanguageSelectComponent,
    SubmitButtonComponent,
    ErrorAlertComponent,
    PageHeaderComponent,
    CopyButtonComponent,
  ],
  providers: [AudioPlayerService],
  templateUrl: './speech-to-speech.component.html',
  styleUrl: './speech-to-speech.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechToSpeechComponent {
  private readonly api = inject(TranslateApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly caps = inject(CapabilitiesService);
  protected readonly player = inject(AudioPlayerService);
  protected readonly recorder = inject(RecorderService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<TranslateAudioResponse | null>(null);
  protected readonly selectedFile = signal<File | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    source_language: ['auto'],
    target_language: ['', Validators.required],
    target_voice: [''],
    language_format: ['bcp47'],
    model: [''],
  });

  protected readonly voices = computed(() => this.caps.availableVoices());

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.recorder.resetError();
  }

  startRecording(): void {
    this.error.set(null);
    this.result.set(null);
    this.player.clear();

    this.recorder
      .start()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          this.selectedFile.set(file);
        },
        error: () => {
          // errorMessage is set on RecorderService; no duplicate alert needed.
        },
      });
  }

  stopRecording(): void {
    this.recorder.stop();
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.player.clear();

    const {
      source_language,
      target_language,
      target_voice,
      language_format,
      model,
    } = this.form.getRawValue();

    this.api
      .translateAudio(
        file,
        target_language,
        source_language,
        target_voice,
        language_format,
        model,
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.player.setAudio(res.audio_data_base64);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Translation failed'));
          this.loading.set(false);
        },
      });
  }

  download(): void {
    this.player.download('translated.wav');
  }

  clear(): void {
    this.player.clear();
    this.selectedFile.set(null);
    this.form.reset({
      source_language: 'auto',
      target_language: '',
      target_voice: '',
      language_format: 'bcp47',
      model: '',
    });
    this.result.set(null);
    this.error.set(null);
  }
}
