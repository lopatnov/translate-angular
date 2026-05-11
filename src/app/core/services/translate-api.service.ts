import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, from, map, switchMap } from 'rxjs';
import type {
	CapabilitiesResponse,
	DetectRequest,
	DetectResponse,
	LocalizeRequest,
	LocalizeResponse,
	TranscribeRequest,
	TranscribeResponse,
	TranslateRequest,
	TranslateResponse,
} from './api.types';

@Injectable({ providedIn: 'root' })
export class TranslateApiService {
	private readonly http = inject(HttpClient);

	getCapabilities(): Observable<CapabilitiesResponse> {
		return this.http.get<CapabilitiesResponse>('/api/capabilities');
	}

	translate(req: TranslateRequest): Observable<TranslateResponse> {
		return this.http.post<TranslateResponse>('/api/translate', req);
	}

	detect(req: DetectRequest): Observable<DetectResponse> {
		return this.http.post<DetectResponse>('/api/detect', req);
	}

	localize(req: LocalizeRequest): Observable<LocalizeResponse> {
		return this.http.post<LocalizeResponse>('/api/localize', req);
	}

	/**
	 * Read a WAV File, encode it as base64, and POST to /api/transcribe.
	 * Returns an Observable — no need to await the caller.
	 */
	transcribe(file: File, language = 'auto', languageFormat = 'bcp47'): Observable<TranscribeResponse> {
		return from(file.arrayBuffer()).pipe(
			map((buffer) => {
				const bytes = new Uint8Array(buffer);
				let binary = '';
				for (const byte of bytes) binary += String.fromCharCode(byte);
				return btoa(binary);
			}),
			switchMap((audio_data_base64) => {
				const req: TranscribeRequest = { audio_data_base64, language, language_format: languageFormat };
				return this.http.post<TranscribeResponse>('/api/transcribe', req);
			}),
		);
	}
}
