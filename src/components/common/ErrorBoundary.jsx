import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

// Error boundaries must be class components — there's no hook equivalent for
// componentDidCatch/getDerivedStateFromError. Catches render-time errors in
// whatever it wraps and shows a friendly fallback instead of a blank white screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // No external error-reporting service wired up yet — console visibility is
    // the honest baseline here. Swap for Sentry/etc. later if that's wanted.
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return <DefaultErrorFallback reset={this.reset} />;
    }
    return this.props.children;
  }
}

const DefaultErrorFallback = ({ reset }) => {
  const homeHref = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? '/admin' : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle className="text-red-500" size={30} />
        </div>
        <h1 className="text-text-dark mb-3">Something Went Wrong</h1>
        <p className="text-text-muted mb-8 leading-relaxed">
          We hit an unexpected error loading this page. You can try again, or head back to a safe page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <RotateCcw size={18} />
            Try Again
          </button>
          <a
            href={homeHref}
            className="inline-flex items-center justify-center gap-2 bg-white border border-border text-text-dark font-semibold px-6 py-3 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            <Home size={18} />
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
