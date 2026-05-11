import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { LANGUAGES } from '@core/utils/languages';

/**
 * Searchable language input backed by a <datalist>.
 * Users can type a BCP-47 code (e.g. "uk") or a language name
 * (e.g. "Ukrainian") — the browser filters suggestions automatically.
 * The selected value stored in the FormControl is always the BCP-47 code.
 *
 * Usage:
 * ```html
 * <app-language-select
 *   inputId="src-lang"
 *   [control]="form.controls.source_language"
 *   [includeAuto]="true" />
 * ```
 */
@Component({
	selector: 'app-language-select',
	imports: [ReactiveFormsModule],
	templateUrl: './language-select.component.html',
	styleUrl: './language-select.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectComponent {
	readonly inputId = input.required<string>();
	readonly control = input.required<FormControl<string | null>>();
	/** When true, prepends an "auto" option for auto-detection. */
	readonly includeAuto = input(false);

	protected readonly languages = LANGUAGES;
}
