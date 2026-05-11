import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./dashboard.component').then((m) => m.DashboardComponent),
	},
	{
		path: 'translate',
		loadComponent: () =>
			import('./text-translation.component').then(
				(m) => m.TextTranslationComponent,
			),
	},
	{
		path: 'detect',
		loadComponent: () =>
			import('./detect-language.component').then(
				(m) => m.DetectLanguageComponent,
			),
	},
	{
		path: 'localize',
		loadComponent: () =>
			import('./locale-files.component').then((m) => m.LocaleFilesComponent),
	},
	{
		path: 'transcribe',
		loadComponent: () =>
			import('./speech-to-text.component').then((m) => m.SpeechToTextComponent),
	},
];
