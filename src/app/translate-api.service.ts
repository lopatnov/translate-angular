import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapabilitiesResponse {
	available_models: string[];
	available_voices: string[];
	stt_available: boolean;
	tts_available: boolean;
}

export interface TranslateRequest {
	text: string;
	source_language?: string;
	target_language: string;
	model?: string;
	context?: string;
	language_format?: string;
}

export interface TranslateResponse {
	translated_text: string;
	detected_language?: string;
	model_used: string;
}

export interface DetectRequest {
	text: string;
	language_format?: string;
}

export interface DetectResponse {
	language: string;
	probability: number;
}

export interface LocalizeRequest {
	json: string;
	source_language: string;
	target_language: string;
	model?: string;
	existing_translation?: string;
	language_format?: string;
}

export interface LocalizeResponse {
	json: string;
	strings_translated: number;
}

export interface TranscribeRequest {
	audio_data_base64: string;
	language?: string;
	language_format?: string;
}

export interface TranscriptionSegment {
	text: string;
	start_time: number;
	end_time: number;
}

export interface TranscribeResponse {
	full_text: string;
	detected_language?: string;
	segments: TranscriptionSegment[];
}

export interface ApiError {
	error: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class TranslateApiService {
	private readonly http = inject(HttpClient);

	getCapabilities(): Observable<CapabilitiesResponse> {
		return this.http.get<CapabilitiesResponse>('/api/capabilities');
	}

	getGrpcUrl(): Observable<{ url: string }> {
		return this.http.get<{ url: string }>('/api/grpc-url');
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

	async transcribe(
		file: File,
		language = 'auto',
		languageFormat = 'bcp47',
	): Promise<Observable<TranscribeResponse>> {
		const arrayBuffer = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);
		let binary = '';
		for (const byte of bytes) binary += String.fromCharCode(byte);
		const audio_data_base64 = btoa(binary);

		const req: TranscribeRequest = {
			audio_data_base64,
			language,
			language_format: languageFormat,
		};
		return this.http.post<TranscribeResponse>('/api/transcribe', req);
	}
}
