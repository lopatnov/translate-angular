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

/** Default deadline for fast calls that don't involve ML inference (ms). */
const FAST_DEADLINE_MS = 30_000;

/** Parse an optional numeric env var; returns undefined when not set or invalid. */
function parseOptionalMs(name: string): number | undefined {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

/**
 * Deadline for TranslateText / TranslateAudio (text translation step).
 * Mirrors TRANSLATE_TIMEOUT_MS on the gRPC service — set both to the same
 * value so client deadline and server inference timeout are in sync.
 * Unset = no deadline.
 */
export const TRANSLATE_TIMEOUT_MS = parseOptionalMs('TRANSLATE_TIMEOUT_MS');

/**
 * Deadline for TranslateLocalization (whole JSON file, many strings).
 * Unset = no deadline — recommended because file size is unpredictable.
 */
export const LOCALIZE_TIMEOUT_MS = parseOptionalMs('LOCALIZE_TIMEOUT_MS');

/**
 * Deadline for TranscribeAudio / TranslateAudio (Whisper STT step).
 * Override with TRANSCRIBE_TIMEOUT_MS env var (milliseconds).
 * Unset = no deadline.
 */
export const TRANSCRIBE_TIMEOUT_MS = parseOptionalMs('TRANSCRIBE_TIMEOUT_MS');

let _client: ITranslateServiceClient | null = null;

function getClient(): ITranslateServiceClient {
  if (_client) return _client;
  _client = new TranslateServiceClient(
    GRPC_URL,
    ChannelCredentials.createInsecure(),
  );
  return _client;
}

/** Promisify a unary gRPC call with an optional deadline. */
function call<Req, Res>(
  method: (
    req: Req,
    meta: Metadata,
    options: Partial<CallOptions>,
    cb: (err: Error | null, res: Res) => void,
  ) => unknown,
  request: Req,
  deadlineMs?: number,
): Promise<Res> {
  const options: Partial<CallOptions> =
    deadlineMs !== undefined
      ? { deadline: new Date(Date.now() + deadlineMs) }
      : {};
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
  return call(
    // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
    getClient().translateText.bind(getClient()) as any,
    req,
    TRANSLATE_TIMEOUT_MS,
  );
}

export function detectLanguage(
  req: DetectLanguageRequest,
): Promise<DetectLanguageResponse> {
  // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
  return call(getClient().detectLanguage.bind(getClient()) as any, req, FAST_DEADLINE_MS);
}

export function translateLocalization(
  req: TranslateLocalizationRequest,
): Promise<TranslateLocalizationResponse> {
  return call(
    // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
    getClient().translateLocalization.bind(getClient()) as any,
    req,
    LOCALIZE_TIMEOUT_MS,
  );
}

export function transcribeAudio(
  req: TranscribeAudioRequest,
): Promise<TranscribeAudioResponse> {
  return call(
    // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
    getClient().transcribeAudio.bind(getClient()) as any,
    req,
    TRANSCRIBE_TIMEOUT_MS,
  );
}

export function translateAudio(
  req: TranslateAudioRequest,
): Promise<TranslateAudioResponse> {
  return call(
    // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
    getClient().translateAudio.bind(getClient()) as any,
    req,
    TRANSCRIBE_TIMEOUT_MS,
  );
}

export function synthesizeSpeech(
  req: SynthesizeSpeechRequest,
): Promise<SynthesizeSpeechResponse> {
  // biome-ignore lint/suspicious/noExplicitAny: grpc-js method overloads require cast
  return call(getClient().synthesizeSpeech.bind(getClient()) as any, req, FAST_DEADLINE_MS);
}

export function grpcUrl(): string {
  return GRPC_URL;
}
