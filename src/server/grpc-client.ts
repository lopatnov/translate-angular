import type { CallOptions } from '@grpc/grpc-js';
import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import type {
  DetectLanguageRequest,
  DetectLanguageResponse,
  GetCapabilitiesRequest,
  GetCapabilitiesResponse,
  TranslateServiceClient as ITranslateServiceClient,
  SynthesizeSpeechRequest,
  SynthesizeSpeechResponse,
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  TranslateAudioRequest,
  TranslateAudioResponse,
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

/** Default deadline for fast unary gRPC calls (30 seconds). */
const DEADLINE_MS = 30_000;

/**
 * Per-operation deadline for TranslateText — CPU inference can take 20-60 s
 * on large models; additionally, the SemaphoreSlim in M2M100/NLLB serialises
 * concurrent requests so the second request must wait for the first.
 * Override with TRANSLATE_DEADLINE_MS env var (milliseconds).
 */
const _rawTranslateDeadline = Number(process.env['TRANSLATE_DEADLINE_MS']);
export const TRANSLATE_DEADLINE_MS =
  Number.isFinite(_rawTranslateDeadline) && _rawTranslateDeadline > 0
    ? _rawTranslateDeadline
    : 120_000;

/**
 * Per-operation deadline for TranscribeAudio — audio processing takes longer.
 * Override with TRANSCRIBE_DEADLINE_MS env var (milliseconds).
 */
const _rawTranscribeDeadline = Number(process.env['TRANSCRIBE_DEADLINE_MS']);
export const TRANSCRIBE_DEADLINE_MS =
  Number.isFinite(_rawTranscribeDeadline) && _rawTranscribeDeadline > 0
    ? _rawTranscribeDeadline
    : 120_000;

let _client: ITranslateServiceClient | null = null;

function getClient(): ITranslateServiceClient {
  if (_client) return _client;
  _client = new TranslateServiceClient(
    GRPC_URL,
    ChannelCredentials.createInsecure(),
  );
  return _client;
}

/** Promisify a unary gRPC call with a configurable deadline. */
function call<Req, Res>(
  method: (
    req: Req,
    meta: Metadata,
    options: Partial<CallOptions>,
    cb: (err: Error | null, res: Res) => void,
  ) => unknown,
  request: Req,
  deadlineMs = DEADLINE_MS,
): Promise<Res> {
  const options: Partial<CallOptions> = {
    deadline: new Date(Date.now() + deadlineMs),
  };
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

export function translateText(
  req: TranslateTextRequest,
): Promise<TranslateTextResponse> {
  // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
  return call(getClient().translateText.bind(getClient()) as any, req, TRANSLATE_DEADLINE_MS);
}

export function detectLanguage(
  req: DetectLanguageRequest,
): Promise<DetectLanguageResponse> {
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
  return call(
    // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
    getClient().transcribeAudio.bind(getClient()) as any,
    req,
    TRANSCRIBE_DEADLINE_MS,
  );
}

export function translateAudio(
  req: TranslateAudioRequest,
): Promise<TranslateAudioResponse> {
  // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
  return call(getClient().translateAudio.bind(getClient()) as any, req, TRANSCRIBE_DEADLINE_MS);
}

export function synthesizeSpeech(
  req: SynthesizeSpeechRequest,
): Promise<SynthesizeSpeechResponse> {
  // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
  return call(getClient().synthesizeSpeech.bind(getClient()) as any, req);
}

export function grpcUrl(): string {
  return GRPC_URL;
}
