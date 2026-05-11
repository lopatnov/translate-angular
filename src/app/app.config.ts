import {
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
	provideClientHydration,
	withEventReplay,
} from '@angular/platform-browser';

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
