import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
	ErrorHandler,
	type ApplicationConfig,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
	provideClientHydration,
	withEventReplay,
} from '@angular/platform-browser';
import { provideRouter, withRouterConfig } from '@angular/router';
import { GlobalErrorHandler } from '@core/global-error-handler';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			withRouterConfig({ paramsInheritanceStrategy: 'always' }),
		),
		provideHttpClient(
			withFetch(),
			withInterceptors([errorInterceptor]),
		),
		provideClientHydration(withEventReplay()),
		{ provide: ErrorHandler, useClass: GlobalErrorHandler },
	],
};
