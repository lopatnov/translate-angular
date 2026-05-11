import { provideHttpClient, withFetch } from '@angular/common/http';
import {
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
	provideClientHydration,
	withEventReplay,
} from '@angular/platform-browser';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			withRouterConfig({ paramsInheritanceStrategy: 'always' }),
		),
		provideHttpClient(withFetch()),
		provideClientHydration(withEventReplay()),
	],
};
