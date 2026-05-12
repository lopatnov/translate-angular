# Changelog

All notable changes to Translate Studio are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] — 2026-05-12

### Added

- **5 feature pages**: Dashboard, Text Translation, Language Detection, Localization Files, Speech to Text
- **Angular 21 SSR** with Express server-side rendering
- **gRPC proxy** in Express: all `/api/*` routes forward to `localhost:5100` via `@grpc/grpc-js`
- **Generated TypeScript gRPC client** from `translate.proto` using buf + ts-proto
- **CapabilitiesService** — exposes `GetCapabilities` as Angular signals with `refresh()` support
- **Searchable language select** component backed by `<datalist>` (183 NLLB-200 languages)
- **Global error handling** — `GlobalErrorHandler` + `AppErrorService` + HTTP retry interceptor
- **Shared UI components**: `SubmitButton`, `ErrorAlert`, `PageHeader`, `CopyButton`, `Credits`
- **Path aliases** for clean imports: `@core/*`, `@features/*`, `@shared/*`, `@server/*`
- **Dark theme** with Bootstrap 5 and custom sidebar navigation
- **Playwright e2e tests** for all 5 pages
- **VS Code debug configurations**: ng serve, SSR backend, compound
- **GitHub Actions**: CI workflow (lint + build + e2e), npm publish on release
- **Biome** linting and formatting (replaces Prettier)
- `.env` file with working defaults for zero-config startup
- `Credits` component with GitHub and LinkedIn links in sidebar

### Environment Variables

| Variable                 | Default          |
| ------------------------ | ---------------- |
| `TRANSLATE_GRPC_URL`     | `localhost:5100` |
| `PORT`                   | `4000`           |
| `TRANSCRIBE_DEADLINE_MS` | `120000`         |
