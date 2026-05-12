import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'translate',
    loadComponent: () =>
      import('./features/text-translation/text-translation.component').then(
        (m) => m.TextTranslationComponent,
      ),
  },
  {
    path: 'detect',
    loadComponent: () =>
      import('./features/detect-language/detect-language.component').then(
        (m) => m.DetectLanguageComponent,
      ),
  },
  {
    path: 'localize',
    loadComponent: () =>
      import('./features/locale-files/locale-files.component').then(
        (m) => m.LocaleFilesComponent,
      ),
  },
  {
    path: 'transcribe',
    loadComponent: () =>
      import('./features/speech-to-text/speech-to-text.component').then(
        (m) => m.SpeechToTextComponent,
      ),
  },
];
