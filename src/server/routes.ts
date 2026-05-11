import { Router } from 'express';
import type {
	LocalizeRequest,
	TranscribeRequest,
	TranslateRequest,
} from '../shared/api.types';
import {
	detectLanguage,
	getCapabilities,
	grpcUrl,
	transcribeAudio,
	translateLocalization,
	translateText,
} from './grpc-client';

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
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
			res.status(502).json({ error: errorMessage(err) });
		}
	});

	router.get('/grpc-url', (_req, res) => {
		res.json({ url: grpcUrl() });
	});

	router.post('/translate', async (req, res) => {
		try {
			const { text, source_language, target_language, model, language_format } =
				req.body as TranslateRequest;
			res.json(
				await translateText({
					text,
					sourceLanguage: source_language ?? '',
					targetLanguage: target_language ?? '',
					model: model ?? '',
					context: '',
					languageFormat: language_format ?? 'bcp47',
				}),
			);
		} catch (err) {
			res.status(502).json({ error: errorMessage(err) });
		}
	});

	router.post('/detect', async (req, res) => {
		try {
			const { text, language_format } = req.body as { text: string; language_format?: string };
			res.json(
				await detectLanguage({ text, languageFormat: language_format ?? 'bcp47' }),
			);
		} catch (err) {
			res.status(502).json({ error: errorMessage(err) });
		}
	});

	router.post('/localize', async (req, res) => {
		try {
			const {
				json,
				source_language,
				target_language,
				model,
				existing_translation,
				language_format,
			} = req.body as LocalizeRequest;
			res.json(
				await translateLocalization({
					json,
					sourceLanguage: source_language ?? '',
					targetLanguage: target_language ?? '',
					model: model ?? '',
					existingTranslation: existing_translation ?? '',
					context: '',
					languageFormat: language_format ?? 'bcp47',
				}),
			);
		} catch (err) {
			res.status(502).json({ error: errorMessage(err) });
		}
	});

	router.post('/transcribe', async (req, res) => {
		try {
			const { audio_data_base64, language, language_format } =
				req.body as TranscribeRequest;
			res.json(
				await transcribeAudio({
					audioData: Buffer.from(audio_data_base64, 'base64'),
					language: language ?? 'auto',
					audioFormat: '',
					languageFormat: language_format ?? 'bcp47',
				}),
			);
		} catch (err) {
			res.status(502).json({ error: errorMessage(err) });
		}
	});

	return router;
}
