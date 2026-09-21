import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface BusyScreenProps {
    title: string;
    subtitle?: string;
    error?: string | null;
    onRetry?: () => void;
}

const BusyScreen: React.FC<BusyScreenProps> = ({ title, subtitle, error, onRetry }) => (
    <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md md:max-w-xl">
            {error ? (
                <div role="alert" className="bg-clay-surface rounded-clay shadow-clay p-8 text-center space-y-4">
                    <AlertCircle size={56} strokeWidth={2.5} className="mx-auto text-clay-danger" aria-hidden />
                    <h1 className="font-heading font-bold text-clay-danger text-2xl">Hmm, that didn't work.</h1>
                    <p className="font-body text-clay-ink-soft whitespace-pre-line">{error}</p>
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="clay-press-fx rounded-full bg-clay-primary text-white font-heading font-bold py-4 px-8 shadow-clay hover:bg-clay-primary-press"
                        >
                            Try again
                        </button>
                    )}
                </div>
            ) : (
                <div role="status" aria-live="polite" className="bg-clay-surface rounded-clay shadow-clay p-8 text-center space-y-4">
                    <Loader2 size={64} strokeWidth={2.5} className="mx-auto text-clay-primary animate-spin" aria-hidden />
                    <h1 className="font-heading font-bold text-clay-ink text-2xl">{title}</h1>
                    {subtitle && <p className="font-body text-clay-ink-soft">{subtitle}</p>}
                </div>
            )}
        </div>
    </main>
);

export default BusyScreen;
