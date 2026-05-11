import { join } from 'node:path';
import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { grpcCall, grpcUrl } from './grpc-client';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '52mb' }));

// ---------------------------------------------------------------------------
// gRPC proxy API routes
// ---------------------------------------------------------------------------

app.get('/api/capabilities', async (_req, res) => {
	try {
		const result = await grpcCall('GetCapabilities', {});
		res.json(result);
	} catch (err) {
		res.status(502).json({ error: errorMessage(err) });
	}
});

app.get('/api/grpc-url', (_req, res) => {
	res.json({ url: grpcUrl() });
});

app.post('/api/translate', async (req, res) => {
	try {
		const result = await grpcCall('TranslateText', req.body);
		res.json(result);
	} catch (err) {
		res.status(502).json({ error: errorMessage(err) });
	}
});

app.post('/api/detect', async (req, res) => {
	try {
		const result = await grpcCall('DetectLanguage', req.body);
		res.json(result);
	} catch (err) {
		res.status(502).json({ error: errorMessage(err) });
	}
});

app.post('/api/localize', async (req, res) => {
	try {
		const result = await grpcCall('TranslateLocalization', req.body);
		res.json(result);
	} catch (err) {
		res.status(502).json({ error: errorMessage(err) });
	}
});

app.post('/api/transcribe', async (req, res) => {
	try {
		const { audio_data_base64, language, language_format } = req.body as {
			audio_data_base64: string;
			language?: string;
			language_format?: string;
		};
		const audioBuffer = Buffer.from(audio_data_base64, 'base64');
		const result = await grpcCall('TranscribeAudio', {
			audio_data: audioBuffer,
			language: language ?? 'auto',
			language_format: language_format ?? 'bcp47',
		});
		res.json(result);
	} catch (err) {
		res.status(502).json({ error: errorMessage(err) });
	}
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
app.use(
	express.static(browserDistFolder, {
		maxAge: '1y',
		index: false,
		redirect: false,
	}),
);

// ---------------------------------------------------------------------------
// Angular SSR handler
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then((response) =>
			response ? writeResponseToNodeResponse(response, res) : next(),
		)
		.catch(next);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
if (isMainModule(import.meta.url) || process.env['pm_id']) {
	const port = process.env['PORT'] || 4000;
	app.listen(port, (error) => {
		if (error) throw error;
		console.log(`Node Express server listening on http://localhost:${port}`);
		console.log(`gRPC service: ${grpcUrl()}`);
	});
}

export const reqHandler = createNodeRequestHandler(app);

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}
