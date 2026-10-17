import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled application error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isEnglish = typeof document !== 'undefined' && document.documentElement.lang === 'en';

      return (
        <div className="flex min-h-dvh items-center justify-center bg-app p-4">
          <div className="surface surface-border rounded-2xl p-8 text-center shadow-lg max-w-md w-full">
            <div className="mb-4 text-6xl font-persian text-primary-500">ف</div>
            <h1 className="text-xl font-bold mb-2">
              {isEnglish ? 'Something went wrong' : 'حدث خطأ ما'}
            </h1>
            <p className="text-muted mb-6 text-sm">
              {isEnglish
                ? 'An unexpected error occurred. Please reload the page to continue.'
                : 'حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة للمتابعة.'}
            </p>
            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <pre className="text-xs text-error-600 bg-error-50 dark:bg-error-950/30 p-2 rounded mb-4 text-start overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReload}>
              {isEnglish ? 'Reload Page' : 'إعادة تحميل الصفحة'}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
