/**
 * tailwind.preset.ts
 *
 * @file Tailwind CSS Preset
 *
 * This file defines a reusable Tailwind CSS config preset.
 * It includes a custom theme with color palettes, font families,
 * animations, and other design tokens. It also configures several
 * Tailwind CSS plugins to extend the framework's functionality.
 *
 * This preset is intended to be used in the main `tailwind.config.js`
 * file to ensure a consistent design system across the project.
 *
 * @see https://tailwindcss.com/docs/presets
 */

/*//////////////////////////////////////////////////
IMPORTS
//////////////////////////////////////////////////*/

// API
import headlessui from '@headlessui/tailwindcss';
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';
import scrimGradients from 'tailwindcss-scrim-gradients';
import plugin from 'tailwindcss/plugin.js';

// TYPES
import type { Config, PluginUtils } from 'tailwindcss/types/config';

/*//////////////////////////////////////////////////
HELPERS
//////////////////////////////////////////////////*/

/**
 * Applies the apply Opacity Value.
 *
 * @param variable - The variable to inspect.
 */
const applyOpacityValue = (variable: string) => {
	return (prop: Partial<{ opacityVariable: string; opacityValue: number }>) => {
		const opacityValue = prop?.opacityValue;
		return `rgb(var(${variable}) / ${opacityValue || '100'})`;
	};
};

const transform =
	'translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)) ';

const preset: Omit<Config, 'content'> = {
	darkMode: ['variant', ['@media (prefers-color-scheme: dark) { &:not(.light *, .light) }', '&:is(.dark *, .dark)']],
	theme: {
		extend: {
			keyframes: {
				fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
				shimmer: {
					'0%, 20%': { maskPosition: '0 0', backgroundClip: 'text', maskImage: 'linear-gradient(110deg,white,45%,rgba(0,0,0,0.6),55%,white)', maskSize: '250% 100%' },
					'80%, 100%': { maskPosition: '-200% 0', backgroundClip: 'text', maskImage: 'linear-gradient(110deg,white,45%,rgba(0,0,0,0.6),55%,white)', maskSize: '250% 100%' },
				},
				wiggle: {
					'0%, 100%': { transform: transform + 'rotate(-2deg)' },
					'50%': { transform: transform + 'rotate(2deg)' },
				},
				blink: {
					'0%,70%,100%': { opacity: '1' },
					'20%,50%': { opacity: '0' },
				},
				scaleIn: {
					'0%': { transform: transform + 'scale(0.95)', opacity: '0' },
					'100%': { transform: transform + 'scale(1)', opacity: '1' },
				},
				error: {
					'10%, 90%': { transform: transform + 'translateX(-1px)' },
					'20%, 80%': { transform: transform + 'translateX(2px)' },
					'30%, 50%, 70%': { transform: transform + 'translateX(-4px)' },
					'40%, 60%': { transform: transform + 'translateX(4px)' },
				},
			},
			animation: {
				'fade-in': 'fadeIn 150ms ease-in-out',
				shimmer: 'shimmer 6s ease-in-out infinite alternate',
				wiggle: 'wiggle 0.25s ease-in-out infinite',
				blink: 'blink 1.25s ease-out infinite',
				'scale-in': 'scaleIn 300ms ease-out',
				error: 'error 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
			},
			// prettier-ignore
			backgroundImage: {'gradient-from-c': 'radial-gradient(circle at center, var(--tw-gradient-stops))'},
			// prettier-ignore
			transitionTimingFunction: {'quad-in-out': 'cubic-bezier(0.46,0.03,0.52,0.96);'},
			// prettier-ignore
			fontFamily: {
				sans: [ 'Authentic Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen-Sans', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif', ],
				serif: [ 'Avara', 'Authentic Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen-Sans', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'sans-serif', ],
			},
			borderRadius: { 100: '100%' },
			colors: {
				primary: (() => {
					const legacy = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
					const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
					return Object.fromEntries([...legacy.map(n => [n, applyOpacityValue(`--primary${n}`)]), ...scale.map(n => [n, applyOpacityValue(`--primary-${n}`)])] as (
						number | ReturnType<typeof applyOpacityValue>
					)[][]) as Record<number, ReturnType<typeof applyOpacityValue>>;
				})(),
				gray: Object.fromEntries([...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => [n, applyOpacityValue(`--gray-${n}`)])]) as Record<number, ReturnType<typeof applyOpacityValue>>,
				secondary: (() => {
					const legacy = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
					const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
					return Object.fromEntries([...legacy.map(n => [n, applyOpacityValue(`--secondary${n}`)]), ...scale.map(n => [n, applyOpacityValue(`--secondary-${n}`)])] as (
						number | ReturnType<typeof applyOpacityValue>
					)[][]) as Record<number, ReturnType<typeof applyOpacityValue>>;
				})(),
				accent: applyOpacityValue('--accent'),
				'accent-foreground': applyOpacityValue('--accent-foreground'),
				ring: applyOpacityValue('--ring'),
				background: applyOpacityValue('--background'),
			},
			ringColor: { ring: applyOpacityValue('--ring') },
			ringOffsetColor: { background: applyOpacityValue('--background') },
			scale: { 175: '1.75', 200: '2' },
			minWidth: ({ theme }: PluginUtils) => ({
				...(theme('maxWidth') as Record<string, string>),
			}),
			// Simple 20 column grid
			gridTemplateColumns: { 20: 'repeat(20, minmax(0, 1fr))' },
			// Simple 20 row grid
			gridTemplateRows: { 20: 'repeat(20, minmax(0, 1fr))' },
			gridColumn: {
				'span-13': 'span 13 / span 13',
				'span-14': 'span 14 / span 14',
				'span-15': 'span 15 / span 15',
				'span-16': 'span 16 / span 16',
				'span-17': 'span 17 / span 17',
				'span-18': 'span 18 / span 18',
				'span-19': 'span 19 / span 19',
				'span-20': 'span 20 / span 20',
			},
			gridRow: {
				'span-7': 'span 7 / span 7',
				'span-8': 'span 8 / span 8',
				'span-9': 'span 9 / span 9',
				'span-10': 'span 10 / span 10',
				'span-11': 'span 11 / span 11',
				'span-12': 'span 12 / span 12',
				'span-13': 'span 13 / span 13',
				'span-14': 'span 14 / span 14',
				'span-15': 'span 15 / span 15',
				'span-16': 'span 16 / span 16',
				'span-17': 'span 17 / span 17',
				'span-18': 'span 18 / span 18',
				'span-19': 'span 19 / span 19',
				'span-20': 'span 20 / span 20',
			},
			// prettier-ignore
			gridColumnStart: {13:'13',14:'14',15:'15',16:'16',17:'17',18:'18',19:'19',20:'20',21:'21',},
			// prettier-ignore
			gridRowStart: {8:'8',9:'9',10:'10',11:'11',12:'12',13:'13',14:'14',15:'15',16:'16',17:'17',18:'18',19:'19',20:'20',21:'21',},
			// prettier-ignore
			gridColumnEnd: {13:'13',14:'14',15:'15',16:'16',17:'17',18:'18',19:'19',20:'20',21:'21',},
			// prettier-ignore
			gridRowEnd: { 8: '8', 9: '9', 10: '10', 11: '11', 12: '12', 13: '13', 14: '14', 15: '15', 16: '16', 17: '17', 18: '18', 19: '19', 20: '20', 21: '21' },
			typography: ({ theme }: PluginUtils) => ({
				DEFAULT: {
					css: {
						'--tw-prose-body': theme('colors.gray[11]'),
						'--tw-prose-headings': theme('colors.gray[12]'),
						'--tw-prose-lead': theme('colors.gray[10]'),
						'--tw-prose-links': theme('colors.gray[12]'),
						'--tw-prose-bold': theme('colors.gray[12]'),
						'--tw-prose-counters': theme('colors.primary[600]'),
						'--tw-prose-bullets': theme('colors.primary[400]'),
						'--tw-prose-hr': theme('colors.gray[7]'),
						'--tw-prose-quotes': theme('colors.gray[12]'),
						'--tw-prose-quote-borders': theme('colors.gray[7]'),
						'--tw-prose-captions': theme('colors.gray[10]'),
						'--tw-prose-code': theme('colors.gray[12]'),
						'--tw-prose-pre-code': theme('colors.gray[3]'),
						'--tw-prose-pre-bg': theme('colors.gray[12]'),
						'--tw-prose-th-borders': theme('colors.gray[7]'),
						'--tw-prose-td-borders': theme('colors.gray[6]'),
						'code::before': false,
						'code::after': false,
						strong: { color: 'inherit' },
						a: {
							position: 'relative',
							fontWeight: theme('fontWeight.semibold'),
							textDecoration: 'underline',
							textUnderlineOffset: '3px',
						},
						h1: { color: 'inherit' },
						h2: { color: 'inherit' },
						h3: { color: 'inherit' },
						h4: { color: 'inherit' },
						h5: { color: 'inherit' },
						h6: { color: 'inherit' },
						'a:hover': { textUnderlineOffset: '3px' },
						// set color with opacity
						blockquote: { color: 'var(--primary-7)', borderLeftColor: 'rgba(var(--primary-7), 0.5)' },
						'li::marker': { color: 'var(--primary-7)' },
					},
				},
			}),
		},
	},
	plugins: [
		typography,
		headlessui,
		scrimGradients,
		animate,
		plugin(function ({ addVariant, matchVariant }) {
			addVariant('hocus', ['&:hover', '&:focus']);
			addVariant('hocus-visible', ['&:hover', '&:focus-visible']);
			addVariant('enabled', '&:not(:disabled)');
			// Default value for `child:`
			matchVariant('*', value => `:where(& > ${value.replace(/_/g, ' ')})`, { values: { DEFAULT: '*' } });
		}),
	],
};

export default preset;
