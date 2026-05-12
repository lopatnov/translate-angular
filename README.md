# Translate Studio

> Manual testing UI for the [Lopatnov.Translate](https://github.com/lopatnov/translate) gRPC service. **Angular 21 · SSR · Express · Bootstrap 5.**

[![CI](https://github.com/lopatnov/translate-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/lopatnov/translate-angular/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@lopatnov/translate-angular)](https://www.npmjs.com/package/@lopatnov/translate-angular)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/lopatnov/translate-angular)](https://github.com/lopatnov/translate-angular/issues)
[![GitHub stars](https://img.shields.io/github/stars/lopatnov/translate-angular?style=social)](https://github.com/lopatnov/translate-angular/stargazers)

Exercises every gRPC endpoint of Lopatnov.Translate through a clean web interface — no `grpcurl` commands needed.

```
Browser → Angular (port 4200) → Express SSR → @grpc/grpc-js → gRPC service (port 5100)
```

---

## Table of Contents

- [Pages](#pages)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [npm Scripts](#npm-scripts)
- [Architecture](#architecture)
- [Debugging](#debugging-vs-code--cursor)
- [End-to-End Tests](#end-to-end-tests)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Built With](#built-with)
- [Contributing](#contributing)
- [License](#license)

---

## Pages

| Route         | Purpose                           | gRPC RPC                |
| ------------- | --------------------------------- | ----------------------- |
| `/`           | Service status, available models  | `GetCapabilities`       |
| `/translate`  | Text translation with auto-detect | `TranslateText`         |
| `/detect`     | Language detection + confidence   | `DetectLanguage`        |
| `/localize`   | JSON i18n file translation        | `TranslateLocalization` |
| `/transcribe` | WAV → transcript + segments       | `TranscribeAudio`       |

---

## Prerequisites

| Tool               | Version | Notes                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| Node.js            | 20 LTS+ |                                                             |
| npm                | 11+     |                                                             |
| Angular CLI        | 21      | `npm i -g @angular/cli`                                     |
| buf CLI            | 1.x     | Required only to regenerate gRPC client after proto changes |
| Lopatnov.Translate | running | Default: `localhost:5100`                                   |

---

## Getting Started

```bash
git clone https://github.com/lopatnov/translate-angular.git
cd translate-angular
cp .env .env.local          # adjust if your gRPC service runs on a different host
npm install
npm start
```

Open **http://localhost:4200** — the Dashboard will show service status if the gRPC service is reachable.

To point at a different gRPC host:

```bash
TRANSLATE_GRPC_URL=my-server:5100 npm start
```

---

## npm Scripts

| Script              | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `npm start`         | Dev server with HMR (port 4200)                                             |
| `npm run build`     | Production build → `dist/`                                                  |
| `npm run generate`  | Regenerate gRPC client from `src/protos/translate.proto` via buf + ts-proto |
| `npm run lint`      | Biome lint with auto-fix                                                    |
| `npm run format`    | Biome format (write)                                                        |
| `npm run check`     | Biome check — reports only, for CI                                          |
| `npm run e2e`       | Playwright end-to-end tests (headless)                                      |
| `npm run e2e:ui`    | Playwright with interactive UI                                              |
| `npm run debug:ssr` | Start built SSR server with Node inspector on port 9229                     |

---

## Architecture

### Request flow

```txt
Browser
  └─► ng serve (4200)
        └─► Express (server.ts)
              └─► Router (server/routes.ts)
                    ├─ GET /api/capabilities   ─► getCapabilities()
                    ├─ POST /api/translate     ─► translateText()
                    ├─ POST /api/detect        ─► detectLanguage()
                    ├─ POST /api/localize      ─► translateLocalization()
                    └─ POST /api/transcribe    ─► transcribeAudio()
                                                     └─► @grpc/grpc-js → localhost:5100
                                                           (30 s deadline; 120 s for transcribe)
```

### gRPC client (generated)

The TypeScript gRPC client is generated from `src/protos/translate.proto` using [buf](https://buf.build) + [ts-proto](https://github.com/stephenh/ts-proto):

```bash
npm run generate        # runs: buf generate
```

Generated output lands in **`src/server/generated/translate.ts`** (gitignored — always regenerate locally).  
After updating `translate.proto`, run `npm run generate` and the TypeScript compiler will surface any breaking changes immediately.

---

## Debugging (VS Code / Cursor)

Three launch configurations are pre-configured in `.vscode/launch.json`:

| Config                      | Description                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open browser (ng serve)** | Starts `ng serve`, opens Chrome at 4200                                                                                                                 |
| **Debug SSR backend**       | Builds in dev mode, launches `server.mjs` with `--enable-source-maps`. Set breakpoints in `server.ts` / `server/grpc-client.ts`. Server runs on **port 4000**. |
| **Debug SSR + Chrome**      | Compound: SSR debugger + Chrome side by side                                                                                                            |

Press **F5** → pick a config → breakpoints work in TypeScript source files.

---

## End-to-End Tests

Tests live in `e2e/` and run against the `ng serve` dev server (started automatically by Playwright).

```bash
npm run e2e           # headless, all browsers
npm run e2e:ui        # Playwright UI — interactive trace viewer
```

| File                 | Coverage                                                  |
| -------------------- | --------------------------------------------------------- |
| `example.spec.ts`    | Navigation: sidebar links, routing for all 5 pages        |
| `dashboard.spec.ts`  | Heading, loading/capabilities/error states, gRPC URL hint |
| `translate.spec.ts`  | Form controls, model select, button enable/disable, Clear |
| `detect.spec.ts`     | Form controls, button enable/disable, Clear               |
| `localize.spec.ts`   | JSON textarea, model select, Upload JSON, details panel   |
| `transcribe.spec.ts` | WAV file input, accept attribute, language select, Clear  |

Tests do **not** require the gRPC service to be running — they validate UI structure and form behavior only.

---

## Environment Variables

| Variable                | Default          | Description                                              |
| ----------------------- | ---------------- | -------------------------------------------------------- |
| `TRANSLATE_GRPC_URL`    | `localhost:5100` | gRPC service address                                     |
| `PORT`                  | `4000`           | SSR server port (production / debug mode only)           |
| `TRANSCRIBE_DEADLINE_MS`| `120000`         | gRPC deadline for TranscribeAudio calls (milliseconds)   |

---

## Project Structure

```txt
src/
├── protos/
│   └── translate.proto              # Source of truth for gRPC contract
├── server/
│   ├── generated/
│   │   └── translate.ts             # ← generated by buf (gitignored)
│   ├── grpc-client.ts               # Singleton gRPC client, Promise API
│   └── routes.ts                    # Express Router — /api/* → gRPC
├── server.ts                        # Express entry: middleware, SSR handler
├── shared/
│   └── api.types.ts                 # Request/response interfaces (shared by server + client)
└── app/
    ├── core/
    │   ├── interceptors/
    │   │   └── error.interceptor.ts # HTTP retry on 502/503/504
    │   ├── services/
    │   │   ├── app-error.service.ts     # Global error signal
    │   │   ├── capabilities.service.ts  # Singleton: GetCapabilities as signals
    │   │   └── translate-api.service.ts # HttpClient → /api/*
    │   └── utils/
    │       ├── api-error.util.ts    # Extract message from HttpErrorResponse
    │       ├── lang-format.util.ts  # Composable: language_format signal + isNative
    │       └── languages.ts         # NLLB-200 language list + format options
    ├── features/
    │   ├── dashboard/               # GetCapabilities → service status, model list
    │   ├── detect-language/         # DetectLanguage → language + confidence
    │   ├── locale-files/            # TranslateLocalization → JSON i18n translation
    │   ├── speech-to-text/          # TranscribeAudio → transcript + segments
    │   └── text-translation/        # TranslateText → translated text
    ├── shared/
    │   └── components/
    │       ├── copy-button/         # Clipboard copy with execCommand fallback
    │       ├── credits/             # GitHub + LinkedIn links
    │       ├── error-alert/         # Dismissible error banner
    │       ├── language-select/     # Searchable datalist input (183 languages)
    │       ├── page-header/         # Page title + subtitle
    │       └── submit-button/       # Loading-aware submit button
    ├── app.ts / app.html / app.scss # Shell: sidebar nav + router outlet
    ├── app.routes.ts                # Lazy-loaded feature routes
    └── app.config.ts
```

---

## Built With

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | [Angular 21](https://angular.dev) (standalone components, signals, SSR) |
| UI        | [Bootstrap 5](https://getbootstrap.com), dark theme |
| Server    | [Express 5](https://expressjs.com) + `@angular/ssr` |
| gRPC      | [`@grpc/grpc-js`](https://github.com/grpc/grpc-node) + ts-proto generated client |
| Code gen  | [buf CLI](https://buf.build) + [ts-proto](https://github.com/stephenh/ts-proto) 2.x |
| Linting   | [Biome](https://biomejs.dev) 2.x                 |
| Testing   | [Playwright](https://playwright.dev) 1.x         |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

- Bug reports and feature requests → [open an issue](https://github.com/lopatnov/translate-angular/issues)
- Found it useful? A [star on GitHub](https://github.com/lopatnov/translate-angular/stargazers) helps others discover the project

---

## License

[Apache 2.0](LICENSE) © 2026 [Oleksandr Lopatnov](https://github.com/lopatnov) · [LinkedIn](https://www.linkedin.com/in/lopatnov/)
