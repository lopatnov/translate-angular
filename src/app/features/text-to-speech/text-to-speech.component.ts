import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorAlertComponent } from '@app/shared/components/error-alert/error-alert.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { SubmitButtonComponent } from '@app/shared/components/submit-button/submit-button.component';
import { AudioPlayerService } from '@core/services/audio-player.service';
import { CapabilitiesService } from '@core/services/capabilities.service';
import { TranslateApiService } from '@core/services/translate-api.service';
import { apiErrorMessage } from '@core/utils/api-error.util';

@Component({
  selector: 'app-text-to-speech',
  imports: [
    ReactiveFormsModule,
    SubmitButtonComponent,
    ErrorAlertComponent,
    PageHeaderComponent,
  ],
  providers: [AudioPlayerService],
  templateUrl: './text-to-speech.component.html',
  styleUrl: './text-to-speech.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextToSpeechComponent {
  private readonly api = inject(TranslateApiService);
  private readonly fb = inject(FormBuilder);
  protected readonly caps = inject(CapabilitiesService);
  protected readonly player = inject(AudioPlayerService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    text: ['', Validators.required],
    language: [''],
    voice: [''],
    speed: [0.85],
    language_format: ['bcp47'],
  });

  /** Available voices from capabilities (e.g. ['en', 'ru', 'uk']). */
  protected readonly voices = computed(() => this.caps.availableVoices());

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.player.clear();

    const { text, language, voice, speed, language_format } =
      this.form.getRawValue();

    this.api
      .synthesize({
        text,
        language: language || undefined,
        voice: voice || undefined,
        speed,
        language_format,
      })
      .subscribe({
        next: (res) => {
          this.player.setAudio(res.audio_data_base64, res.sample_rate);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err, 'Synthesis failed'));
          this.loading.set(false);
        },
      });
  }

  download(): void {
    this.player.download('synthesized.wav');
  }

  clear(): void {
    this.player.clear();
    this.form.reset({
      text: '',
      language: '',
      voice: '',
      speed: 0.85,
      language_format: 'bcp47',
    });
    this.error.set(null);
  }
}
