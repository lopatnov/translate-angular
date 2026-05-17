import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  CapabilitiesResponse,
  DetectRequest,
  DetectResponse,
  LocalizeRequest,
  LocalizeResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  TranscribeRequest,
  TranscribeResponse,
  TranslateAudioRequest,
  TranslateAudioResponse,
  TranslateRequest,
  TranslateResponse,
} from '@shared/api.types';
import { Observable, switchMap } from 'rxjs';

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

  synthesize(req: SynthesizeRequest): Observable<SynthesizeResponse> {
    return this.http.post<SynthesizeResponse>('/api/synthesize', req);
  }

  /**
   * Read a WAV file, encode as base64, and POST to /api/translate-audio.
   * Returns transcription + translated text + synthesized WAV as base64.
   */
  translateAudio(
    file: File,
    targetLanguage: string,
    sourceLanguage = 'auto',
    targetVoice = '',
    languageFormat = 'bcp47',
  ): Observable<TranslateAudioResponse> {
    return new Observable<string>((observer) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        observer.next(base64);
        observer.complete();
      };
      reader.onerror = () => {
        observer.error(reader.error ?? new Error('Failed to read audio file'));
      };
      reader.readAsDataURL(file);
      return () => reader.abort();
    }).pipe(
      switchMap((audio_data_base64) => {
        const req: TranslateAudioRequest = {
          audio_data_base64,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          target_voice: targetVoice || undefined,
          language_format: languageFormat,
        };
        return this.http.post<TranslateAudioResponse>(
          '/api/translate-audio',
          req,
        );
      }),
    );
  }

  /**
   * Read a WAV File via FileReader (native browser API — non-blocking),
   * encode it as base64, and POST to /api/transcribe.
   */
  transcribe(
    file: File,
    language = 'auto',
    languageFormat = 'bcp47',
  ): Observable<TranscribeResponse> {
    return new Observable<string>((observer) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Strip the "data:<mime>;base64," prefix to get the raw base64 string.
        const base64 = dataUrl.split(',')[1];
        observer.next(base64);
        observer.complete();
      };
      reader.onerror = () => {
        observer.error(reader.error ?? new Error('Failed to read audio file'));
      };
      reader.readAsDataURL(file);
      // Abort the read if the consumer unsubscribes (e.g. navigation away).
      return () => reader.abort();
    }).pipe(
      switchMap((audio_data_base64) => {
        const req: TranscribeRequest = {
          audio_data_base64,
          language,
          language_format: languageFormat,
        };
        return this.http.post<TranscribeResponse>('/api/transcribe', req);
      }),
    );
  }
}
