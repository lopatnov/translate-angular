import { ChannelCredentials } from '@grpc/grpc-js';
import type {
	DetectLanguageRequest,
	DetectLanguageResponse,
	GetCapabilitiesRequest,
	GetCapabilitiesResponse,
	TranslateServiceClient as ITranslateServiceClient,
	TranscribeAudioRequest,
	TranscribeAudioResponse,
	TranslateLocalizationRequest,
	TranslateLocalizationResponse,
	TranslateTextRequest,
	TranslateTextResponse,
} from './generated/translate';
import { TranslateServiceClient } from './generated/translate';

// Both this file and the generated translate.ts import @grpc/grpc-js via ESM.
// Using a plain ESM import (not createRequire) ensures a single module instance
// so that `credentials instanceof ChannelCredentials` inside the generated
// TranslateServiceClient constructor succeeds.

const GRPC_URL = process.env['TRANSLATE_GRPC_URL'] ?? 'localhost:5100';

let _client: ITranslateServiceClient | null = null;

function getClient(): ITranslateServiceClient {
	if (_client) return _client;
	_client = new TranslateServiceClient(
		GRPC_URL,
		ChannelCredentials.createInsecure(),
	);
	return _client;
}

/** Promisify a single unary gRPC call. */
function call<Req, Res>(
	method: (req: Req, cb: (err: Error | null, res: Res) => void) => unknown,
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
