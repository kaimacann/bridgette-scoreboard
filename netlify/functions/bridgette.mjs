import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const STORE_NAME = 'bridgette-dashboard';
const DATA_KEY = 'scoreboard';
const DEFAULT_SCOREBOARD = {
	pitchers: [
		{ id: 'kai', name: 'Kai', strikes: 1 },
		{ id: 'daniel', name: 'Daniel', strikes: 1 },
	],
};
const payloadSchema = z.object({
	pitchers: z.array(z.object({
		id: z.string().min(1).max(80),
		name: z.string().trim().min(1).max(80),
		strikes: z.number().int().min(1).max(3),
	})).max(100),
});

/** Creates the HTTP handler with injectable storage for isolated integration tests. */
export function createBridgetteHandler({ getStore: store = getStore, env = process.env, logger = console } = {}) {
	return async request => {
		if (request.method === 'GET') {
			try {
				const data = await loadScoreboard(store, env);
				if (!data) return json({ error: 'Scoreboard migration is not configured.' }, 503);
				return json(data);
			} catch (error) {
				logger.error('scoreboard.read.failed', error);
				return json({ error: 'The scoreboard could not be loaded.' }, 500);
			}
		}
		if (request.method !== 'PUT') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, PUT' });

		const editorToken = env.BRIDGETTE_EDITOR_TOKEN;
		const submittedToken = request.headers.get('authorization')?.replace(/^Bearer\s+/iu, '') ?? '';
		if (!editorToken || !secureMatch(submittedToken, editorToken)) return json({ error: 'A valid editor key is required.' }, 401);

		let body;
		try {
			body = await request.json();
		} catch {
			return json({ error: 'The scoreboard update is invalid.' }, 400);
		}
		const parsed = payloadSchema.safeParse(body);
		if (!parsed.success) return json({ error: 'The scoreboard update is invalid.' }, 400);
		try {
			await store(STORE_NAME).setJSON(DATA_KEY, parsed.data);
			return json({ data: parsed.data });
		} catch (error) {
			logger.error('scoreboard.update.failed', error);
			return json({ error: 'The scoreboard could not be saved.' }, 500);
		}
	};
}

/** Responds with the current scoreboard or saves an editor-authenticated update. */
export default createBridgetteHandler();

async function loadScoreboard(getStore, env) {
	const destination = getStore(STORE_NAME);
	const existing = await destination.get(DATA_KEY, { type: 'json' });
	if (payloadSchema.safeParse(existing).success) return existing;

	const sourceSiteId = env.BRIDGETTE_MIGRATION_SITE_ID;
	const sourceToken = env.BRIDGETTE_MIGRATION_BLOBS_TOKEN;
	if (sourceSiteId && sourceToken) {
		const source = getStore({ name: STORE_NAME, siteID: sourceSiteId, token: sourceToken });
		const previous = await source.get(DATA_KEY, { type: 'json' });
		const parsed = payloadSchema.safeParse(previous);
		if (parsed.success) {
			await destination.setJSON(DATA_KEY, parsed.data);
			return parsed.data;
		}
	}
	await destination.setJSON(DATA_KEY, DEFAULT_SCOREBOARD);
	return DEFAULT_SCOREBOARD;
}

function secureMatch(candidate, expected) {
	const candidateBytes = Buffer.from(candidate);
	const expectedBytes = Buffer.from(expected);
	return candidateBytes.length === expectedBytes.length && timingSafeEqual(candidateBytes, expectedBytes);
}

function json(value, status = 200, headers = {}) {
	return new Response(JSON.stringify(value), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
	});
}
