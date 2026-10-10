import React from 'react';
import { cn } from '@utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
	<input ref={ref} className={cn('rounded border px-3 py-2', className)} {...props} />
));
Input.displayName = 'Input';
