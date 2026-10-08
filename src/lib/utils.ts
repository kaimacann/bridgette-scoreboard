import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
export const isRec = (val: unknown): val is Record<string, unknown> => Boolean(val && typeof val === 'object' && !Array.isArray(val));
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumber = (val: unknown): val is number => typeof val === 'number' && Number.isFinite(val);
