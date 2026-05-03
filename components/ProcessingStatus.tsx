import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Clock, Loader2, Download } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusEnum, StatusResponse } from '../src/types';
import { pollProcessingStatus } from '../utils/api';

interface ProcessingStatusProps {
    recordId: string;
    onComplete?: (resultUrl: string) => void;
    onError?: (error: string) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ recordId, onComplete, onError }) => {
    const [status, setStatus] = useState<ProcessingStatusEnum>(ProcessingStatusEnum.Polling);
    const [currentStatus, setCurrentStatus] = useState<string>('Pending');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        const cleanup = pollProcessingStatus(
            recordId,
            (statusData: StatusResponse) => {
                setCurrentStatus(statusData.status);
                setPollCount((prev) => prev + 1);
            },
            (statusData: StatusResponse) => {
                setStatus(ProcessingStatusEnum.Completed);
                if (statusData.resultUrl) {
                    setResultUrl(statusData.resultUrl);
                    onComplete?.(statusData.resultUrl);
                }
            },
            (error: string) => {
                setStatus(ProcessingStatusEnum.Failed);
                setErrorMessage(error);
                onError?.(error);
            },
            () => {
                setStatus(ProcessingStatusEnum.Timeout);
            }
        );
        return cleanup;
    }, [recordId, onComplete, onError]);

    if (status === ProcessingStatusEnum.Completed && resultUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-clay-bg flex flex-col">
                <div className="text-center pt-8 pb-4 px-4">
                    <CheckCircle2 size={64} strokeWidth={2.5} className="mx-auto mb-3 text-green-600" aria-hidden />
                    <h2 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl">
                        Your career photo is ready!
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
                    <img
                        src={resultUrl}
                        alt="Your career portrait"
                        className="max-w-full max-h-full object-contain rounded-clay shadow-clay"
                    />
                </div>
                <div className="flex justify-center pb-8 px-4">
                    <a
                        href={resultUrl}
                        download
                        className="clay-press-fx inline-flex items-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-4 px-8 shadow-clay"
                    >
                        <Download size={24} strokeWidth={2.5} aria-hidden />
                        Download photo
                    </a>
                </div>
            </div>
        );
    }

    if (status === ProcessingStatusEnum.Failed) {
        return (
            <div role="alert" className="text-center p-6 bg-red-50 rounded-clay border-2 border-red-200 space-y-3">
                <AlertCircle size={56} strokeWidth={2.5} className="mx-auto text-red-600" aria-hidden />
                <h3 className="font-heading font-bold text-red-800 text-2xl">Photo processing failed</h3>
                <p className="font-body text-red-700">{errorMessage || 'Something went wrong'}</p>
                <p className="font-body text-red-600 text-sm">Please tell your teacher — we'll try again.</p>
            </div>
        );
    }

    if (status === ProcessingStatusEnum.Timeout) {
        return (
            <div role="alert" className="text-center p-6 bg-amber-50 rounded-clay border-2 border-amber-200 space-y-3">
                <Clock size={56} strokeWidth={2.5} className="mx-auto text-amber-600" aria-hidden />
                <h3 className="font-heading font-bold text-amber-800 text-2xl">Still working…</h3>
                <p className="font-body text-amber-700">
                    Your photo is taking longer than usual. Refresh later or ask your teacher for help.
                </p>
                <code className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
                    Record ID: {recordId}
                </code>
            </div>
        );
    }

    return (
        <div className="text-center p-8 bg-clay-surface rounded-clay shadow-clay space-y-4" role="status" aria-live="polite">
            <Loader2 size={64} strokeWidth={2.5} className="mx-auto text-clay-primary animate-spin" aria-hidden />
            <h3 className="font-heading font-bold text-clay-ink text-2xl">
                Creating your career photo…
            </h3>
            <p className="font-body text-clay-ink-soft">
                {(currentStatus === '待處理' || currentStatus === 'Pending') && 'Getting ready…'}
                {(currentStatus === '處理中' || currentStatus === 'Processing') && 'Working hard on it…'}
                {(currentStatus === '問卷中' || currentStatus === 'In Quiz') && 'Preparing…'}
            </p>
            <p className="font-body text-clay-ink-soft text-sm">Checked {pollCount} times.</p>
        </div>
    );
};

export default ProcessingStatus;
