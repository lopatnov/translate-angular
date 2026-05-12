import { type ErrorHandler, Injectable, inject } from '@angular/core';
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

    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = 'An unexpected error occurred.';
    }

    this.appError.set(message);
  }
}
