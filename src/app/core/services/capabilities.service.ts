import { computed, Injectable, inject, signal } from '@angular/core';
import { TranslateApiService } from '@core/services/translate-api.service';
import { apiErrorMessage } from '@core/utils/api-error.util';

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
 * Singleton service that fetches GetCapabilities and exposes the result
 * as computed signals. Call refresh() to re-fetch (e.g. after a gRPC error).
 */
@Injectable({ providedIn: 'root' })
export class CapabilitiesService {
  private readonly api = inject(TranslateApiService);
  private readonly _state = signal<CapsState>(LOADING);

  readonly isLoading = computed(() => !this._state().loaded);
  readonly error = computed(() => this._state().error);
  readonly availableModels = computed(() => this._state().availableModels);
  readonly availableVoices = computed(() => this._state().availableVoices);
  readonly sttAvailable = computed(() => this._state().sttAvailable);
  readonly ttsAvailable = computed(() => this._state().ttsAvailable);

  constructor() {
    this.load();
  }

  /** Re-fetch capabilities — useful when the gRPC service was unavailable on startup. */
  refresh(): void {
    this.load();
  }

  private load(): void {
    this._state.set(LOADING);
    this.api.getCapabilities().subscribe({
      next: (caps) =>
        this._state.set({
          loaded: true,
          availableModels: caps.availableModels,
          availableVoices: caps.availableVoices,
          sttAvailable: caps.sttAvailable,
          ttsAvailable: caps.ttsAvailable,
          error: null,
        }),
      error: (err) =>
        this._state.set({
          ...LOADING,
          loaded: true,
          error: apiErrorMessage(err, 'Cannot reach gRPC service.'),
        }),
    });
  }
}
