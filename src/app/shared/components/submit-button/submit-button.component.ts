import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Primary submit button with a Bootstrap spinner for loading state.
 * Renders as type="submit" — works inside any parent <form>.
 *
 * Usage:
 * ```html
 * <app-submit-button
 *   [disabled]="form.invalid"
 *   [loading]="loading()"
 *   label="Translate"
 *   loadingLabel="Translating…" />
 * ```
 */
@Component({
  selector: 'app-submit-button',
  templateUrl: './submit-button.component.html',
  styleUrl: './submit-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitButtonComponent {
  /** Disables the button regardless of loading state (e.g. form.invalid). */
  readonly disabled = input(false);
  /** Shows a spinner and replaces the label with loadingLabel. */
  readonly loading = input.required<boolean>();
  /** Button label in idle state. */
  readonly label = input.required<string>();
  /** Button label while loading. Defaults to label + "…" */
  readonly loadingLabel = input<string>('');
}
