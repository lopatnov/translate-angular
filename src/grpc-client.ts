import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = join(__dirname, 'protos', 'translate.proto');
const GRPC_URL = process.env['TRANSLATE_GRPC_URL'] ?? 'localhost:5100';

// biome-ignore lint/suspicious/noExplicitAny: gRPC generated types are untyped
let _client: any = null;

// biome-ignore lint/suspicious/noExplicitAny: gRPC generated types are untyped
function getClient(): any {
	if (_client) return _client;

	const packageDef = protoLoader.loadSync(PROTO_PATH, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
	});

	// biome-ignore lint/suspicious/noExplicitAny: dynamic gRPC package definition
	const pkg = grpc.loadPackageDefinition(packageDef) as any;
	_client = new pkg.lopatnov.translate.v1.TranslateService(
		GRPC_URL,
		grpc.credentials.createInsecure(),
	);
	return _client;
}

export function grpcCall<T>(method: string, request: unknown): Promise<T> {
	return new Promise((resolve, reject) =>
		getClient()[method](request, (err: Error | null, response: T) =>
			err ? reject(err) : resolve(response),
		),
	);
}

export function grpcUrl(): string {
	return GRPC_URL;
}
