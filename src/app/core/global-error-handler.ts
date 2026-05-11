import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AppErrorService } from '@core/services/app-error.service';

/**
 * Replaces Angular's default ErrorHandler.
 * Catches unhandled errors (lifecycle hooks, template expressions,
 * uncaught Promise rejections surfaced by Angular) and stores them
 * in AppErrorService so the shell can display a global error banner.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
	private readonly appError = inject(AppErrorService);

	handleError(error: unknown): void {
		// Always log to console — preserves stack trace for debugging.
		console.error('[Uncaught error]', error);

		const message =
			error instanceof Error
				? error.message
				: typeof error === 'string'
					? error
					: 'An unexpected error occurred.';

		this.appError.set(message);
	}
}
