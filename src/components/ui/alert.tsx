import { cn } from '@utils';

/**
 * Renders an inline status message using the scoreboard theme.
 * @param props Alert content, theme variant, and HTML attributes.
 * @returns The themed status message.
 */
export function Alert({
	className,
	variant = 'default',
	...props
}: React.HTMLAttributes<HTMLDivElement> & {
	variant?: 'default' | 'destructive';
}): React.JSX.Element {
	return (
		<div
			role='status'
			className={cn('rounded border p-3 text-sm', variant === 'destructive' ? 'border-rose-300 bg-rose-50 text-rose-950' : 'border-secondary-5 bg-primary-1 text-primary-12', className)}
			{...props}
		/>
	);
}

/**
 * Renders the heading for an inline alert.
 * @param props Heading text and HTML attributes.
 * @returns The styled alert heading.
 */
export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>): React.JSX.Element {
	return <h2 className={cn('font-semibold', className)} {...props} />;
}

/**
 * Renders descriptive text for an inline alert.
 * @param props Description text and HTML attributes.
 * @returns The styled alert description.
 */
export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): React.JSX.Element {
	return <p className={cn('text-sm', className)} {...props} />;
}

/**
 * Renders a titled destructive alert.
 * @param props The alert title and description.
 * @returns The destructive alert message.
 */
export function AlertError({ title, description }: { title: string; description: string }): React.JSX.Element {
	return (
		<Alert variant='destructive'>
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{description}</AlertDescription>
		</Alert>
	);
}
