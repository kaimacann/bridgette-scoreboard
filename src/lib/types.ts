import type React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { BUTTON_VARIANTS } from '../components/ui/variants';

/** One pitcher's displayed name, stable identifier, and current strike count. */
export type PitcherData = { id: string; name: string; strikes: number };
/** Legacy-compatible scoreboard payload containing its pitcher rows. */
export type BridgetteDashboardData = { pitchers: PitcherData[] };
/** Native button attributes combined with the shared variant options. */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof BUTTON_VARIANTS> & { asChild?: boolean };
