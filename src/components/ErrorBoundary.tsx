import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  isChunkError?: boolean;
  reloadCountdown?: number;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  private autoReloadTimer: number | null = null;

  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
    
    // Detect chunk load failure (Vite/Vercel deployment issue)
    if (error instanceof TypeError && 
        error.message.includes('Failed to fetch dynamically imported module')) {
      this.setState({ 
        isChunkError: true,
        error 
      });
      
      // Auto-reload after 5 seconds
      this.autoReloadTimer = window.setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.autoReloadTimer) {
      window.clearTimeout(this.autoReloadTimer);
    }
  }

  private triggerReload = () => {
    if (this.autoReloadTimer) {
      window.clearTimeout(this.autoReloadTimer);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, isChunkError } = this.state;
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            {isChunkError ? (
              <>
                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  App Updated 🚀
                </h1>
                <p className="text-slate-400 mb-8 text-lg">
                  A new version is available! We'll refresh automatically in <strong id="countdown">5</strong> seconds.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                  Something went wrong
                </h1>
                <p className="text-slate-400 mb-8 text-lg">
                  We're sorry, an unexpected error occurred. Please refresh the page or try again later.
                </p>
              </>
            )}

            <div className="space-y-3">
              <button 
                onClick={this.triggerReload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
              >
                {isChunkError ? '🔄 Refresh Now' : '🔄 Refresh Page'}
              </button>
              <a 
                href="/" 
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                🏠 Go Home
              </a>
            </div>

            {isDev && error && (
              <details className="mt-8 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-sm">
                <summary className="cursor-pointer font-medium mb-2">Error Details (Dev)</summary>
                <pre className="text-red-200 whitespace-pre-wrap overflow-auto max-h-40">{error.stack}</pre>
              </details>
            )}
          </div>

          {/* Chunk error countdown */}
          {isChunkError && (
            <script dangerouslySetInnerHTML={{
              __html: `
                let countdown = 5;
                const countdownEl = document.getElementById('countdown');
                const timer = setInterval(() => {
                  countdown--;
                  if (countdownEl) countdownEl.textContent = countdown;
                  if (countdown <= 0) {
                    clearInterval(timer);
                    window.location.reload();
                  }
                }, 1000);
              `
            }} />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

