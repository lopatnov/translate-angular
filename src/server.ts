import { join } from 'node:path';
import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { grpcUrl } from './server/grpc-client';
import { createApiRouter } from './server/routes';

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
app.use('/api', createApiRouter());

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
