import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left bg-secondary p-3 rounded-lg mb-4">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRefresh}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;