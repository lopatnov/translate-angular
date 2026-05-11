import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	type TranscribeResponse,
	TranslateApiService,
} from '../../core/services/translate-api.service';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { useLangFormat } from '../../core/utils/lang-format.util';
import { LANGUAGE_FORMATS, LANGUAGES } from '../../core/utils/languages';

@Component({
	selector: 'app-speech-to-text',
	imports: [ReactiveFormsModule],
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

	private readonly _lf = useLangFormat(
		this.form.controls.language_format,
		this.destroyRef,
		(native) => {
			const ctrl = this.form.controls.language;
			native
				? ctrl.setValidators([Validators.required])
				: ctrl.clearValidators();
			ctrl.updateValueAndValidity({ emitEvent: false });
			this.form.patchValue(
				{ language: native ? '' : 'auto' },
				{ emitEvent: false },
			);
		},
	);
	protected readonly isNative = this._lf.isNative;

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
