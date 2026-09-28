import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBridgetteHandler } from '../netlify/functions/bridgette.mjs';

const DEFAULT_SCOREBOARD = {
	pitchers: [
		{ id: 'kai', name: 'Kai', strikes: 1 },
		{ id: 'daniel', name: 'Daniel', strikes: 1 },
	],
};

function createFixture({ env = {}, initial = new Map(), failRead = false, failWrite = false } = {}) {
	const values = initial;
	const writes = [];
	const reads = [];
	const errors = [];
	const storeFactory = target => {
		const key = typeof target === 'string' ? `current:${target}` : `${target.siteID}:${target.name}`;
		return {
			async get(dataKey) {
				reads.push([key, dataKey]);
				if (failRead) throw new Error('read failed');
				return values.get(`${key}:${dataKey}`) ?? null;
			},
			async setJSON(dataKey, value) {
				if (failWrite) throw new Error('write failed');
				writes.push([key, dataKey, structuredClone(value)]);
				values.set(`${key}:${dataKey}`, structuredClone(value));
			},
		};
	};
	const handler = createBridgetteHandler({ getStore: storeFactory, env, logger: { error: (...args) => errors.push(args) } });
	return { handler, values, writes, reads, errors };
}

async function json(response) {
	return response.json();
}

function get() {
	return new Request('https://scoreboard.test/api/bridgette');
}

function put(payload, token = 'valid-editor-key') {
	return new Request('https://scoreboard.test/api/bridgette', {
		method: 'PUT',
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify(payload),
	});
}

test('GET seeds and returns the default scoreboard when storage is empty', async () => {
	const fixture = createFixture();
	const response = await fixture.handler(get());
	assert.equal(response.status, 200);
	assert.equal(response.headers.get('cache-control'), 'no-store');
	assert.deepEqual(await json(response), DEFAULT_SCOREBOARD);
	assert.deepEqual(fixture.writes[0], ['current:bridgette-dashboard', 'scoreboard', DEFAULT_SCOREBOARD]);
});

test('GET returns an existing valid scoreboard without overwriting it', async () => {
	const existing = { pitchers: [{ id: 'guest', name: 'Guest', strikes: 2 }] };
	const fixture = createFixture({ initial: new Map([['current:bridgette-dashboard:scoreboard', existing]]) });
	assert.deepEqual(await json(await fixture.handler(get())), existing);
	assert.equal(fixture.writes.length, 0);
});

test('GET repairs invalid stored data by seeding the defaults', async () => {
	const fixture = createFixture({ initial: new Map([['current:bridgette-dashboard:scoreboard', { pitchers: [{ id: '', name: 'Bad', strikes: 9 }] }]]) });
	assert.deepEqual(await json(await fixture.handler(get())), DEFAULT_SCOREBOARD);
	assert.equal(fixture.writes.length, 1);
});

test('GET migrates a valid scoreboard from the configured source and writes it once locally', async () => {
	const migrated = { pitchers: [{ id: 'old-kai', name: 'Kai', strikes: 3 }] };
	const fixture = createFixture({
		env: { BRIDGETTE_MIGRATION_SITE_ID: 'previous-site', BRIDGETTE_MIGRATION_BLOBS_TOKEN: 'migration-token' },
		initial: new Map([['previous-site:bridgette-dashboard:scoreboard', migrated]]),
	});
	assert.deepEqual(await json(await fixture.handler(get())), migrated);
	assert.deepEqual(fixture.writes, [['current:bridgette-dashboard', 'scoreboard', migrated]]);
});

test('GET ignores invalid migration data and initializes local defaults', async () => {
	const fixture = createFixture({
		env: { BRIDGETTE_MIGRATION_SITE_ID: 'previous-site', BRIDGETTE_MIGRATION_BLOBS_TOKEN: 'migration-token' },
		initial: new Map([['previous-site:bridgette-dashboard:scoreboard', { pitchers: 'invalid' }]]),
	});
	assert.deepEqual(await json(await fixture.handler(get())), DEFAULT_SCOREBOARD);
	assert.equal(fixture.writes[0][0], 'current:bridgette-dashboard');
});

test('GET maps storage failures to a safe server error', async () => {
	const fixture = createFixture({ failRead: true });
	const response = await fixture.handler(get());
	assert.equal(response.status, 500);
	assert.deepEqual(await json(response), { error: 'The scoreboard could not be loaded.' });
	assert.equal(fixture.errors[0][0], 'scoreboard.read.failed');
});

test('unsupported methods are rejected with an Allow header', async () => {
	const fixture = createFixture();
	const response = await fixture.handler(new Request('https://scoreboard.test/api/bridgette', { method: 'DELETE' }));
	assert.equal(response.status, 405);
	assert.equal(response.headers.get('allow'), 'GET, PUT');
});

test('PUT rejects missing and incorrect editor keys without touching storage', async () => {
	for (const token of [null, 'wrong']) {
		const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' } });
		const request = token === null
			? new Request('https://scoreboard.test/api/bridgette', { method: 'PUT', body: JSON.stringify(DEFAULT_SCOREBOARD) })
			: put(DEFAULT_SCOREBOARD, token);
		const response = await fixture.handler(request);
		assert.equal(response.status, 401);
		assert.deepEqual(await json(response), { error: 'A valid editor key is required.' });
		assert.equal(fixture.writes.length, 0);
	}
});

test('PUT rejects an unset editor key', async () => {
	const fixture = createFixture();
	assert.equal((await fixture.handler(put(DEFAULT_SCOREBOARD))).status, 401);
	assert.equal(fixture.writes.length, 0);
});

test('PUT trims names, saves the valid payload, and returns the canonical data', async () => {
	const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' } });
	const canonical = { pitchers: [{ id: 'kai', name: 'Kai', strikes: 2 }] };
	const response = await fixture.handler(put({ pitchers: [{ id: 'kai', name: '  Kai  ', strikes: 2 }] }));
	assert.equal(response.status, 200);
	assert.deepEqual(await json(response), { data: canonical });
	assert.deepEqual(fixture.writes, [['current:bridgette-dashboard', 'scoreboard', canonical]]);
});

test('PUT rejects malformed JSON without a partial write', async () => {
	const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' } });
	const response = await fixture.handler(new Request('https://scoreboard.test/api/bridgette', {
		method: 'PUT',
		headers: { authorization: 'Bearer valid-editor-key', 'content-type': 'application/json' },
		body: '{',
	}));
	assert.equal(response.status, 400);
	assert.deepEqual(await json(response), { error: 'The scoreboard update is invalid.' });
	assert.equal(fixture.writes.length, 0);
});

test('PUT rejects invalid pitcher fields and boundary values without saving', async t => {
	const cases = [
		['empty id', { pitchers: [{ id: '', name: 'Kai', strikes: 1 }] }],
		['id longer than 80 characters', { pitchers: [{ id: 'i'.repeat(81), name: 'Kai', strikes: 1 }] }],
		['empty trimmed name', { pitchers: [{ id: 'kai', name: '  ', strikes: 1 }] }],
		['name longer than 80 characters', { pitchers: [{ id: 'kai', name: 'n'.repeat(81), strikes: 1 }] }],
		['non-integer strikes', { pitchers: [{ id: 'kai', name: 'Kai', strikes: 1.5 }] }],
		['strikes below one', { pitchers: [{ id: 'kai', name: 'Kai', strikes: 0 }] }],
		['strikes above three', { pitchers: [{ id: 'kai', name: 'Kai', strikes: 4 }] }],
		['more than 100 pitchers', { pitchers: Array.from({ length: 101 }, (_, i) => ({ id: `p${i}`, name: 'Pitcher', strikes: 1 })) }],
		['missing pitchers array', { pitchers: null }],
	];
	for (const [label, payload] of cases) {
		await t.test(label, async () => {
			const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' } });
			const response = await fixture.handler(put(payload));
			assert.equal(response.status, 400);
			assert.deepEqual(await json(response), { error: 'The scoreboard update is invalid.' });
			assert.equal(fixture.writes.length, 0);
		});
	}
});

test('PUT rejects a malformed request body shape without writing', async () => {
	const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' } });
	assert.equal((await fixture.handler(put({}))).status, 400);
	assert.equal(fixture.writes.length, 0);
});

test('PUT maps persistence failures to a safe server error', async () => {
	const fixture = createFixture({ env: { BRIDGETTE_EDITOR_TOKEN: 'valid-editor-key' }, failWrite: true });
	const response = await fixture.handler(put(DEFAULT_SCOREBOARD));
	assert.equal(response.status, 500);
	assert.deepEqual(await json(response), { error: 'The scoreboard could not be saved.' });
	assert.equal(fixture.errors[0][0], 'scoreboard.update.failed');
});
