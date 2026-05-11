import type { HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

/**
 * HTTP status codes that indicate a transient server/infrastructure problem
 * and are worth retrying once after a short delay.
 *
 *   502 Bad Gateway     — Express received an error from the gRPC service
 *   503 Service Unavail — gRPC service temporarily unavailable
 *   504 Gateway Timeout — gRPC call exceeded the server-side timeout
 */
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/**
 * Retries transient 5xx errors once after 2 seconds.
 * Client errors (4xx) and other failures are re-thrown immediately.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
	next(req).pipe(
		retry({
			count: 1,
			delay: (error: { status: number }) =>
				RETRYABLE_STATUSES.has(error.status)
					? timer(2_000)
					: throwError(() => error),
		}),
	);
