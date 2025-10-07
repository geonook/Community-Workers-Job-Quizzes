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
    const [currentStatus, setCurrentStatus] = useState<string>('待處理');
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

    // 渲染完成狀態
    if (status === ProcessingStatusEnum.Completed && resultUrl) {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-3xl font-bold text-green-600 mb-2">
                        你的專屬照片完成了！
                    </h3>
                </div>

                {/* 結果照片 */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                        src={resultUrl}
                        alt="Result"
                        className="w-full max-h-[70vh] object-contain bg-gray-100"
                    />
                </div>

                <p className="text-center text-gray-600 text-lg">
                    太棒了！這就是你未來的樣子 😊
                </p>
            </div>
        );
    }

    // 渲染失敗狀態
    if (status === ProcessingStatusEnum.Failed) {
        return (
            <div className="text-center p-8 bg-red-100 rounded-2xl space-y-4">
                <div className="text-6xl">😢</div>
                <h3 className="text-2xl font-bold text-red-800">
                    糟糕！照片處理失敗了
                </h3>
                <p className="text-lg text-red-600">
                    {errorMessage || '發生了一些問題'}
                </p>
                <p className="text-sm text-red-500">
                    請告訴老師，我們會幫你重新處理！
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
                    處理需要多一點時間
                </h3>
                <p className="text-lg text-yellow-600">
                    你的照片還在處理中，可能需要再等一下下
                </p>
                <p className="text-sm text-yellow-700">
                    請稍後重新整理頁面，或告訴老師幫你查看！
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
                    正在製作你的專屬照片...
                </h3>
                <p className="text-xl text-blue-600">
                    {currentStatus === '待處理' && '準備開始處理...'}
                    {currentStatus === '處理中' && '正在努力製作中...'}
                    {currentStatus === '問卷中' && '正在準備...'}
                </p>
            </div>

            {/* 鼓勵文字 */}
            <div className="space-y-2">
                <p className="text-lg text-blue-700">
                    請耐心等待一下下 😊
                </p>
                <p className="text-sm text-blue-500">
                    我們正在根據你的推薦職業製作專屬照片
                </p>
            </div>

            {/* 進度提示 */}
            <div className="text-xs text-blue-400">
                已檢查 {pollCount} 次...
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
