/**
 * Shared API types for Angular ↔ Express /api/* communication.
 * Imported by both the server (src/server/routes.ts) and the client
 * (src/app/core/services/translate-api.service.ts).
 *
 * Request field names use snake_case to match the HTTP JSON body.
 * Response field names use camelCase to match ts-proto generated types.
 */

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
  context?: string;
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

export interface SynthesizeRequest {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
  language_format?: string;
}

export interface SynthesizeResponse {
  audio_data_base64: string;
  sample_rate: number;
}

export interface TranslateAudioRequest {
  audio_data_base64: string;
  source_language?: string;
  target_language: string;
  target_voice?: string;
  language_format?: string;
  model?: string;
}

export interface TranslateAudioResponse {
  transcription: string;
  translated_text: string;
  audio_data_base64: string;
  sample_rate: number;
}

export interface ApiError {
  error: string;
}
