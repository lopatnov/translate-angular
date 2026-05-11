import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Small "Copy to clipboard" button. Encapsulates the clipboard write logic
 * so feature components don't need their own copy() method.
 *
 * Usage:
 * ```html
 * <app-copy-button [text]="result()!.translatedText" />
 * <app-copy-button [text]="prettyResult()" label="Copy" />
 * ```
 */
@Component({
	selector: 'app-copy-button',
	templateUrl: './copy-button.component.html',
	styleUrl: './copy-button.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
	readonly text = input.required<string>();
	readonly label = input('Copy to clipboard');

	protected copy(): void {
		navigator.clipboard.writeText(this.text());
	}
}
