/** Authenticated Neon user fields used by the scoreboard account UI. */
type AuthUser = { id: string; name?: string; email: string };
/** Neon Auth session shape returned by the browser session endpoint. */
type AuthSession = { user: AuthUser };

const authUrl = import.meta.env.PUBLIC_NEON_AUTH_URL?.replace(/\/+$/u, '');
const dataApiUrl = import.meta.env.PUBLIC_NEON_DATA_API_URL?.replace(/\/+$/u, '');

export const neonIsConfigured = Boolean(authUrl && dataApiUrl);

/** Sends a same-origin-credentialed request to the configured Neon Auth API. */
export async function neonAuth<T>(path: string, body?: Record<string, string>): Promise<T> {
	if (!authUrl) throw new Error('Account sign-in is not configured for this site.');
	const response = await fetch(`${authUrl}/${path.replace(/^\/+/, '')}`, {
		method: body ? 'POST' : 'GET',
		credentials: 'include',
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = (await response.json().catch(() => ({}))) as T & { message?: string; error?: string };
	if (!response.ok) throw new Error(data.message ?? data.error ?? 'Account request failed.');
	return data;
}

/** Returns the signed-in Neon user, or null when no session is available. */
export async function getNeonSession(): Promise<AuthSession | null> {
	if (!authUrl) return null;
	const session = await neonAuth<AuthSession | null>('get-session');
	return session?.user?.id && session.user.email ? session : null;
}

/** Retrieves the short-lived bearer token for Neon Data API requests. */
export async function getNeonJwt(): Promise<string> {
	const response = await neonAuth<{ token?: string; accessToken?: string }>('token');
	const token = response.token ?? response.accessToken;
	if (!token) throw new Error('The account session could not access the scoreboard database.');
	return token;
}

/** Sends an authenticated request to the configured Neon Data API. */
export async function neonData<T>(path: string, init: RequestInit = {}): Promise<T> {
	if (!dataApiUrl) throw new Error('The scoreboard database is not configured for this site.');
	const token = await getNeonJwt();
	const headers = new Headers(init.headers);
	headers.set('Authorization', `Bearer ${token}`);
	headers.set('Accept', 'application/json');
	if (init.body) headers.set('Content-Type', 'application/json');
	const response = await fetch(`${dataApiUrl}/${path.replace(/^\/+/, '')}`, { ...init, headers });
	const data = (await response.json().catch(() => null)) as T | { message?: string; details?: string } | null;
	if (!response.ok) {
		const failure = data && typeof data === 'object' && 'message' in data ? data.message : null;
		throw new Error(typeof failure === 'string' ? failure : 'The scoreboard database request failed.');
	}
	return data as T;
}
