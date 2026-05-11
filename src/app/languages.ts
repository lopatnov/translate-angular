export const LANGUAGES = [
	{ code: 'en', name: 'English' },
	{ code: 'uk', name: 'Ukrainian' },
	{ code: 'ru', name: 'Russian' },
	{ code: 'de', name: 'German' },
	{ code: 'fr', name: 'French' },
	{ code: 'es', name: 'Spanish' },
	{ code: 'pl', name: 'Polish' },
	{ code: 'it', name: 'Italian' },
	{ code: 'pt', name: 'Portuguese' },
	{ code: 'nl', name: 'Dutch' },
	{ code: 'cs', name: 'Czech' },
	{ code: 'ro', name: 'Romanian' },
	{ code: 'sv', name: 'Swedish' },
	{ code: 'zh', name: 'Chinese (Simplified)' },
	{ code: 'ja', name: 'Japanese' },
	{ code: 'ko', name: 'Korean' },
	{ code: 'ar', name: 'Arabic' },
	{ code: 'hi', name: 'Hindi' },
	{ code: 'tr', name: 'Turkish' },
	{ code: 'th', name: 'Thai' },
] as const;

export const LANGUAGE_FORMATS = [
	{ value: 'bcp47', label: 'BCP-47' },
	{ value: 'native', label: 'Native' },
] as const;
