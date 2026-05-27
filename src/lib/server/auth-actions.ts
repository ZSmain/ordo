import * as v from 'valibot';

type ValidationIssues = Parameters<typeof v.flatten>[0];

export function flattenValidation(
	issues: ValidationIssues,
	fallbackMessage = 'Please correct the highlighted fields.'
) {
	const flattened = v.flatten(issues);

	return {
		message: flattened.root?.join(', ') || fallbackMessage,
		errors: (flattened.nested ?? {}) as Record<string, string[]>
	};
}

export function getSafeRedirectTo(redirectTo: string | null | undefined, fallback = '/') {
	if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
		return fallback;
	}

	return redirectTo;
}

export function readFormString(formData: FormData, key: string) {
	return formData.get(key)?.toString() ?? '';
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export function isRedirectLike(error: unknown): error is { status: number; location: string } {
	return !!error && typeof error === 'object' && 'status' in error && 'location' in error;
}

export async function resolveSocialRedirectUrl(result: unknown) {
	if (result instanceof Response) {
		const location = result.headers.get('location');

		if (location) {
			return location;
		}

		const contentType = result.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			try {
				const data = (await result.json()) as Record<string, unknown>;
				const url = data.location ?? data.url;
				return typeof url === 'string' ? url : null;
			} catch {
				return null;
			}
		}

		return null;
	}

	if (result && typeof result === 'object') {
		const data = result as Record<string, unknown>;
		const url = data.location ?? data.url;

		return typeof url === 'string' ? url : null;
	}

	return null;
}

export function isMissingSessionError(error: unknown) {
	const errorBody =
		error && typeof error === 'object' && 'body' in error
			? ((error as { body?: { code?: string } }).body ?? null)
			: null;

	return (
		(error instanceof Error && error.message.includes('Failed to get session')) ||
		errorBody?.code === 'FAILED_TO_GET_SESSION'
	);
}
