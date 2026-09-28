import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
export const hasWindow = (): boolean => typeof window !== 'undefined';
export const isRec = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const toErrMsg = (value: unknown, fallback = 'Unexpected error.'): string => value instanceof Error ? value.message : typeof value === 'string' ? value : fallback;
export const error = (cause: unknown, payload?: unknown): Record<string, unknown> => ({ message: toErrMsg(cause), payload });
export const errorLog = (tag: string, message: string, payload?: unknown): void => console.error(`[${tag}] ${message}`, payload ?? '');
