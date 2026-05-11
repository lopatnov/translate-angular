import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Consistent page heading used by every feature page.
 *
 * Usage:
 * ```html
 * <app-page-header
 *   title="Text translation"
 *   subtitle="Translate text between any two supported languages." />
 * ```
 */
@Component({
	selector: 'app-page-header',
	templateUrl: './page-header.component.html',
	styleUrl: './page-header.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
	readonly title = input.required<string>();
	readonly subtitle = input.required<string>();
}
