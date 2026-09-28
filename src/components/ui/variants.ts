import { cva } from 'class-variance-authority';

export const BUTTON_VARIANTS = cva('inline-flex items-center justify-center gap-2 rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50', {
	variants: {
		variant: {
			default: 'bg-cyan-700 text-white hover:bg-cyan-800',
			tonal: 'border border-cyan-800 bg-cyan-300 text-cyan-950',
			secondary: 'border border-yellow-700 bg-yellow-300 text-yellow-950',
			destructive: 'border border-rose-700 bg-rose-600 text-white',
			outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-100',
			ghost: 'hover:bg-gray-100',
			inline: 'underline-offset-4 hover:underline',
		},
		size: { default: 'h-10 px-4 py-2', xs: 'h-6 p-2 text-xs', sm: 'h-9 px-3', lg: 'h-11 px-8', xl: 'h-12 px-5 text-base', icon: 'size-10' },
	},
	defaultVariants: { variant: 'default', size: 'default' },
});
