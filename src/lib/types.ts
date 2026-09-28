import type React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { BUTTON_VARIANTS } from '../components/ui/variants';

export type PitcherData = { id: string; name: string; strikes: number };
export type BridgetteDashboardData = { pitchers: PitcherData[] };
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof BUTTON_VARIANTS> & { asChild?: boolean };
