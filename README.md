# Translate Studio

A manual testing UI for the [Lopatnov.Translate](https://github.com/lopatnov/translate) gRPC service. Built with **Angular 21 + SSR**, it lets you exercise every gRPC endpoint through a clean web interface without writing a single `grpcurl` command.

```
Browser → Angular (port 4200) → Express SSR → @grpc/grpc-js → gRPC service (port 5100)
```

---

## Pages

| Route | Purpose | gRPC RPC |
|---|---|---|
| `/` | Service status, available models | `GetCapabilities` |
| `/translate` | Text translation with auto-detect | `TranslateText` |
| `/detect` | Language detection + confidence | `DetectLanguage` |
| `/localize` | JSON i18n file translation | `TranslateLocalization` |
| `/transcribe` | WAV → transcript + segments | `TranscribeAudio` |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS+ | |
| npm | 11+ | |
| Angular CLI | 21 | `npm i -g @angular/cli` |
| buf CLI | 1.x | Required only to regenerate gRPC client after proto changes |
| Lopatnov.Translate | running | Default: `localhost:5100` |

---

## Getting started

```bash
git clone https://github.com/lopatnov/translate-angular.git
cd translate-angular
npm install

# Start the dev server (includes Angular SSR + gRPC proxy on port 4200)
npm start
```

Open **http://localhost:4200** — the Dashboard will show service status if the gRPC service is reachable.

To point at a different gRPC host:

```bash
TRANSLATE_GRPC_URL=my-server:5100 npm start
```

---

## npm scripts

| Script | Description |
|---|---|
| `npm start` | Dev server with HMR (port 4200) |
| `npm run build` | Production build → `dist/` |
| `npm run generate` | Regenerate gRPC client from `src/protos/translate.proto` via buf + ts-proto |
| `npm run lint` | Biome lint with auto-fix |
| `npm run format` | Biome format (write) |
| `npm run check` | Biome check — reports only, for CI |
| `npm run e2e` | Playwright end-to-end tests (headless) |
| `npm run e2e:ui` | Playwright with interactive UI |
| `npm run debug:ssr` | Start built SSR server with Node inspector on port 9229 |

---

## Architecture

### Dev-time request flow

```
Browser
  └─► ng serve (4200)
        └─► Express middleware (server.ts)
              ├─ GET /api/capabilities   ─► getCapabilities()
              ├─ POST /api/translate     ─► translateText()
              ├─ POST /api/detect        ─► detectLanguage()
              ├─ POST /api/localize      ─► translateLocalization()
              └─ POST /api/transcribe    ─► transcribeAudio()
                                               └─► @grpc/grpc-js → localhost:5100
```

### gRPC client (generated)

The TypeScript gRPC client is generated from `src/protos/translate.proto` using [buf](https://buf.build) + [ts-proto](https://github.com/stephenh/ts-proto):

```bash
npm run generate        # runs: buf generate
```

Generated output lands in **`src/generated/translate.ts`** (gitignored — always regenerate locally). The file exposes fully-typed interfaces and a `TranslateServiceClient` class; `src/grpc-client.ts` wraps it into promise-based helper functions used by `src/server.ts`.

After updating `translate.proto`, run `npm run generate` and the TypeScript compiler will surface any breaking changes immediately.

---

## Debugging (VS Code / Cursor)

Three launch configurations are pre-configured in `.vscode/launch.json`:

| Config | Description |
|---|---|
| **Open browser (ng serve)** | Starts `ng serve`, opens Chrome at 4200 |
| **Debug SSR backend** | Builds in dev mode, launches `server.mjs` with `--enable-source-maps`. Set breakpoints in `server.ts` / `grpc-client.ts`. Server runs on **port 4000**. |
| **Debug SSR + Chrome** | Compound: SSR debugger + Chrome side by side |

Press **F5** → pick a config → breakpoints work in TypeScript source files.

---

## End-to-end tests

Tests live in `e2e/` and run against the `ng serve` dev server (started automatically by Playwright).

```bash
npm run e2e           # headless, all browsers
npm run e2e:ui        # Playwright UI — interactive trace viewer
```

Test files:

| File | Coverage |
|---|---|
| `example.spec.ts` | Navigation: sidebar links, routing for all 5 pages |
| `dashboard.spec.ts` | Heading, loading/capabilities/error states |
| `translate.spec.ts` | Form controls, button enable/disable, Clear |
| `detect.spec.ts` | Form controls, button enable/disable, Clear |
| `localize.spec.ts` | JSON textarea, Upload JSON, collapsible panel |
| `transcribe.spec.ts` | WAV file input, accept attribute, disabled state |

Tests do **not** require the gRPC service to be running — they validate UI structure and form behavior only.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `TRANSLATE_GRPC_URL` | `localhost:5100` | gRPC service address |
| `PORT` | `4000` | SSR server port (production / debug mode only) |

---

## Project structure

```
src/
├── protos/
│   └── translate.proto          # Source of truth for gRPC contract
├── generated/
│   └── translate.ts             # ← generated by buf (gitignored)
├── grpc-client.ts               # Typed promise wrappers around gRPC client
├── server.ts                    # Express SSR + /api/* proxy routes
└── app/
    ├── app.ts / app.html        # Shell: sidebar nav + router outlet
    ├── app.routes.ts            # Lazy-loaded routes (Client render mode)
    ├── translate-api.service.ts # Angular HttpClient service → /api/*
    ├── languages.ts             # Shared language list + format options
    ├── dashboard.component.ts
    ├── text-translation.component.ts
    ├── detect-language.component.ts
    ├── locale-files.component.ts
    └── speech-to-text.component.ts
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals, SSR) |
| UI | Bootstrap 5, dark theme |
| Server | Express 5 + `@angular/ssr` |
| gRPC | `@grpc/grpc-js` + ts-proto generated client |
| Code gen | buf CLI + ts-proto 2.x |
| Linting | Biome 2.x |
| Testing | Playwright 1.x |
