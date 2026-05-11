import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	OnInit,
	signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from './api-error.util';
import { LANGUAGE_FORMATS, LANGUAGES } from './languages';
import { type TranscribeResponse, TranslateApiService } from './translate-api.service';

@Component({
	selector: 'app-speech-to-text',
	imports: [ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
    <div class="mb-4">
      <h2 class="page-title mb-1">Speech to text</h2>
      <p class="lead text-muted mb-0">
        Transcribe a WAV audio file using Whisper. Auto-detects language when not specified.
      </p>
    </div>

    <div class="card section-card mb-4">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="row g-3 mb-3">
            <div class="col-md-5">
              <label class="form-label" for="audio-file">Audio file (.wav)</label>
              <input id="audio-file" type="file" accept=".wav" class="form-control"
                     (change)="onFileChange($event)"
                     aria-describedby="audio-hint">
              <div id="audio-hint" class="form-text">Only WAV format is supported.</div>
            </div>

            <div class="col-md-4">
              <label class="form-label" for="stt-lang">Language hint</label>
              @if (isNative()) {
                <input id="stt-lang" class="form-control" formControlName="language"
                       [class.is-invalid]="form.controls.language.invalid && form.controls.language.touched"
                       placeholder="e.g. Ukrainian">
                <div class="invalid-feedback">Language is required in Native mode</div>
              } @else {
                <select id="stt-lang" class="form-select" formControlName="language">
                  <option value="auto">Auto-detect</option>
                  @for (lang of languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.name }}</option>
                  }
                </select>
              }
            </div>

            <div class="col-md-3">
              <label class="form-label" for="stt-fmt">Language format</label>
              <select id="stt-fmt" class="form-select" formControlName="language_format">
                @for (f of formats; track f.value) {
                  <option [value]="f.value">{{ f.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary"
                    [disabled]="!selectedFile() || form.invalid || loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Transcribing…
              } @else {
                Transcribe
              }
            </button>
            <button type="button" class="btn btn-outline-secondary" (click)="clear()">Clear</button>
          </div>

          @if (selectedFile()) {
            <div class="mt-2 small text-muted">
              Selected: {{ selectedFile()!.name }}
              ({{ (selectedFile()!.size / 1024).toFixed(1) }} KB)
            </div>
          }
        </form>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-danger" role="alert">{{ error() }}</div>
    }

    @if (result()) {
      <div class="card section-card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 class="h6 mb-0">Transcription</h3>
          @if (result()!.detectedLanguage) {
            <span class="badge bg-warning text-dark">
              Language: {{ result()!.detectedLanguage }}
            </span>
          }
        </div>
        <div class="card-body">
          <pre class="transcript-preview">{{ result()!.fullText }}</pre>
          <button type="button" class="btn btn-outline-secondary btn-sm mt-2"
                  (click)="copy(result()!.fullText)">
            Copy text
          </button>
        </div>
      </div>

      @if (result()!.segments.length > 0) {
        <div class="card section-card">
          <div class="card-header">
            <h3 class="h6 mb-0">Segments ({{ result()!.segments.length }})</h3>
          </div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0" style="color: inherit;">
              <thead>
                <tr>
                  <th scope="col" class="ps-3">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Text</th>
                </tr>
              </thead>
              <tbody>
                @for (seg of result()!.segments; track $index) {
                  <tr>
                    <td class="ps-3 text-muted">{{ formatTime(seg.startTime) }}</td>
                    <td class="text-muted">{{ formatTime(seg.endTime) }}</td>
                    <td>{{ seg.text }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }
  `,
})
export class SpeechToTextComponent implements OnInit {
	private readonly api = inject(TranslateApiService);
	private readonly fb = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly languages = LANGUAGES;
	protected readonly formats = LANGUAGE_FORMATS;
	protected readonly loading = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly result = signal<TranscribeResponse | null>(null);
	protected readonly selectedFile = signal<File | null>(null);
	protected readonly langFormat = signal('bcp47');
	protected readonly isNative = computed(() => this.langFormat() === 'native');

	protected readonly form = this.fb.nonNullable.group({
		language: ['auto'],
		language_format: ['bcp47'],
	});

	ngOnInit(): void {
		this.form.controls.language_format.valueChanges
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((fmt) => {
				this.langFormat.set(fmt);
				const ctrl = this.form.controls.language;
				if (fmt === 'native') {
					ctrl.setValidators([Validators.required]);
				} else {
					ctrl.clearValidators();
				}
				ctrl.updateValueAndValidity({ emitEvent: false });
				this.form.patchValue(
					{ language: fmt === 'native' ? '' : 'auto' },
					{ emitEvent: false },
				);
			});
	}

	onFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.selectedFile.set(input.files?.[0] ?? null);
	}

	async submit(): Promise<void> {
		const file = this.selectedFile();
		if (!file) return;

		this.loading.set(true);
		this.error.set(null);
		this.result.set(null);

		const { language, language_format } = this.form.getRawValue();

		try {
			const obs$ = await this.api.transcribe(file, language, language_format);
			obs$.subscribe({
				next: (data) => {
					this.result.set(data);
					this.loading.set(false);
				},
				error: (err) => {
					this.error.set(apiErrorMessage(err, 'Transcription failed'));
					this.loading.set(false);
				},
			});
		} catch (err) {
			this.error.set(
				err instanceof Error ? err.message : 'Failed to read audio file',
			);
			this.loading.set(false);
		}
	}

	clear(): void {
		this.selectedFile.set(null);
		const fmt = this.form.controls.language_format.value;
		this.form.reset({
			language: fmt === 'native' ? '' : 'auto',
			language_format: fmt,
		});
		this.result.set(null);
		this.error.set(null);
	}

	copy(text: string): void {
		navigator.clipboard.writeText(text);
	}

	formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = (seconds % 60).toFixed(1);
		return `${m}:${s.padStart(4, '0')}`;
	}
}
