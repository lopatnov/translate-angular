import { createRequire } from 'node:module';
import type { ChannelCredentials } from '@grpc/grpc-js';
import type {
	DetectLanguageRequest,
	DetectLanguageResponse,
	GetCapabilitiesRequest,
	GetCapabilitiesResponse,
	TranscribeAudioRequest,
	TranscribeAudioResponse,
	TranslateLocalizationRequest,
	TranslateLocalizationResponse,
	TranslateServiceClient as ITranslateServiceClient,
	TranslateTextRequest,
	TranslateTextResponse,
} from './generated/translate';
import { TranslateServiceClient } from './generated/translate';

// CJS packages must be loaded via createRequire — ESM default imports
// from esbuild (Angular's build tool) do not correctly resolve CJS module.exports.
const require = createRequire(import.meta.url);
// biome-ignore lint/suspicious/noExplicitAny: CJS interop — credentials factory only
const grpc: { credentials: { createInsecure(): ChannelCredentials } } =
	require('@grpc/grpc-js');

const GRPC_URL = process.env['TRANSLATE_GRPC_URL'] ?? 'localhost:5100';

let _client: ITranslateServiceClient | null = null;

function getClient(): ITranslateServiceClient {
	if (_client) return _client;
	_client = new TranslateServiceClient(
		GRPC_URL,
		grpc.credentials.createInsecure(),
	);
	return _client;
}

/** Promisify a single unary gRPC call. */
function call<Req, Res>(
	method: (
		req: Req,
		cb: (err: Error | null, res: Res) => void,
	) => unknown,
	request: Req,
): Promise<Res> {
	return new Promise<Res>((resolve, reject) =>
		method.call(getClient(), request, (err: Error | null, res: Res) =>
			err ? reject(err) : resolve(res),
		),
	);
}

export function getCapabilities(
	req: GetCapabilitiesRequest = {},
): Promise<GetCapabilitiesResponse> {
	return call(getClient().getCapabilities.bind(getClient()), req);
}

export function translateText(
	req: TranslateTextRequest,
): Promise<TranslateTextResponse> {
	return call(getClient().translateText.bind(getClient()), req);
}

export function detectLanguage(
	req: DetectLanguageRequest,
): Promise<DetectLanguageResponse> {
	return call(getClient().detectLanguage.bind(getClient()), req);
}

export function translateLocalization(
	req: TranslateLocalizationRequest,
): Promise<TranslateLocalizationResponse> {
	return call(getClient().translateLocalization.bind(getClient()), req);
}

export function transcribeAudio(
	req: TranscribeAudioRequest,
): Promise<TranscribeAudioResponse> {
	return call(getClient().transcribeAudio.bind(getClient()), req);
}

export function grpcUrl(): string {
	return GRPC_URL;
}
