import { Injectable, signal } from '@angular/core';

/**
 * Stores the last uncaught application-level error so the shell
 * can display a global dismissible banner.
 * Populated by GlobalErrorHandler; cleared when the user dismisses.
 */
@Injectable({ providedIn: 'root' })
export class AppErrorService {
	private readonly _message = signal<string | null>(null);

	/** Last uncaught error message, or null when none. */
	readonly message = this._message.asReadonly();

	set(message: string): void {
		this._message.set(message);
	}

	clear(): void {
		this._message.set(null);
	}
}
