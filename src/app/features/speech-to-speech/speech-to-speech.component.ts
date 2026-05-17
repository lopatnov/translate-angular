import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CopyButtonComponent } from '@app/shared/components/copy-button/copy-button.component';
import { ErrorAlertComponent } from '@app/shared/components/error-alert/error-alert.component';
import { LanguageSelectComponent } from '@app/shared/components/language-select/language-select.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { SubmitButtonComponent } from '@app/shared/components/submit-button/submit-button.component';
import { CapabilitiesService } from '@core/services/capabilities.service';
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
  templateUrl: './speech-to-speech.component.html',
  styleUrl: './speech-to-speech.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechToSpeechComponent {
  private readonly api = inject(TranslateApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly caps = inject(CapabilitiesService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<TranslateAudioResponse | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly audioUrl = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    source_language: ['auto'],
    target_language: ['', Validators.required],
    target_voice: [''],
    language_format: ['bcp47'],
  });

  protected readonly voices = computed(() => this.caps.availableVoices());

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  submit(): void {
    const file = this.selectedFile();
    if (!file || this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    const prev = this.audioUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.audioUrl.set(null);

    const { source_language, target_language, target_voice, language_format } =
      this.form.getRawValue();

    this.api
      .translateAudio(
        file,
        target_language,
        source_language,
        target_voice,
        language_format,
      )
      .subscribe({
        next: (res) => {
          this.result.set(res);
          const bytes = Uint8Array.from(
            atob(res.audio_data_base64),
            (c) => c.codePointAt(0) ?? 0,
          );
          const blob = new Blob([bytes], { type: 'audio/wav' });
          this.audioUrl.set(URL.createObjectURL(blob));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Translation failed'));
          this.loading.set(false);
        },
      });
  }

  download(): void {
    const url = this.audioUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translated.wav';
    a.click();
  }

  clear(): void {
    const prev = this.audioUrl();
    if (prev) URL.revokeObjectURL(prev);

    this.selectedFile.set(null);
    this.form.reset({
      source_language: 'auto',
      target_language: '',
      target_voice: '',
      language_format: 'bcp47',
    });
    this.result.set(null);
    this.audioUrl.set(null);
    this.error.set(null);
  }
}
