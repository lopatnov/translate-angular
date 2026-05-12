import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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
