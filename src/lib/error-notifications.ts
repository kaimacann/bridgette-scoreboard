import { toast } from 'sonner';

/** Logs an operation failure and displays its safe message as a Sonner toast. */
export function notifyError(scope: string, cause: unknown, fallback: string): void {
	const error = cause instanceof Error ? cause : new Error(String(cause));
	console.error(`[${scope}] ${error.message || fallback}`, error);
	toast.error(error.message.trim() || fallback);
}
