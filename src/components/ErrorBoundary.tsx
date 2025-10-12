import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

// Generic ErrorBoundary component for wrapping content
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }
      
      return (
        <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Something went wrong
            </h3>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom error component for TanStack Router
export const RootErrorComponent = ({ error }: { error: Error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Something went wrong
            </h3>
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">An error occurred while loading this page:</p>
          <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </div>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}

// Export ErrorBoundary as default for compatibility
export default ErrorBoundary;