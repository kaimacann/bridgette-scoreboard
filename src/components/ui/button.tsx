import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@utils';
import { BUTTON_VARIANTS } from './variants';
import type { VariantProps } from 'class-variance-authority';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof BUTTON_VARIANTS> & { asChild?: boolean }>(({ className, variant, size, asChild, ...props }, ref) => {
	const Component = asChild ? Slot : 'button';
	return <Component ref={ref} className={cn(BUTTON_VARIANTS({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
