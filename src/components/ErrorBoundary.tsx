import React from 'react';
import { toast } from 'sonner';

/** Inputs used to label and render a guarded scoreboard section. */
type Props = {
	name: string;
	children: React.ReactNode;
	fallback?: (error: Error) => React.ReactNode;
};
/** Error state captured while rendering the guarded section. */
type State = { error: Error | null };

/** Catches child render failures and reports them through the shared toast UI. */
export class ErrorBoundary extends React.Component<Props, State> {
	state: State = { error: null };

	/** Stores the caught render error so the component can show its fallback.
	 * @param error Exception raised while rendering a descendant.
	 * @returns State containing the captured exception.
	 */
	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	/** Logs the render failure and reports a readable toast to the user.
	 * @param error Exception raised while rendering a descendant.
	 */
	componentDidCatch(error: Error): void {
		console.error(`${this.props.name} failed to render`, error);
		toast.error(`${this.props.name} could not be displayed.`);
	}

	render(): React.ReactNode {
		if (this.state.error) return this.props.fallback?.(this.state.error) ?? null;
		return this.props.children;
	}
}
