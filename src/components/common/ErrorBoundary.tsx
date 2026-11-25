import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TUTeachLogo } from './Logo';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TUTeach] UI Error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('tuteach_auth_token');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EFEBDA] flex flex-col items-center justify-center p-6 text-[#393636] font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#393636]/10 text-center space-y-6">
            <div className="inline-block">
              <TUTeachLogo size="md" />
            </div>

            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-[#393636]">
                Application Notice
              </h1>
              <p className="text-sm text-gray-600">
                TUTeach encountered a temporary interface loading issue. Your courses and progress are secure.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-gray-50 rounded-xl text-left text-xs text-gray-500 font-mono overflow-auto max-h-24 border border-gray-200">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-[#F14C2F] hover:bg-[#d83c21] text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home & Clean Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
