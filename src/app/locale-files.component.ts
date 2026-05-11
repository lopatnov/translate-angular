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
import { apiErrorMessage } from './api-error.util';
import { CapabilitiesService } from './capabilities.service';
import { LANGUAGE_FORMATS, LANGUAGES } from './languages';
import { type LocalizeResponse, TranslateApiService } from './translate-api.service';

@Component({
	selector: 'app-locale-files',
	imports: [ReactiveFormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
    <div class="mb-4">
      <h2 class="page-title mb-1">Localization files</h2>
      <p class="lead text-muted mb-0">
        Translate all string values in a JSON i18n file, preserving key structure.
      </p>
    </div>

    <div class="card section-card mb-4">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="row g-3 mb-3">
            @if (isNative()) {
              <div class="col-md-3">
                <label class="form-label" for="loc-src-native">Source language</label>
                <input id="loc-src-native" class="form-control" formControlName="source_language"
                       [class.is-invalid]="form.controls.source_language.invalid && form.controls.source_language.touched"
                       placeholder="e.g. English">
                <div class="invalid-feedback">Source language is required</div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="loc-tgt-native">Target language</label>
                <input id="loc-tgt-native" class="form-control" formControlName="target_language"
                       [class.is-invalid]="form.controls.target_language.invalid && form.controls.target_language.touched"
                       placeholder="e.g. Українська">
                <div class="invalid-feedback">Target language is required</div>
              </div>
            } @else {
              <div class="col-md-3">
                <label class="form-label" for="loc-src">Source language</label>
                <select id="loc-src" class="form-select" formControlName="source_language">
                  @for (lang of languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.name }}</option>
                  }
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="loc-tgt">Target language</label>
                <select id="loc-tgt" class="form-select" formControlName="target_language">
                  @for (lang of languages; track lang.code) {
                    <option [value]="lang.code">{{ lang.name }}</option>
                  }
                </select>
              </div>
            }

            <div class="col-md-2">
              <label class="form-label" for="loc-model">Model</label>
              <select id="loc-model" class="form-select" formControlName="model">
                <option value="">Default</option>
                @for (m of caps.availableModels(); track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label" for="loc-fmt">Language format</label>
              <select id="loc-fmt" class="form-select" formControlName="language_format">
                @for (f of formats; track f.value) {
                  <option [value]="f.value">{{ f.label }}</option>
                }
              </select>
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <label class="btn btn-outline-secondary w-100">
                Upload JSON
                <input type="file" accept=".json" class="d-none" (change)="onFileChange($event)">
              </label>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="json-src">Source JSON</label>
            <textarea id="json-src" class="form-control font-monospace" rows="8"
                      formControlName="json"
                      placeholder='{ "key": "value", "greeting": "Hello" }'>
            </textarea>
          </div>

          <details class="mb-3">
            <summary class="text-muted small" style="cursor: pointer;">
              Existing translation (optional — reuse already translated keys)
            </summary>
            <div class="mt-2">
              <textarea class="form-control font-monospace" rows="4"
                        formControlName="existing_translation"
                        placeholder='{ "key": "previously translated value" }'>
              </textarea>
            </div>
          </details>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Translating…
              } @else {
                Translate JSON
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
          <h3 class="h6 mb-0">Translated JSON</h3>
          <span class="badge bg-warning text-dark">
            {{ result()!.stringsTranslated }} strings translated
          </span>
        </div>
        <div class="card-body">
          <textarea class="form-control font-monospace" rows="10" readonly
                    [value]="prettyResult()">
          </textarea>
          <div class="d-flex gap-2 mt-2">
            <button type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="copy(prettyResult())">
              Copy
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="download()">
              Download
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LocaleFilesComponent {
	private readonly api = inject(TranslateApiService);
	private readonly fb = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);
	protected readonly caps = inject(CapabilitiesService);

	protected readonly languages = LANGUAGES;
	protected readonly formats = LANGUAGE_FORMATS;
	protected readonly loading = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly result = signal<LocalizeResponse | null>(null);
	protected readonly prettyResult = signal('');
	protected readonly langFormat = signal('bcp47');
	protected readonly isNative = computed(() => this.langFormat() === 'native');

	protected readonly form = this.fb.nonNullable.group({
		json: ['', Validators.required],
		source_language: ['en'],
		target_language: ['uk'],
		model: [''],
		existing_translation: [''],
		language_format: ['bcp47'],
	});

	private readonly _langFmtSub = this.form.controls.language_format.valueChanges
		.pipe(takeUntilDestroyed(this.destroyRef))
		.subscribe((fmt) => {
			this.langFormat.set(fmt);
			const src = this.form.controls.source_language;
			const tgt = this.form.controls.target_language;
			if (fmt === 'native') {
				src.setValidators([Validators.required]);
				tgt.setValidators([Validators.required]);
			} else {
				src.clearValidators();
				tgt.clearValidators();
			}
			src.updateValueAndValidity({ emitEvent: false });
			tgt.updateValueAndValidity({ emitEvent: false });
			this.form.patchValue(
				fmt === 'native'
					? { source_language: '', target_language: '' }
					: { source_language: 'en', target_language: 'uk' },
				{ emitEvent: false },
			);
		});

	onFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			this.form.patchValue({ json: text });
		};
		reader.readAsText(file);
	}

	submit(): void {
		if (this.form.invalid) return;
		this.loading.set(true);
		this.error.set(null);
		this.result.set(null);

		const { json, source_language, target_language, model, existing_translation, language_format } =
			this.form.getRawValue();

		this.api
			.localize({
				json,
				source_language,
				target_language,
				model: model || undefined,
				existing_translation: existing_translation || undefined,
				language_format,
			})
			.subscribe({
				next: (data) => {
					this.result.set(data);
					try {
						this.prettyResult.set(JSON.stringify(JSON.parse(data.json), null, 2));
					} catch {
						this.prettyResult.set(data.json);
					}
					this.loading.set(false);
				},
				error: (err) => {
					this.error.set(apiErrorMessage(err, 'Translation failed'));
					this.loading.set(false);
				},
			});
	}

	clear(): void {
		const fmt = this.form.controls.language_format.value;
		this.form.reset({
			source_language: fmt === 'native' ? '' : 'en',
			target_language: fmt === 'native' ? '' : 'uk',
			language_format: fmt,
		});
		this.result.set(null);
		this.error.set(null);
	}

	copy(text: string): void {
		navigator.clipboard.writeText(text);
	}

	download(): void {
		const blob = new Blob([this.prettyResult()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'translated.json';
		a.click();
		URL.revokeObjectURL(url);
	}
}
