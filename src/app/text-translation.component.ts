import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from './api-error.util';
import { CapabilitiesService } from './capabilities.service';
import { useLangFormat } from './lang-format.util';
import { LANGUAGE_FORMATS, LANGUAGES } from './languages';
import { type TranslateResponse, TranslateApiService } from './translate-api.service';

@Component({
	selector: 'app-text-translation',
	imports: [ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
    <div class="mb-4">
      <h2 class="page-title mb-1">Text translation</h2>
      <p class="lead text-muted mb-0">Translate text between any two supported languages.</p>
    </div>

    <div class="card section-card mb-4">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="row g-3 mb-3">

            @if (isNative()) {
              <div class="col-md-4">
                <label class="form-label" for="src-lang-native">Source language</label>
                <input id="src-lang-native" class="form-control" formControlName="source_language"
                       placeholder="e.g. Українська (empty = auto-detect)">
                <div class="form-text">Empty = auto-detect</div>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="tgt-lang-native">Target language</label>
                <input id="tgt-lang-native" class="form-control" formControlName="target_language"
                       [class.is-invalid]="form.controls.target_language.invalid && form.controls.target_language.touched"
                       placeholder="e.g. English">
                <div class="invalid-feedback">Target language is required</div>
              </div>
            } @else {
              <div class="col-md-4">
                <label class="form-label" for="src-lang">Source language</label>
                <select id="src-lang" class="form-select" formControlName="source_language">
                  <option value="auto">Auto-detect</option>
                  @for (lang of languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.name }}</option>
                  }
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="tgt-lang">Target language</label>
                <select id="tgt-lang" class="form-select" formControlName="target_language">
                  @for (lang of languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.name }}</option>
                  }
                </select>
              </div>
            }

            <div class="col-md-2">
              <label class="form-label" for="model-select">Model</label>
              <select id="model-select" class="form-select" formControlName="model"
                      aria-describedby="model-hint">
                <option value="">Default</option>
                @for (m of caps.availableModels(); track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
              <div id="model-hint" class="form-text">
                @if (caps.isLoading()) {
                  Loading…
                } @else {
                  {{ caps.availableModels().length }} available
                }
              </div>
            </div>
            <div class="col-md-2">
              <label class="form-label" for="lang-fmt">Language format</label>
              <select id="lang-fmt" class="form-select" formControlName="language_format">
                @for (f of formats; track f.value) {
                  <option [value]="f.value">{{ f.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="text-input">Source text</label>
            <textarea id="text-input" class="form-control" rows="6"
                      formControlName="text"
                      placeholder="Enter text to translate…">
            </textarea>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Translating…
              } @else {
                Translate
              }
            </button>
            <button type="button" class="btn btn-outline-secondary" (click)="clear()">Clear</button>
          </div>
        </form>
      </div>
    </div>

    @if (error()) {
      <div class="alert alert-danger" role="alert">{{ error() }}</div>
    }

    @if (result()) {
      <div class="card section-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 class="h6 mb-0">Result</h3>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            @if (result()!.detectedLanguage) {
              <span class="badge bg-warning text-dark">Detected: {{ result()!.detectedLanguage }}</span>
            }
            <span class="badge bg-secondary">{{ result()!.modelUsed }}</span>
          </div>
        </div>
        <div class="card-body">
          <pre class="transcript-preview">{{ result()!.translatedText }}</pre>
          <button type="button" class="btn btn-outline-secondary btn-sm mt-2"
                  (click)="copy(result()!.translatedText)">
            Copy to clipboard
          </button>
        </div>
      </div>
    }
  `,
})
export class TextTranslationComponent {
	private readonly api = inject(TranslateApiService);
	private readonly fb = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);
	protected readonly caps = inject(CapabilitiesService);

	protected readonly languages = LANGUAGES;
	protected readonly formats = LANGUAGE_FORMATS;
	protected readonly loading = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly result = signal<TranslateResponse | null>(null);
	protected readonly form = this.fb.nonNullable.group({
		text: ['', Validators.required],
		source_language: ['auto'],
		target_language: ['en'],
		model: [''],
		language_format: ['bcp47'],
	});

	private readonly _lf = useLangFormat(
		this.form.controls.language_format,
		this.destroyRef,
		(native) => {
			const ctrl = this.form.controls.target_language;
			native ? ctrl.setValidators([Validators.required]) : ctrl.clearValidators();
			ctrl.updateValueAndValidity({ emitEvent: false });
			this.form.patchValue(
				native
					? { source_language: '', target_language: '' }
					: { source_language: 'auto', target_language: 'en' },
				{ emitEvent: false },
			);
		},
	);
	protected readonly isNative = this._lf.isNative;

	submit(): void {
		if (this.form.invalid) return;
		this.loading.set(true);
		this.error.set(null);
		this.result.set(null);

		const { text, source_language, target_language, model, language_format } =
			this.form.getRawValue();

		this.api
			.translate({ text, source_language, target_language, model: model || undefined, language_format })
			.subscribe({
				next: (data) => {
					this.result.set(data);
					this.loading.set(false);
				},
				error: (err) => {
					this.error.set(apiErrorMessage(err, 'Translation failed'));
					this.loading.set(false);
				},
			});
	}

	clear(): void {
		this.form.reset({
			source_language: this.isNative() ? '' : 'auto',
			target_language: this.isNative() ? '' : 'en',
			language_format: this.form.controls.language_format.value,
		});
		this.result.set(null);
		this.error.set(null);
	}

	copy(text: string): void {
		navigator.clipboard.writeText(text);
	}
}
