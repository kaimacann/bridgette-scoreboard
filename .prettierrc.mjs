/** @type {import('prettier').Config} */
export default {
	arrowParens: 'avoid',
	jsxSingleQuote: true,
	plugins: ['prettier-plugin-astro'],
	printWidth: 200,
	proseWrap: 'never',
	singleQuote: true,
	useTabs: true,
	overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};
