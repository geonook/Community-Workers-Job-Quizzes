/**
 * 觸發 n8n Webhook 進行圖片處理
 */
export async function triggerN8nWebhook(recordId: string): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'YOUR_N8N_WEBHOOK_URL_HERE') {
    console.warn('N8N_WEBHOOK_URL not configured, skipping webhook trigger');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordId,
        action: 'process_career',
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook 回應錯誤: ${response.status}`);
    }

    console.log(`✅ n8n webhook 已觸發: ${recordId}`);
  } catch (error: any) {
    // 不中斷主流程，只記錄錯誤
    console.error('n8n webhook 觸發失敗:', error.message);
  }
}
