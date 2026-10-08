/*//////////////////////////////////////////////////
REGEX
//////////////////////////////////////////////////*/
const U_REGEX = /\/+$/u;
const SHARED_REGEX = /^\/+/;

/** Neon Auth session shape returned by the browser session endpoint. */
type AuthSession = { user: { id: string; name?: string; email: string } };

const authUrl = import.meta.env.PUBLIC_NEON_AUTH_URL?.replace(U_REGEX, '');
const dataApiUrl = import.meta.env.PUBLIC_NEON_DATA_API_URL?.replace(U_REGEX, '');

export const neonIsConfigured = Boolean(authUrl && dataApiUrl);

/** Sends a same-origin-credentialed request to the configured Neon Auth API.
 * @param path Endpoint path relative to the configured auth service.
 * @param body Optional JSON request payload; supplying it selects the POST method.
 * @returns The response body parsed as the requested result type.
 */
export async function neonAuth<T>(path: string, body?: Record<string, string>): Promise<T> {
	if (!authUrl) throw new Error('Account sign-in is not configured for this site.');
	const response = await fetch(`${authUrl}/${path.replace(SHARED_REGEX, '')}`, {
		method: body ? 'POST' : 'GET',
		credentials: 'include',
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };
	if (!response.ok) throw new Error(data.message ?? data.error ?? 'Account request failed.');
	return data;
}

/**
 * Returns the signed-in Neon user, or null when no session is available.
 *
 * @returns The authenticated session when present, or null when authentication is unavailable or signed out.
 */
export async function getNeonSession(): Promise<AuthSession | null> {
	if (!authUrl) return null;
	const session = await neonAuth<AuthSession | null>('get-session');
	return session?.user?.id && session.user.email ? session : null;
}

