import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { LocalizeResponse } from '../../../shared/api.types';
import { CapabilitiesService } from '../../core/services/capabilities.service';
import { TranslateApiService } from '../../core/services/translate-api.service';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { useLangFormat } from '../../core/utils/lang-format.util';
import { LANGUAGE_FORMATS, LANGUAGES } from '../../core/utils/languages';

@Component({
	selector: 'app-locale-files',
	imports: [ReactiveFormsModule],
	templateUrl: './locale-files.component.html',
	styleUrl: './locale-files.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
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
	protected readonly form = this.fb.nonNullable.group({
		json: ['', Validators.required],
		source_language: ['en'],
		target_language: ['uk'],
		model: [''],
		existing_translation: [''],
		language_format: ['bcp47'],
	});

	protected readonly isNative = useLangFormat(
		this.form.controls.language_format,
		this.destroyRef,
		(native) => {
			const src = this.form.controls.source_language;
			const tgt = this.form.controls.target_language;
			native ? src.setValidators([Validators.required]) : src.clearValidators();
			native ? tgt.setValidators([Validators.required]) : tgt.clearValidators();
			src.updateValueAndValidity({ emitEvent: false });
			tgt.updateValueAndValidity({ emitEvent: false });
			this.form.patchValue(
				native
					? { source_language: '', target_language: '' }
					: { source_language: 'en', target_language: 'uk' },
				{ emitEvent: false },
			);
		},
	);

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

		const {
			json,
			source_language,
			target_language,
			model,
			existing_translation,
			language_format,
		} = this.form.getRawValue();

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
						this.prettyResult.set(
							JSON.stringify(JSON.parse(data.json), null, 2),
						);
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
