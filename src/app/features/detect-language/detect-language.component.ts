import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	type DetectResponse,
	TranslateApiService,
} from '../../core/services/translate-api.service';
import { apiErrorMessage } from '../../core/utils/api-error.util';
import { LANGUAGE_FORMATS } from '../../core/utils/languages';

@Component({
	selector: 'app-detect-language',
	imports: [ReactiveFormsModule],
	templateUrl: './detect-language.component.html',
	styleUrl: './detect-language.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetectLanguageComponent {
	private readonly api = inject(TranslateApiService);
	private readonly fb = inject(FormBuilder);

	protected readonly formats = LANGUAGE_FORMATS;
	protected readonly loading = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly result = signal<DetectResponse | null>(null);

	protected readonly form = this.fb.nonNullable.group({
		text: ['', Validators.required],
		language_format: ['bcp47'],
	});

	submit(): void {
		if (this.form.invalid) return;
		this.loading.set(true);
		this.error.set(null);
		this.result.set(null);

		this.api.detect(this.form.getRawValue()).subscribe({
			next: (data) => {
				this.result.set(data);
				this.loading.set(false);
			},
			error: (err) => {
				this.error.set(apiErrorMessage(err, 'Detection failed'));
				this.loading.set(false);
			},
		});
	}

	clear(): void {
		this.form.reset({ language_format: 'bcp47' });
		this.result.set(null);
		this.error.set(null);
	}
}
