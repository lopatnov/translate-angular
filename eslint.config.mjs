// @ts-check
// ESLint is configured for Angular HTML templates ONLY.
// TypeScript and JavaScript files are handled by Biome (biome.json).
import templatePlugin from '@angular-eslint/eslint-plugin-template';
import templateParser from '@angular-eslint/template-parser';

export default [
  // Ignore everything that Biome already owns and generated/build artefacts.
  {
    ignores: ['**/*.ts', '**/*.js', '**/*.mjs', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      '@angular-eslint/template': templatePlugin,
    },
    rules: {
      // ── Recommended (correctness) ─────────────────────────────────────────
      '@angular-eslint/template/banana-in-box': 'error', // [(ngModel)] not ([ngModel])
      '@angular-eslint/template/no-negated-async': 'error', // !(obs$ | async) is always wrong

      // ── Accessibility (WCAG AA) ───────────────────────────────────────────
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/valid-aria': 'error',

      // ── Quality / correctness extras ──────────────────────────────────────
      '@angular-eslint/template/button-has-type': 'error', // no implicit type="submit"
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error', // enforce @if/@for/@switch
      '@angular-eslint/template/no-any': 'warn', // flag $any() casts
      '@angular-eslint/template/use-track-by-function': 'warn', // @for should have track expr
      '@angular-eslint/template/prefer-ngsrc': 'warn', // nudge toward NgOptimizedImage
    },
  },
];
