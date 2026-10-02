import { toast } from 'sonner';

export function notifyError(scope: string, cause: unknown, fallback: string): void {
	const error = cause instanceof Error ? cause : new Error(String(cause));
	console.error(`[${scope}] ${error.message || fallback}`, error);
	toast.error(error.message.trim() || fallback);
}
