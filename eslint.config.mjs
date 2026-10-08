import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
	{ ignores: ['dist/**', '.astro/**', '.netlify/**', 'node_modules/**'] },
	js.configs.recommended,
	...ts.configs.recommended,
	...astro.configs['flat/recommended'],
	{
		files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		plugins: { 'unused-imports': unusedImports },
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': ['error', { vars: 'local', varsIgnorePattern: '^_', args: 'all', argsIgnorePattern: '^_', caughtErrors: 'all', caughtErrorsIgnorePattern: '^_' }],
		},
	},
];
