import React from 'react';
import { cn } from '@utils';
import { colorForVariant, controlClasses, inputAccentClasses } from './variants';
import type { ControlVariant, UiSize } from './variants';

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
	size?: UiSize;
	variant?: ControlVariant;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, size, variant, type, ...props }, ref) => {
	const classes = type === 'hidden' ? className : type === 'checkbox' || type === 'radio' ? cn(inputAccentClasses[colorForVariant(variant)], className) : cn(controlClasses(variant, size), className);

	return <input ref={ref} type={type} className={classes} {...props} />;
});
Input.displayName = 'Input';
