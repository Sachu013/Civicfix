import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary caught error]:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 max-w-4xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in">
                    <div className="flex items-center gap-4 text-rose-600 border-b border-slate-100 pb-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 font-display uppercase italic">
                                Component Render Exception Encountered
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold">
                                {this.props.title || 'An unexpected rendering error occurred in this view.'}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto space-y-2">
                        <p className="text-rose-400 font-bold">{this.state.error?.toString()}</p>
                        {this.state.errorInfo?.componentStack && (
                            <pre className="text-[10px] text-slate-400 leading-normal max-h-48 overflow-y-auto">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-slate-400 font-medium">
                            The rest of your portal application remains active. You can retry rendering or return to dashboard.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={this.handleReset}
                                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md"
                            >
                                <RefreshCw size={16} />
                                <span>Try Reloading View</span>
                            </button>
                            <a
                                href="/admin-dashboard"
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Home size={16} />
                                <span>Return to Dashboard</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
