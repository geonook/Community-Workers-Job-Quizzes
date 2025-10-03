import {
    QuestionnaireSubmission,
    QuestionnaireResponse,
    StatusResponse,
} from '../types';

/**
 * 提交問卷到後端 API
 */
export async function submitQuestionnaire(
    submission: QuestionnaireSubmission
): Promise<QuestionnaireResponse> {
    try {
        const response = await fetch('/api/submit-questionnaire', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission),
        });

        if (!response.ok) {
            throw new Error(`提交失敗: ${response.status}`);
        }

        const data: QuestionnaireResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || '提交失敗');
        }

        return data;
    } catch (error: any) {
        console.error('❌ 問卷提交錯誤:', error);
        throw new Error(error.message || '提交問卷失敗，請重試');
    }
}

/**
 * 檢查處理狀態
 */
export async function checkProcessingStatus(
    recordId: string
): Promise<StatusResponse> {
    try {
        const response = await fetch(`/api/check-status/${recordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`查詢失敗: ${response.status}`);
        }

        const data: StatusResponse = await response.json();

        if (!data.success) {
            throw new Error('查詢狀態失敗');
        }

        return data;
    } catch (error: any) {
        console.error('❌ 狀態查詢錯誤:', error);
        throw new Error(error.message || '查詢狀態失敗');
    }
}

/**
 * 輪詢處理狀態
 * @param recordId - Airtable record ID
 * @param onUpdate - 狀態更新回調
 * @param maxAttempts - 最多輪詢次數（預設 20 次）
 * @param interval - 輪詢間隔（毫秒，預設 3000ms = 3秒）
 * @returns 清除輪詢的函數
 */
export function pollProcessingStatus(
    recordId: string,
    onUpdate: (status: StatusResponse) => void,
    onComplete: (status: StatusResponse) => void,
    onError: (error: string) => void,
    onTimeout: () => void,
    maxAttempts: number = 20,
    interval: number = 3000
): () => void {
    let attempts = 0;
    let intervalId: number | null = null;

    const poll = async () => {
        attempts++;

        console.log(`📊 輪詢狀態 (${attempts}/${maxAttempts})...`);

        try {
            const statusData = await checkProcessingStatus(recordId);

            // 更新狀態
            onUpdate(statusData);

            // 檢查是否完成
            if (statusData.status === '完成') {
                console.log('✅ 處理完成！');
                cleanup();
                onComplete(statusData);
                return;
            }

            // 檢查是否失敗
            if (statusData.status === '失敗') {
                console.log('❌ 處理失敗');
                cleanup();
                onError(statusData.error || '處理失敗');
                return;
            }

            // 檢查是否超時
            if (attempts >= maxAttempts) {
                console.log('⏰ 輪詢超時');
                cleanup();
                onTimeout();
                return;
            }
        } catch (error: any) {
            console.error('輪詢錯誤:', error);
            cleanup();
            onError(error.message || '查詢狀態失敗');
        }
    };

    const cleanup = () => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    // 立即執行一次
    poll();

    // 設定定時輪詢
    intervalId = window.setInterval(poll, interval);

    // 返回清除函數
    return cleanup;
}
