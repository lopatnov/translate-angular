import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { TranscribeResponse } from '@shared/api.types';
import { TranslateApiService } from '@core/services/translate-api.service';
import { apiErrorMessage } from '@core/utils/api-error.util';
import { useLangFormat } from '@core/utils/lang-format.util';
import { LANGUAGE_FORMATS, LANGUAGES } from '@core/utils/languages';
import { CopyButtonComponent } from '@app/shared/components/copy-button/copy-button.component';
import { ErrorAlertComponent } from '@app/shared/components/error-alert/error-alert.component';
import { LanguageSelectComponent } from '@app/shared/components/language-select/language-select.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { SubmitButtonComponent } from '@app/shared/components/submit-button/submit-button.component';

@Component({
	selector: 'app-speech-to-text',
	imports: [ReactiveFormsModule, LanguageSelectComponent, SubmitButtonComponent, ErrorAlertComponent, PageHeaderComponent, CopyButtonComponent],
	templateUrl: './speech-to-text.component.html',
	styleUrl: './speech-to-text.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechToTextComponent {
	private readonly api = inject(TranslateApiService);
	private readonly fb = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly languages = LANGUAGES;
	protected readonly formats = LANGUAGE_FORMATS;
	protected readonly loading = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly result = signal<TranscribeResponse | null>(null);
	protected readonly selectedFile = signal<File | null>(null);
	protected readonly form = this.fb.nonNullable.group({
		language: ['auto'],
		language_format: ['bcp47'],
	});

	protected readonly isNative = useLangFormat(
		this.form.controls.language_format,
		this.destroyRef,
		(native) => {
			const ctrl = this.form.controls.language;
			native ? ctrl.setValidators([Validators.required]) : ctrl.clearValidators();
			ctrl.updateValueAndValidity({ emitEvent: false });
			this.form.patchValue({ language: native ? '' : 'auto' }, { emitEvent: false });
		},
	);

	onFileChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.selectedFile.set(input.files?.[0] ?? null);
	}

	submit(): void {
		const file = this.selectedFile();
		if (!file || this.form.invalid) return;

		this.loading.set(true);
		this.error.set(null);
		this.result.set(null);

		const { language, language_format } = this.form.getRawValue();

		this.api.transcribe(file, language, language_format).subscribe({
			next: (data) => {
				this.result.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(apiErrorMessage(err, 'Transcription failed'));
				this.loading.set(false);
			},
		});
	}

	clear(): void {
		this.selectedFile.set(null);
		const fmt = this.form.controls.language_format.value;
		this.form.reset({ language: fmt === 'native' ? '' : 'auto', language_format: fmt });
		this.result.set(null);
		this.error.set(null);
	}

	formatTime(seconds: number): string {
		// Use integer tenths to avoid floating-point rollover (e.g. "1:60.0").
		const totalTenths = Math.round(seconds * 10);
		const m = Math.floor(totalTenths / 600);
		const s = ((totalTenths % 600) / 10).toFixed(1);
		return `${m}:${s.padStart(4, '0')}`;
	}
}
