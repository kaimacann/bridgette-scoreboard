import React from 'react';
import { cn } from '@utils';

export const Alert = ({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }): React.JSX.Element => (
	<div role='status' className={cn('rounded border p-3 text-sm', variant === 'destructive' ? 'border-rose-300 bg-rose-50 text-rose-950' : 'border-slate-300', className)} {...props} />
);
export const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element => <h2 className={cn('font-semibold', className)} {...props} />;
export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element => <p className={cn('text-sm', className)} {...props} />;
export const AlertError = ({ title, description }: { title: string; description: string }): React.JSX.Element => (
	<Alert variant='destructive'><AlertTitle>{title}</AlertTitle><AlertDescription>{description}</AlertDescription></Alert>
);
