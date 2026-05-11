import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import type { CallOptions } from '@grpc/grpc-js';
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

// Both this file and the generated translate.ts import @grpc/grpc-js via ESM.
// Using a plain ESM import (not createRequire) ensures a single module instance
// so that `credentials instanceof ChannelCredentials` inside the generated
// TranslateServiceClient constructor succeeds.

const GRPC_URL = process.env['TRANSLATE_GRPC_URL'] ?? 'localhost:5100';

/** Default deadline for all unary gRPC calls (30 seconds). */
const DEADLINE_MS = 30_000;

let _client: ITranslateServiceClient | null = null;

function getClient(): ITranslateServiceClient {
	if (_client) return _client;
	_client = new TranslateServiceClient(GRPC_URL, ChannelCredentials.createInsecure());
	return _client;
}

/** Promisify a unary gRPC call with a default deadline. */
function call<Req, Res>(
	method: (
		req: Req,
		meta: Metadata,
		options: Partial<CallOptions>,
		cb: (err: Error | null, res: Res) => void,
	) => unknown,
	request: Req,
): Promise<Res> {
	const options: Partial<CallOptions> = { deadline: new Date(Date.now() + DEADLINE_MS) };
	return new Promise<Res>((resolve, reject) =>
		method.call(getClient(), request, new Metadata(), options, (err, res) =>
			err ? reject(err) : resolve(res),
		),
	);
}

export function getCapabilities(
	req: GetCapabilitiesRequest = {},
): Promise<GetCapabilitiesResponse> {
	// biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
	return call(getClient().getCapabilities.bind(getClient()) as any, req);
}

export function translateText(req: TranslateTextRequest): Promise<TranslateTextResponse> {
	// biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
	return call(getClient().translateText.bind(getClient()) as any, req);
}

export function detectLanguage(req: DetectLanguageRequest): Promise<DetectLanguageResponse> {
	// biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
	return call(getClient().detectLanguage.bind(getClient()) as any, req);
}

export function translateLocalization(
	req: TranslateLocalizationRequest,
): Promise<TranslateLocalizationResponse> {
	// biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
	return call(getClient().translateLocalization.bind(getClient()) as any, req);
}

export function transcribeAudio(
	req: TranscribeAudioRequest,
): Promise<TranscribeAudioResponse> {
	// biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
	return call(getClient().transcribeAudio.bind(getClient()) as any, req);
}

export function grpcUrl(): string {
	return GRPC_URL;
}
