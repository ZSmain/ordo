import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://ed3398962946c11fa1ee65225f69f3b1@o4510109861412864.ingest.de.sentry.io/4510109866983504',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
