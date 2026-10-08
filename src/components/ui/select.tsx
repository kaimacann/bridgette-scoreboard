import React from "react";
import * as Primitive from "@radix-ui/react-select";
import { cn } from "@utils";

export const Select = ({
  size: _size,
  ...props
}: React.ComponentProps<typeof Primitive.Root> & {
  size?: string;
}): React.JSX.Element => <Primitive.Root {...props} />;
export const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>): React.JSX.Element => (
  <Primitive.Trigger
    className={cn(
      "inline-flex h-10 items-center justify-between gap-3 rounded border px-3 text-sm outline-none focus-visible:ring-2",
      className,
    )}
    {...props}
  >
    {children}
  </Primitive.Trigger>
);
export const SelectValue = Primitive.Value;
export const SelectContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content>): React.JSX.Element => (
  <Primitive.Portal>
    <Primitive.Content
      className={cn(
        "z-[110] min-w-32 overflow-hidden rounded border bg-white p-1 shadow-lg",
        className,
      )}
      position="popper"
      {...props}
    >
      <Primitive.Viewport>{children}</Primitive.Viewport>
    </Primitive.Content>
  </Primitive.Portal>
);
export const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Item>): React.JSX.Element => (
  <Primitive.Item
    className={cn(
      "relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100",
      className,
    )}
    {...props}
  >
    <Primitive.ItemText>{children}</Primitive.ItemText>
  </Primitive.Item>
);
export const SelectSeparator = (): React.JSX.Element => (
  <Primitive.Separator className="my-1 h-px bg-slate-200" />
);
