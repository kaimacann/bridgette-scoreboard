import React from 'react';
import { toast } from 'sonner';

type Props = { name: string; children: React.ReactNode; fallback?: (error: Error) => React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error): void {
		console.error(`${this.props.name} failed to render`, error);
		toast.error(`${this.props.name} could not be displayed.`);
	}

	render(): React.ReactNode {
		if (this.state.error) return this.props.fallback?.(this.state.error) ?? null;
		return this.props.children;
	}
}
