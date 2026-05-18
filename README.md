# Translate Studio

> Manual testing UI for the [Lopatnov.Translate](https://github.com/lopatnov/translate) gRPC service. **Angular 21 · SSR · Express · Bootstrap 5.**

[![CI](https://github.com/lopatnov/translate-angular/actions/workflows/ci.yml/badge.svg)](https://github.com/lopatnov/translate-angular/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@lopatnov/translate-angular)](https://www.npmjs.com/package/@lopatnov/translate-angular)
[![Docker](https://ghcr-badge.egpl.dev/lopatnov/translate-angular/latest_tag?label=ghcr.io)](https://github.com/lopatnov/translate-angular/pkgs/container/translate-angular)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/lopatnov/translate-angular)](https://github.com/lopatnov/translate-angular/issues)
[![GitHub stars](https://img.shields.io/github/stars/lopatnov/translate-angular?style=social)](https://github.com/lopatnov/translate-angular/stargazers)

Exercises every gRPC endpoint of Lopatnov.Translate through a clean web interface — no `grpcurl` commands needed.

```txt
Browser → Angular (port 4000) → Express SSR → @grpc/grpc-js → gRPC service (port 5100)
```

> **Requires** the [Lopatnov.Translate](https://github.com/lopatnov/translate) gRPC service running on `localhost:5100` (or set `TRANSLATE_GRPC_URL`).

---

## Table of Contents

- [Pages](#pages)
- [Getting Started](#getting-started)
  - [Docker](#docker)
  - [npm](#npm)
  - [Development](#development)
- [Environment Variables](#environment-variables)
- [npm Scripts](#npm-scripts)
- [Architecture](#architecture)
- [Debugging](#debugging-vs-code--cursor)
- [End-to-End Tests](#end-to-end-tests)
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

## Getting Started

### Docker

The quickest way — no Node.js required.

```bash
docker run -p 4000:4000 \
  -e TRANSLATE_GRPC_URL=host.docker.internal:5100 \
  ghcr.io/lopatnov/translate-angular:latest
```

Open **http://localhost:4000**.

With Docker Compose alongside the gRPC service:

```yaml
services:
  translate-studio:
    image: ghcr.io/lopatnov/translate-angular:latest
    ports:
      - "4000:4000"
    environment:
      TRANSLATE_GRPC_URL: translate:5100
    depends_on:
      - translate

  translate:
    image: ghcr.io/lopatnov/translate:latest
    ports:
      - "5100:5100"
```

### npm

Install globally and run as a CLI:

```bash
npm install -g @lopatnov/translate-angular
TRANSLATE_GRPC_URL=localhost:5100 translate-studio
```

Open **http://localhost:4000**.

### Development

Clone and run the dev server with hot module replacement:

```bash
git clone https://github.com/lopatnov/translate-angular.git
cd translate-angular
npm install
npm start          # dev server on port 4200
```

To point at a different gRPC host:

```bash
TRANSLATE_GRPC_URL=my-server:5100 npm start
```

---

## Environment Variables

| Variable                | Default          | Description                                                        |
| ----------------------- | ---------------- | ------------------------------------------------------------------ |
| `TRANSLATE_GRPC_URL`    | `localhost:5100` | gRPC service address                                               |
| `PORT`                  | `4000`           | HTTP server port                                                   |
| `TRANSLATE_TIMEOUT_MS`  | _(none)_         | Deadline for TranslateText (ms). Unset = no deadline               |
| `LOCALIZE_TIMEOUT_MS`   | _(none)_         | Deadline for TranslateLocalization (ms). Unset = no deadline       |
| `TRANSCRIBE_TIMEOUT_MS` | _(none)_         | Deadline for TranscribeAudio / TranslateAudio. Unset = no deadline |

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
  └─► Express SSR (4000)
        └─► Router (server/routes.ts)
              ├─ GET /api/capabilities    ─► getCapabilities()        (30 s)
              ├─ POST /api/translate      ─► translateText()          (TRANSLATE_TIMEOUT_MS)
              ├─ POST /api/detect         ─► detectLanguage()         (30 s)
              ├─ POST /api/localize       ─► translateLocalization()  (LOCALIZE_TIMEOUT_MS)
              ├─ POST /api/transcribe     ─► transcribeAudio()        (TRANSCRIBE_TIMEOUT_MS)
              ├─ POST /api/translate-audio ─► translateAudio()        (TRANSCRIBE_TIMEOUT_MS)
              └─ POST /api/synthesize     ─► synthesizeSpeech()       (30 s)
                                                └─► @grpc/grpc-js → localhost:5100
```

### gRPC client (generated)

The TypeScript gRPC client is generated from `src/protos/translate.proto` using [buf](https://buf.build) + [ts-proto](https://github.com/stephenh/ts-proto):

```bash
npm run generate        # runs: buf generate
```

After updating `translate.proto`, run `npm run generate` and the TypeScript compiler will surface any breaking changes immediately.

---

## Debugging (VS Code / Cursor)

Three launch configurations are pre-configured in `.vscode/launch.json`:

| Config                      | Description                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Open browser (ng serve)** | Starts `ng serve`, opens Chrome at 4200                                                                                                                        |
| **Debug SSR backend**       | Builds in dev mode, launches `server.mjs` with `--enable-source-maps`. Set breakpoints in `server.ts` / `server/grpc-client.ts`. Server runs on **port 4000**. |
| **Debug SSR + Chrome**      | Compound: SSR debugger + Chrome side by side                                                                                                                   |

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

## Project Structure

```txt
src/
├── protos/
│   └── translate.proto              # Source of truth for gRPC contract
├── server/
│   ├── generated/
│   │   └── translate.ts             # ← generated by buf
│   ├── grpc-client.ts               # Singleton gRPC client, Promise API
│   └── routes.ts                    # Express Router — /api/* → gRPC
├── server.ts                        # Express entry: middleware, SSR handler
├── shared/
│   └── api.types.ts                 # Request/response interfaces (server + client)
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
    ├── shared/components/
    │   ├── copy-button/             # Clipboard copy
    │   ├── credits/                 # GitHub + LinkedIn links
    │   ├── error-alert/             # Dismissible error banner
    │   ├── language-select/         # Searchable datalist (183 languages)
    │   ├── page-header/             # Page title + subtitle
    │   └── submit-button/           # Loading-aware submit button
    ├── app.ts / app.html / app.scss # Shell: sidebar nav + router outlet
    ├── app.routes.ts                # Lazy-loaded feature routes
    └── app.config.ts
```

---

## Built With

| Layer     | Technology                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------- |
| Framework | [Angular 21](https://angular.dev) (standalone components, signals, SSR)                         |
| UI        | [Bootstrap 5](https://getbootstrap.com), dark theme                                             |
| Server    | [Express 5](https://expressjs.com) + `@angular/ssr`                                             |
| gRPC      | [`@grpc/grpc-js`](https://github.com/grpc/grpc-node) + ts-proto generated client                |
| Code gen  | [buf CLI](https://buf.build) + [ts-proto](https://github.com/stephenh/ts-proto) 2.x             |
| Linting   | [Biome](https://biomejs.dev) 2.x                                                                |
| Testing   | [Playwright](https://playwright.dev) 1.x                                                        |
| Container | Docker · [GHCR](https://github.com/lopatnov/translate-angular/pkgs/container/translate-angular) |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

- Bug reports and feature requests → [open an issue](https://github.com/lopatnov/translate-angular/issues)
- Found it useful? A [star on GitHub](https://github.com/lopatnov/translate-angular/stargazers) helps others discover the project

---

## License

[Apache 2.0](LICENSE) © 2026 [Oleksandr Lopatnov](https://github.com/lopatnov) · [LinkedIn](https://www.linkedin.com/in/lopatnov/)
