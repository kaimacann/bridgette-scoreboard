import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const [css, layout, scoreboard, imageTheme] = await Promise.all([
	readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
	readFile(new URL('../src/layouts/SiteLayout.astro', import.meta.url), 'utf8'),
	readFile(new URL('../src/components/scoreboard.tsx', import.meta.url), 'utf8'),
	readFile(new URL('../src/components/tile.ts', import.meta.url), 'utf8'),
]);
const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

function token(name) {
	const match = css.match(new RegExp(`--${name}:\\s*(\\d{1,3} \\d{1,3} \\d{1,3})`, 'i'));
	assert.ok(match, `Expected CSS theme token --${name}`);
	return match[1].split(' ').map(Number);
}

function luminance(rgb) {
	const channels = rgb.map(channel => channel / 255);
	const linear = channels.map(value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
	const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
	return (values[0] + 0.05) / (values[1] + 0.05);
}

test('primary and secondary Radix-style scales define all twelve light tokens', () => {
	for (const scale of ['primary', 'secondary']) {
		for (let step = 1; step <= 12; step += 1) assert.match(css, new RegExp(`--${scale}-${step}:\\s*\\d{1,3} \\d{1,3} \\d{1,3}`));
	}
});

test('cream page surface and burgundy brand surface use semantic theme tokens', () => {
	assert.match(layout, /bg-primary-1/);
	assert.match(layout, /text-primary-12/);
	assert.match(scoreboard, /bg-secondary-12[^\n]*text-secondary-1/);
	assert.match(page, /bg-primary-1/);
	assert.match(scoreboard, /bg-primary-1 pr-6/);
	assert.deepEqual(token('primary-1'), [255, 250, 240]);
	assert.deepEqual(token('secondary-12'), [100, 23, 43]);
});

test('primary and burgundy surfaces retain readable text contrast', () => {
	assert.ok(contrast(token('primary-1'), token('primary-12')) >= 7);
	assert.ok(contrast(token('secondary-12'), token('secondary-1')) >= 7);
});

test('Playball is loaded locally and used by the scoreboard title', async () => {
	assert.match(css, /font-family:\s*'Playball'/);
	assert.match(scoreboard, /fontFamily:\s*'"Playball", cursive'/);
	const font = await readFile(new URL('../public/fonts/Playball-Regular.ttf', import.meta.url));
	assert.ok(font.byteLength > 100_000);
	assert.match(await readFile(new URL('../public/fonts/Playball-OFL.txt', import.meta.url), 'utf8'), /SIL OPEN FONT LICENSE/i);
});

test('Bridgette illustrations use color-burn blending over the cream canvas', () => {
	assert.match(imageTheme, /mix-blend-color-burn/);
	assert.doesNotMatch(imageTheme, /grayscale/);
	assert.match(scoreboard, /bg-primary-1 pr-6/);
	assert.match(scoreboard, /alt='Illustration of Bridgette batting'/);
	assert.match(scoreboard, /alt='Illustration of the pitcher'/);
});

test('score controls expose names and use the cream and burgundy palette', () => {
	assert.match(scoreboard, /aria-label='Decrease strike count'/);
	assert.match(scoreboard, /aria-label='Increase strike count'/);
	assert.match(scoreboard, /bg-secondary-1 text-secondary-12/);
	assert.match(scoreboard, /bg-primary-12[^\n]*text-primary-1/);
});
