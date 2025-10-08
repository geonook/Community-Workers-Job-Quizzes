import React, { useEffect, useState } from 'react';
import { ProcessingStatus as ProcessingStatusEnum, StatusResponse } from '../src/types';
import { pollProcessingStatus } from '../utils/api';

interface ProcessingStatusProps {
    recordId: string;
    onComplete?: (resultUrl: string) => void;
    onError?: (error: string) => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
    recordId,
    onComplete,
    onError
}) => {
    const [status, setStatus] = useState<ProcessingStatusEnum>(ProcessingStatusEnum.Polling);
    const [currentStatus, setCurrentStatus] = useState<string>('Pending');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    useEffect(() => {
        console.log('🔄 Starting status polling...', recordId);

        const cleanup = pollProcessingStatus(
            recordId,
            // onUpdate
            (statusData: StatusResponse) => {
                console.log('📊 Status update:', statusData);
                setCurrentStatus(statusData.status);
                setPollCount((prev) => prev + 1);
            },
            // onComplete
            (statusData: StatusResponse) => {
                console.log('✅ Processing complete:', statusData);
                setStatus(ProcessingStatusEnum.Completed);
                if (statusData.resultUrl) {
                    setResultUrl(statusData.resultUrl);
                    onComplete?.(statusData.resultUrl);
                }
            },
            // onError
            (error: string) => {
                console.log('❌ Processing failed:', error);
                setStatus(ProcessingStatusEnum.Failed);
                setErrorMessage(error);
                onError?.(error);
            },
            // onTimeout
            () => {
                console.log('⏰ Polling timeout');
                setStatus(ProcessingStatusEnum.Timeout);
            }
        );

        return cleanup;
    }, [recordId, onComplete, onError]);

    // Render completed state - Full screen overlay
    if (status === ProcessingStatusEnum.Completed && resultUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-blue-50 flex flex-col overflow-hidden">
                {/* Success Header */}
                <div className="text-center pt-6 md:pt-10 pb-4 md:pb-6 px-4 animate-fade-in-up flex-shrink-0">
                    <div className="text-6xl md:text-8xl mb-3 md:mb-4">🎉</div>
                    <h2 className="text-3xl md:text-5xl font-bold text-green-600 mb-2 md:mb-3">
                        Your Career Photo is Ready!
                    </h2>
                    <p className="text-lg md:text-2xl text-gray-700">
                        Awesome! This is what your future looks like
                    </p>
                </div>

                {/* Result Photo - Full screen display */}
                <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
                    <img
                        src={resultUrl}
                        alt="Your Career Photo"
                        className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl rounded-lg"
                        onError={(e) => {
                            console.error('❌ Image load failed:', resultUrl);
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBMb2FkIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                        }}
                    />
                </div>

                {/* Action Button */}
                <div className="flex justify-center gap-4 md:gap-5 pb-6 md:pb-10 px-4 flex-shrink-0">
                    <a
                        href={resultUrl}
                        download
                        className="bg-green-600 text-white font-bold py-4 md:py-5 px-8 md:px-10 rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-green-300"
                    >
                        Download Photo
                    </a>
                </div>

                <style>{`
                    @keyframes fade-in-up {
                        from {
                            opacity: 0;
                            transform: translateY(20px) scale(0.98);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    .animate-fade-in-up {
                        animation: fade-in-up 0.6s ease-out forwards;
                    }
                `}</style>
            </div>
        );
    }

    // Render failed state
    if (status === ProcessingStatusEnum.Failed) {
        return (
            <div className="text-center p-6 md:p-8 bg-red-50 rounded-xl border-2 border-red-200 space-y-4">
                <div className="text-5xl md:text-6xl">😢</div>
                <h3 className="text-2xl md:text-3xl font-bold text-red-800">
                    Photo Processing Failed
                </h3>
                <p className="text-base md:text-lg text-red-600">
                    {errorMessage || 'Something went wrong'}
                </p>
                <p className="text-sm md:text-base text-red-500">
                    Please tell your teacher, we will help you try again
                </p>
            </div>
        );
    }

    // Render timeout state
    if (status === ProcessingStatusEnum.Timeout) {
        return (
            <div className="text-center p-6 md:p-8 bg-amber-50 rounded-xl border-2 border-amber-200 space-y-4">
                <div className="text-5xl md:text-6xl">⏰</div>
                <h3 className="text-2xl md:text-3xl font-bold text-amber-800">
                    Processing Takes Longer
                </h3>
                <p className="text-base md:text-lg text-amber-600">
                    Your photo is still processing, please wait a bit longer
                </p>
                <p className="text-sm md:text-base text-amber-700">
                    You can refresh the page later or ask your teacher for help
                </p>
                <div className="mt-4 text-xs md:text-sm text-amber-600 bg-amber-100 px-3 py-2 rounded inline-block">
                    Record ID: {recordId}
                </div>
            </div>
        );
    }

    // Render polling state (default)
    return (
        <div className="text-center p-6 md:p-8 bg-indigo-50 rounded-xl border-2 border-indigo-200 space-y-5 md:space-y-6">
            {/* Loading Animation */}
            <div className="flex justify-center">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <div className="animate-spin rounded-full h-20 w-20 md:h-24 md:w-24 border-b-8 border-indigo-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl md:text-4xl">
                        🎨
                    </div>
                </div>
            </div>

            {/* Status Text */}
            <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold text-indigo-800">
                    Creating Your Career Photo...
                </h3>
                <p className="text-lg md:text-xl text-indigo-600">
                    {(currentStatus === '待處理' || currentStatus === 'Pending') && 'Getting ready to process...'}
                    {(currentStatus === '處理中' || currentStatus === 'Processing') && 'Working hard on it...'}
                    {(currentStatus === '問卷中' || currentStatus === 'In Quiz') && 'Preparing...'}
                </p>
            </div>

            {/* Encouragement Text */}
            <div className="space-y-2">
                <p className="text-base md:text-lg text-indigo-700">
                    Please be patient
                </p>
                <p className="text-sm md:text-base text-indigo-500">
                    We are creating your photo based on your recommended career
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="text-xs md:text-sm text-indigo-400">
                Checked {pollCount} times...
            </div>
        </div>
    );
};

export default ProcessingStatus;
