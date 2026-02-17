import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
          <div className="w-full max-w-md text-center">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
              <h2 className="text-xl font-semibold text-red-200">
                Something went wrong
              </h2>
              <p className="mt-3 text-sm text-red-200/70">
                {this.state.error.message}
              </p>
              <button
                type="button"
                onClick={this.reset}
                className="mt-6 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
