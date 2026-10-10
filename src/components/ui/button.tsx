import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@utils';
import { ACTION_CLASSES, BUTTON_VARIANTS, normalizeActionSize, normalizeActionVariant } from './variants';
import type { ActionVariant, LegacyButtonSize, LegacyButtonVariant, UiSize } from './variants';

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & {
	variant?: ActionVariant | LegacyButtonVariant;
	size?: UiSize | LegacyButtonSize;
	asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
	const Component = asChild ? Slot : 'button';
	const normalizedVariant = normalizeActionVariant(variant);
	const buttonClasses =
		size === 'link'
			? cn(
					'inline-flex items-center justify-center gap-2 rounded-md border-0 bg-transparent p-0 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
					ACTION_CLASSES[normalizedVariant],
				)
			: cn(BUTTON_VARIANTS({ variant: normalizedVariant, size: normalizeActionSize(size) }), size === 'icon' && 'size-10 p-0');

	return <Component ref={ref} className={cn(buttonClasses, className)} {...props} />;
});
Button.displayName = 'Button';
