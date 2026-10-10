import React from 'react';
import * as Primitive from '@radix-ui/react-select';
import { cn } from '@utils';
import { controlClasses, surfaceClasses } from './variants';
import type { ControlVariant, SurfaceVariant, UiSize } from './variants';

export const Select = Primitive.Root;
type SelectTriggerProps = Omit<React.ComponentProps<typeof Primitive.Trigger>, 'size'> & {
	variant?: ControlVariant;
	size?: UiSize;
};

export const SelectTrigger = ({ className, children, variant, size, ...props }: SelectTriggerProps): React.JSX.Element => (
	<Primitive.Trigger className={cn(controlClasses(variant, size), 'inline-flex items-center justify-between gap-3', className)} {...props}>
		{children}
	</Primitive.Trigger>
);
export const SelectValue = Primitive.Value;
type SelectContentProps = Omit<React.ComponentProps<typeof Primitive.Content>, 'variant'> & {
	variant?: SurfaceVariant;
};

export const SelectContent = ({ className, children, variant, ...props }: SelectContentProps): React.JSX.Element => (
	<Primitive.Portal>
		<Primitive.Content className={cn('z-[110] min-w-32 overflow-hidden p-1 shadow-lg', surfaceClasses(variant), className)} position='popper' {...props}>
			<Primitive.Viewport>{children}</Primitive.Viewport>
		</Primitive.Content>
	</Primitive.Portal>
);
export const SelectItem = ({ className, children, ...props }: React.ComponentProps<typeof Primitive.Item>): React.JSX.Element => (
	<Primitive.Item
		className={cn(
			'relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100',
			className,
		)}
		{...props}
	>
		<Primitive.ItemText>{children}</Primitive.ItemText>
	</Primitive.Item>
);
export const SelectSeparator = (): React.JSX.Element => <Primitive.Separator className='my-1 h-px bg-slate-200' />;
