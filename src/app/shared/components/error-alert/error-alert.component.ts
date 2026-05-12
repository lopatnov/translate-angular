import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Dismissible danger alert for API / form errors.
 * Renders nothing when message is null.
 *
 * Usage:
 * ```html
 * <app-error-alert [message]="error()" />
 * ```
 */
@Component({
  selector: 'app-error-alert',
  templateUrl: './error-alert.component.html',
  styleUrl: './error-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorAlertComponent {
  readonly message = input<string | null>(null);
}
