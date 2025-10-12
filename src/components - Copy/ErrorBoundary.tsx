
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorRecoveryManager } from '../utils/errorRecovery';
import { classifyError, ErrorType, ErrorSeverity } from '../utils/errorRecovery';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorClassification: any;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryLimit?: number;
  retryDelay?: number;
  context?: string;
  showDetails?: boolean;
  autoRetry?: boolean;
  errorReporting?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorClassification: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Classify the error
    const errorClassification = classifyError(error);

    this.setState({
      errorInfo,
      errorClassification
    });

    // Log error to recovery manager
    errorRecoveryManager.handleError(error, this.props.context || 'ErrorBoundary');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry if enabled
    if (this.props.autoRetry && this.state.retryCount < (this.props.retryLimit || 3)) {
      this.scheduleRetry();
    }

    // Report error if enabled
    if (this.props.errorReporting) {
      this.reportError(error, errorInfo, errorClassification);
    }
  }

  private scheduleRetry = () => {
    const delay = this.props.retryDelay || 2000;
    
    this.setState({ isRetrying: true });
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorClassification: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
  };

  private handleRetry = () => {
    if (this.state.retryCount >= (this.props.retryLimit || 3)) {
      return;
    }

    this.scheduleRetry();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorClassification: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  private reportError = (error: Error, errorInfo: ErrorInfo, classification: any) => {
    // In a real application, you would send this to an error reporting service
    console.error('Error Report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      classification,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NETWORK:
        return '🌐';
      case ErrorType.AUTHENTICATION:
        return '🔐';
      case ErrorType.AUTHORIZATION:
        return '🚫';
      case ErrorType.VALIDATION:
        return '⚠️';
      case ErrorType.CONFLICT:
        return '⚡';
      case ErrorType.SERVER:
        return '🖥️';
      case ErrorType.TIMEOUT:
        return '⏰';
      default:
        return '❌';
    }
  };

  private getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'var(--color-success)';
      case ErrorSeverity.MEDIUM:
        return 'var(--color-warning)';
      case ErrorSeverity.HIGH:
        return 'var(--color-error)';
      case ErrorSeverity.CRITICAL:
        return 'var(--color-critical)';
      default:
        return 'var(--color-text)';
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorClassification, retryCount, isRetrying } = this.state;
      const maxRetries = this.props.retryLimit || 3;
      const canRetry = retryCount < maxRetries;

      return (
        <div className="error-boundary">
          <div className="error-boundary-container">
            <div className="error-header">
              <div className="error-icon">
                {errorClassification ? this.getErrorIcon(errorClassification.type) : '❌'}
              </div>
              <div className="error-title">
                <h2>Something went wrong</h2>
                {errorClassification && (
                  <span 
                    className="error-severity"
                    style={{ color: this.getSeverityColor(errorClassification.severity) }}
                  >
                    {errorClassification.severity} Severity
                  </span>
                )}
              </div>
            </div>

            <div className="error-message">
              <p>{error?.message || 'An unexpected error occurred'}</p>
              {errorClassification && (
                <p className="error-type">
                  Error Type: {errorClassification.type.replace(/_/g, ' ')}
                </p>
              )}
            </div>

            <div className="error-actions">
              {canRetry && (
                <button 
                  className="error-button retry-button"
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : `Retry (${retryCount + 1}/${maxRetries})`}
                </button>
              )}
              
              <button 
                className="error-button reset-button"
                onClick={this.handleReset}
              >
                Reset
              </button>

              <button 
                className="error-button report-button"
                onClick={() => this.reportError(error!, errorInfo!, errorClassification)}
              >
                Report Issue
              </button>
            </div>

            {this.props.showDetails && errorInfo && (
              <div className="error-details">
                <details>
                  <summary>Error Details</summary>
                  <div className="error-stack">
                    <h4>Component Stack:</h4>
                    <pre>{errorInfo.componentStack}</pre>
                    {error?.stack && (
                      <>
                        <h4>Error Stack:</h4>
                        <pre>{error.stack}</pre>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            {errorClassification && (
              <div className="error-suggestions">
                <h4>Suggestions:</h4>
                <ul>
                  {errorClassification.type === ErrorType.NETWORK && (
                    <li>Check your internet connection and try again</li>
                  )}
                  {errorClassification.type === ErrorType.AUTHENTICATION && (
                    <li>Please log in again to continue</li>
                  )}
                  {errorClassification.type === ErrorType.AUTHORIZATION && (
                    <li>You don't have permission to perform this action</li>
                  )}
                  {errorClassification.type === ErrorType.VALIDATION && (
                    <li>Please check your input and try again</li>
                  )}
                  {errorClassification.type === ErrorType.CONFLICT && (
                    <li>This data has been modified by another user. Please refresh and try again</li>
                  )}
                  {errorClassification.type === ErrorType.TIMEOUT && (
                    <li>The operation took too long. Please try again</li>
                  )}
                  {errorClassification.type === ErrorType.SERVER && (
                    <li>Server error. Please try again later</li>
                  )}
                  <li>If the problem persists, contact support</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error boundary context
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = React.useState<ErrorInfo | null>(null);

  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    setError(error);
    setErrorInfo(errorInfo);
    
    // Log to recovery manager
    errorRecoveryManager.handleError(error, 'useErrorBoundary');
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  return {
    error,
    errorInfo,
    handleError,
    clearError,
    hasError: !!error
  };
};

// Error boundary for specific error types
export const NetworkErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    context="NetworkErrorBoundary"
    autoRetry={true}
    retryLimit={3}
    retryDelay={2000}
    showDetails={false}
    onError={(error) => {
      const classification = classifyError(error);
      if (classification.type === ErrorType.NETWORK) {
        console.warn('Network error detected, will retry automatically');
      }
    }}
  >
    {children}
  </ErrorBoundary>
);

export const AuthenticationErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    context="AuthenticationErrorBoundary"
    autoRetry={false}
    showDetails={false}
    onError={(error) => {
      const classification = classifyError(error);
      if (classification.type === ErrorType.AUTHENTICATION) {
        // Redirect to login or show login modal
        console.warn('Authentication error detected');
      }
    }}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary; 