import { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Still visible in devtools/console even though the UI recovers gracefully.
    console.error("Xevio crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-3" />
          <h1 className="text-lg font-medium text-[#E8E1D5]">Something went wrong</h1>
          <p className="text-sm text-[#91887D] mt-1 max-w-sm">
            {this.state.error.message || "This page hit an unexpected error."}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.assign("/");
            }}
            className="mt-5 px-4 py-2 bg-[#C96B4B] hover:bg-[#E0805C] rounded-lg text-sm font-medium text-white transition-colors"
          >
            Go home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
