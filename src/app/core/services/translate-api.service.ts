import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

// ---------------------------------------------------------------------------
// Types — field names match the ts-proto generated camelCase interfaces.
// ---------------------------------------------------------------------------

export interface CapabilitiesResponse {
	availableModels: string[];
	availableVoices: string[];
	sttAvailable: boolean;
	ttsAvailable: boolean;
}

export interface TranslateRequest {
	text: string;
	source_language?: string;
	target_language: string;
	model?: string;
	language_format?: string;
}

export interface TranslateResponse {
	translatedText: string;
	detectedLanguage?: string;
	modelUsed: string;
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
	stringsTranslated: number;
}

export interface TranscribeRequest {
	audio_data_base64: string;
	language?: string;
	language_format?: string;
}

export interface TranscriptionSegment {
	text: string;
	startTime: number;
	endTime: number;
}

export interface TranscribeResponse {
	fullText: string;
	detectedLanguage?: string;
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
