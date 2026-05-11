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
	templateUrl: './text-translation.component.html',
	styleUrl: './text-translation.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
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
