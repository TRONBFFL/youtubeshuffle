import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('App error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border rounded-lg p-6 space-y-4 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
