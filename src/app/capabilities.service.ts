import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of } from 'rxjs';
import { apiErrorMessage } from './api-error.util';
import { TranslateApiService } from './translate-api.service';

interface CapsState {
	readonly loaded: boolean;
	readonly availableModels: string[];
	readonly availableVoices: string[];
	readonly sttAvailable: boolean;
	readonly ttsAvailable: boolean;
	readonly error: string | null;
}

const LOADING: CapsState = {
	loaded: false,
	availableModels: [],
	availableVoices: [],
	sttAvailable: false,
	ttsAvailable: false,
	error: null,
};

/**
 * Singleton service that fetches GetCapabilities once and exposes the
 * result as computed signals. All components share a single HTTP request.
 */
@Injectable({ providedIn: 'root' })
export class CapabilitiesService {
	private readonly api = inject(TranslateApiService);

	private readonly state = toSignal(
		this.api.getCapabilities().pipe(
			map(
				(caps): CapsState => ({
					loaded: true,
					availableModels: caps.availableModels,
					availableVoices: caps.availableVoices,
					sttAvailable: caps.sttAvailable,
					ttsAvailable: caps.ttsAvailable,
					error: null,
				}),
			),
			catchError((err): Observable<CapsState> =>
				of({
					...LOADING,
					loaded: true,
					error: apiErrorMessage(err, 'Cannot reach gRPC service.'),
				}),
			),
		),
		{ initialValue: LOADING },
	);

	readonly isLoading = computed(() => !this.state().loaded);
	readonly error = computed(() => this.state().error);
	readonly availableModels = computed(() => this.state().availableModels);
	readonly availableVoices = computed(() => this.state().availableVoices);
	readonly sttAvailable = computed(() => this.state().sttAvailable);
	readonly ttsAvailable = computed(() => this.state().ttsAvailable);
}
