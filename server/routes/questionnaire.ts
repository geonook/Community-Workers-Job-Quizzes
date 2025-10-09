import { Router, Request, Response } from 'express';
import { updateQuestionnaireRecord } from '../utils/airtable.js';
import { triggerN8nWebhook } from '../utils/webhook.js';

const router = Router();

/**
 * 計算推薦職業（簡化版 - 從前端傳入已計算的結果）
 * 實際計分邏輯應該在前端完成（使用現有的 computeScores 函數）
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { recordId, answers, recommendedJobs, scores, studentName, studentClass, geminiDescription } = req.body;

    // 驗證必填欄位
    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: '缺少 recordId',
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: '缺少或格式錯誤的 answers',
      });
    }

    if (!recommendedJobs) {
      return res.status(400).json({
        success: false,
        error: '缺少 recommendedJobs',
      });
    }

    // 更新 Airtable 記錄
    await updateQuestionnaireRecord(recordId, {
      recommendedJobs,
      scores: scores || {},
      geminiDescription,
    });

    console.log(`✅ 問卷已提交: ${recordId} - ${recommendedJobs}`);

    // 非同步觸發 n8n webhook（不等待結果）
    triggerN8nWebhook(recordId).catch((err) => {
      console.error('Webhook trigger failed (non-blocking):', err);
    });

    res.json({
      success: true,
      recommendedJobs,
      message: '問卷已成功提交，照片處理中',
    });
  } catch (error: any) {
    console.error('Questionnaire submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '伺服器錯誤',
    });
  }
});

export default router;
