import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const [schema, client, gate, scoreboard, netlify, errs, boundary, styles] = await Promise.all([
	readFile(new URL('../migrations/0001_accounts_and_scoreboards.sql', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/neon.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/components/account-gate.tsx', import.meta.url), 'utf8'),
	readFile(new URL('../src/components/scoreboard.tsx', import.meta.url), 'utf8'),
	readFile(new URL('../netlify.toml', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/error-notifications.ts', import.meta.url), 'utf8'),
	readFile(new URL('../src/components/ErrorBoundary.tsx', import.meta.url), 'utf8'),
	readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
]);

test('scoreboard rows have a Neon Auth owner and stay account-scoped', () => {
	assert.match(schema, /owner_id text NOT NULL DEFAULT \(auth\.user_id\(\)\)/);
	assert.match(schema, /scoreboards_read_owner_or_strikee[\s\S]*?auth\.user_id\(\)[\s\S]*?is_scoreboard_strikee/);
	assert.match(schema, /scoreboards_create_for_self[\s\S]*?WITH CHECK \(\(SELECT auth\.user_id\(\)\) = owner_id\)/);
	assert.match(schema, /scoreboards_update_owner_or_strikee/);
});

test('only creators can add strikee shares; strikees can read and edit score counts', () => {
	assert.match(schema, /scoreboard_shares_create_by_owner[\s\S]*?b\.owner_id = \(SELECT auth\.user_id\(\)\)/);
	assert.match(schema, /scoreboard_shares_read_owner_or_strikee[\s\S]*?strikee_email = lower\(auth\.session\(\)->>'email'\)/);
	assert.match(schema, /GRANT UPDATE \(pitchers, updated_at\) ON public\.scoreboards TO authenticated/);
	assert.match(schema, /REVOKE ALL ON FUNCTION public\.is_scoreboard_strikee\(uuid\) FROM PUBLIC/);
});

test('unauthenticated Data API roles have no scoreboard access', () => {
	assert.match(schema, /ALTER TABLE public\.scoreboards ENABLE ROW LEVEL SECURITY/);
	assert.match(schema, /ALTER TABLE public\.scoreboard_shares ENABLE ROW LEVEL SECURITY/);
	assert.match(schema, /REVOKE ALL ON public\.scoreboards, public\.scoreboard_shares FROM PUBLIC, anon/);
	assert.doesNotMatch(schema, /TO anon/);
});

test('browser exchanges a Neon Auth session for a short-lived Data API JWT', () => {
	assert.match(client, /credentials: 'include'/);
	assert.match(client, /'token'/);
	assert.match(client, /Authorization', `Bearer \$\{token\}`/);
	assert.match(gate, /sign-in\/email/);
	assert.match(gate, /sign-up\/email/);
	assert.doesNotMatch(gate, /prompt\(|editor key/i);
});

test('scoreboards and share invitations are stored in Neon instead of browser storage or Netlify Blobs', () => {
	assert.match(scoreboard, /scoreboards\?select=id,owner_id,title,pitchers/);
	assert.match(scoreboard, /scoreboard_shares/);
	assert.doesNotMatch(scoreboard, /localStorage|sessionStorage|bridgette-editor-token|\/api\/bridgette/);
	assert.doesNotMatch(netlify, /\/api\/bridgette|netlify\/functions/);
});

test('account, data, and share failures use Sonner while rendering uses the shared error boundary', () => {
	assert.match(errs, /console\.error/);
	assert.match(errs, /toast\.error/);
	assert.match(gate, /notifyError\('Account sign-in'/);
	assert.match(gate, /notifyError\('Account sign-out'/);
	assert.match(scoreboard, /notifyError\('Scoreboard save'/);
	assert.match(scoreboard, /notifyError\('Scoreboard load'/);
	assert.match(scoreboard, /notifyError\('Scoreboard share'/);
	assert.match(boundary, /@terra-symposium\/error-boundaries\/react/);
	assert.doesNotMatch(gate, /role='alert'/);
	assert.doesNotMatch(scoreboard, /<Alert|role='alert'/);
});

test('Sonner is mounted with rich colors and a saturated accessible error surface', () => {
	assert.match(gate, /<Toaster[^>]*richColors/);
	assert.match(gate, /toast-error-saturated/);
	assert.match(styles, /\.toast-error-saturated\[data-sonner-toast\]/);
	assert.match(styles, /background:\s*#c1123f/);
	assert.match(styles, /color:\s*#fffaf0/);
});
