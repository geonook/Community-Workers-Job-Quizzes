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
        console.log('🔄 開始輪詢處理狀態...', recordId);

        const cleanup = pollProcessingStatus(
            recordId,
            // onUpdate
            (statusData: StatusResponse) => {
                console.log('📊 狀態更新:', statusData);
                setCurrentStatus(statusData.status);
                setPollCount((prev) => prev + 1);
            },
            // onComplete
            (statusData: StatusResponse) => {
                console.log('✅ 處理完成:', statusData);
                setStatus(ProcessingStatusEnum.Completed);
                if (statusData.resultUrl) {
                    setResultUrl(statusData.resultUrl);
                    onComplete?.(statusData.resultUrl);
                }
            },
            // onError
            (error: string) => {
                console.log('❌ 處理失敗:', error);
                setStatus(ProcessingStatusEnum.Failed);
                setErrorMessage(error);
                onError?.(error);
            },
            // onTimeout
            () => {
                console.log('⏰ 輪詢超時');
                setStatus(ProcessingStatusEnum.Timeout);
            }
        );

        // 清除函數
        return cleanup;
    }, [recordId, onComplete, onError]);

    // 渲染完成狀態 - 全螢幕覆蓋層
    if (status === ProcessingStatusEnum.Completed && resultUrl) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-50 to-blue-50 overflow-y-auto">
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-4xl w-full space-y-6 animate-fade-in-up py-8">
                        {/* 完成標題 */}
                        <div className="text-center">
                            <div className="text-8xl mb-6">🎉</div>
                            <h2 className="text-5xl font-bold text-green-600 mb-4">
                                Your Career Photo is Ready!
                            </h2>
                            <p className="text-2xl text-gray-700 mb-2">
                                Awesome! This is what your future looks like 😊
                            </p>
                        </div>

                        {/* 結果照片 - 大尺寸顯示，可完整查看 */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-white">
                            <img
                                src={resultUrl}
                                alt="Your Career Photo"
                                className="w-full h-auto object-contain"
                                style={{ maxHeight: 'none' }}
                                onError={(e) => {
                                    console.error('❌ Image load failed:', resultUrl);
                                    // Fallback image
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBMb2FkIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                                }}
                            />
                        </div>

                        {/* 操作按鈕 */}
                        <div className="flex justify-center gap-4">
                            <a
                                href={resultUrl}
                                download
                                className="bg-green-600 text-white font-bold py-3 px-8 rounded-full hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                📥 Download Photo
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 渲染失敗狀態
    if (status === ProcessingStatusEnum.Failed) {
        return (
            <div className="text-center p-8 bg-red-100 rounded-2xl space-y-4">
                <div className="text-6xl">😢</div>
                <h3 className="text-2xl font-bold text-red-800">
                    Oops! Photo Processing Failed
                </h3>
                <p className="text-lg text-red-600">
                    {errorMessage || 'Something went wrong'}
                </p>
                <p className="text-sm text-red-500">
                    Please tell your teacher, we'll help you try again!
                </p>
            </div>
        );
    }

    // 渲染超時狀態
    if (status === ProcessingStatusEnum.Timeout) {
        return (
            <div className="text-center p-8 bg-yellow-100 rounded-2xl space-y-4">
                <div className="text-6xl">⏰</div>
                <h3 className="text-2xl font-bold text-yellow-800">
                    Processing Takes a Little Longer
                </h3>
                <p className="text-lg text-yellow-600">
                    Your photo is still processing, please wait a bit longer
                </p>
                <p className="text-sm text-yellow-700">
                    Please refresh the page later, or ask your teacher for help!
                </p>
                <div className="mt-4 text-xs text-yellow-600">
                    Record ID: {recordId}
                </div>
            </div>
        );
    }

    // 渲染輪詢中狀態（預設）
    return (
        <div className="text-center p-8 bg-blue-100 rounded-2xl space-y-6">
            {/* Loading 動畫 */}
            <div className="flex justify-center">
                <div className="relative w-24 h-24">
                    <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-blue-600"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                        🎨
                    </div>
                </div>
            </div>

            {/* 狀態文字 */}
            <div className="space-y-2">
                <h3 className="text-3xl font-bold text-blue-800">
                    Creating Your Career Photo...
                </h3>
                <p className="text-xl text-blue-600">
                    {(currentStatus === '待處理' || currentStatus === 'Pending') && 'Getting ready to process...'}
                    {(currentStatus === '處理中' || currentStatus === 'Processing') && 'Working hard on it...'}
                    {(currentStatus === '問卷中' || currentStatus === 'In Quiz') && 'Preparing...'}
                </p>
            </div>

            {/* 鼓勵文字 */}
            <div className="space-y-2">
                <p className="text-lg text-blue-700">
                    Please be patient 😊
                </p>
                <p className="text-sm text-blue-500">
                    We're creating your photo based on your recommended career
                </p>
            </div>

            {/* 進度提示 */}
            <div className="text-xs text-blue-400">
                Checked {pollCount} times...
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
};

export default ProcessingStatus;
