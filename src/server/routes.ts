import { status as GrpcStatus } from '@grpc/grpc-js';
import type {
  DetectRequest,
  LocalizeRequest,
  SynthesizeRequest,
  TranscribeRequest,
  TranslateAudioRequest,
  TranslateRequest,
} from '@shared/api.types';
import { Router } from 'express';
import {
  detectLanguage,
  getCapabilities,
  grpcUrl,
  synthesizeSpeech,
  transcribeAudio,
  translateAudio,
  translateLocalization,
  translateText,
} from './grpc-client';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Map gRPC status codes to appropriate HTTP status codes. */
function grpcErrorToHttpStatus(err: unknown): number {
  if (err && typeof err === 'object' && 'code' in err) {
    switch ((err as { code: number }).code) {
      case GrpcStatus.INVALID_ARGUMENT:
        return 400;
      case GrpcStatus.UNAUTHENTICATED:
        return 401;
      case GrpcStatus.PERMISSION_DENIED:
        return 403;
      case GrpcStatus.NOT_FOUND:
        return 404;
      case GrpcStatus.UNAVAILABLE:
      case GrpcStatus.DEADLINE_EXCEEDED:
        return 503;
      default:
        return 500;
    }
  }
  return 500;
}

/**
 * Creates an Express Router with all /api/* proxy routes to the gRPC service.
 * Mount with: app.use('/api', createApiRouter())
 */
export function createApiRouter(): Router {
  const router = Router();

  router.get('/capabilities', async (_req, res) => {
    try {
      res.json(await getCapabilities());
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.get('/grpc-url', (_req, res) => {
    res.json({ url: grpcUrl() });
  });

  router.post('/translate', async (req, res) => {
    const {
      text,
      source_language,
      target_language,
      model,
      context,
      language_format,
    } = req.body as TranslateRequest;
    if (!text || !target_language) {
      res.status(400).json({ error: 'text and target_language are required' });
      return;
    }
    try {
      res.json(
        await translateText({
          text,
          sourceLanguage: source_language ?? '',
          targetLanguage: target_language,
          model: model ?? '',
          context: context ?? '',
          languageFormat: language_format ?? 'bcp47',
        }),
      );
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.post('/detect', async (req, res) => {
    const { text, language_format } = req.body as DetectRequest;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    try {
      res.json(
        await detectLanguage({
          text,
          languageFormat: language_format ?? 'bcp47',
        }),
      );
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.post('/localize', async (req, res) => {
    const {
      json,
      source_language,
      target_language,
      model,
      existing_translation,
      language_format,
    } = req.body as LocalizeRequest;
    if (!json || !target_language) {
      res.status(400).json({ error: 'json and target_language are required' });
      return;
    }
    try {
      res.json(
        await translateLocalization({
          json,
          sourceLanguage: source_language ?? '',
          targetLanguage: target_language,
          model: model ?? '',
          existingTranslation: existing_translation ?? '',
          context: '',
          languageFormat: language_format ?? 'bcp47',
        }),
      );
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.post('/transcribe', async (req, res) => {
    const { audio_data_base64, language, language_format } =
      req.body as TranscribeRequest;
    if (!audio_data_base64) {
      res.status(400).json({ error: 'audio_data_base64 is required' });
      return;
    }
    try {
      // Type guard + base64 validation inside try so TypeError from
      // non-string values is caught and returned as a consistent JSON error.
      if (typeof audio_data_base64 !== 'string') {
        res.status(400).json({ error: 'audio_data_base64 must be a string' });
        return;
      }
      const buf = Buffer.from(audio_data_base64, 'base64');
      if (buf.toString('base64') !== audio_data_base64.replace(/\s+/g, '')) {
        res
          .status(400)
          .json({ error: 'audio_data_base64 is not valid base64' });
        return;
      }
      res.json(
        await transcribeAudio({
          audioData: buf,
          language: language ?? 'auto',
          audioFormat: '',
          languageFormat: language_format ?? 'bcp47',
        }),
      );
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.post('/translate-audio', async (req, res) => {
    const {
      audio_data_base64,
      source_language,
      target_language,
      target_voice,
      language_format,
      model,
    } = req.body as TranslateAudioRequest;
    if (!audio_data_base64 || !target_language) {
      res
        .status(400)
        .json({ error: 'audio_data_base64 and target_language are required' });
      return;
    }
    try {
      if (typeof audio_data_base64 !== 'string') {
        res.status(400).json({ error: 'audio_data_base64 must be a string' });
        return;
      }
      const buf = Buffer.from(audio_data_base64, 'base64');
      const result = await translateAudio({
        audioData: buf,
        sourceLanguage: source_language ?? 'auto',
        targetLanguage: target_language,
        audioFormat: '',
        targetVoice: target_voice ?? '',
        languageFormat: language_format ?? 'bcp47',
      });
      res.json({
        transcription: result.transcription,
        translated_text: result.translatedText,
        audio_data_base64: Buffer.from(result.translatedAudio).toString(
          'base64',
        ),
        sample_rate: result.sampleRate,
      });
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  router.post('/synthesize', async (req, res) => {
    const { text, language, voice, speed, language_format } =
      req.body as SynthesizeRequest;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    try {
      const result = await synthesizeSpeech({
        text,
        language: language ?? '',
        voice: voice ?? '',
        speed: speed ?? 1,
        languageFormat: language_format ?? 'bcp47',
      });
      const audio_data_base64 = Buffer.from(result.audioData).toString(
        'base64',
      );
      res.json({ audio_data_base64, sample_rate: result.sampleRate });
    } catch (err) {
      res.status(grpcErrorToHttpStatus(err)).json({ error: errorMessage(err) });
    }
  });

  return router;
}
