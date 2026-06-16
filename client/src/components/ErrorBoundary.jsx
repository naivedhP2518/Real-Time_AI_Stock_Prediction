/**
 * @file ErrorBoundary.jsx
 * @description React Error Boundary that catches runtime rendering errors.
 *              Displays a styled fallback UI instead of blank screen.
 *              Logs errors in production for monitoring.
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    }

    // In production: send to monitoring service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error(`[ErrorBoundary] ${this.state.errorId}:`, error.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      // Default styled error UI
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Animated Error Icon */}
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Content */}
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-1">
              An unexpected error occurred in the application.
            </p>
            {this.state.errorId && (
              <p className="text-slate-600 text-xs mb-6 font-mono">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Error Details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left bg-slate-800 rounded-xl p-4 border border-red-500/20">
                <summary className="text-red-400 text-sm font-medium cursor-pointer mb-2">
                  Developer Details
                </summary>
                <pre className="text-xs text-slate-400 overflow-auto max-h-40 mt-2">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl
                           transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl
                           transition-all duration-200 active:scale-95"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// ─── Functional Wrapper for convenience ──────────────────────────────────────
export const withErrorBoundary = (Component, fallback = null) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
