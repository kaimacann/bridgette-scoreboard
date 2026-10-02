import { toast } from 'sonner';

/** Logs an operation failure and displays its safe message as a Sonner toast.
 * @param scope Short operation name included in the diagnostic log entry.
 * @param cause Original thrown value, normalized to an Error for reporting.
 * @param fallback User-facing message used when the error has no useful text.
 */
export function notifyError(scope: string, cause: unknown, fallback: string): void {
	const error = cause instanceof Error ? cause : new Error(String(cause));
	console.error(`[${scope}] ${error.message || fallback}`, error);
	toast.error(error.message.trim() || fallback);
}
