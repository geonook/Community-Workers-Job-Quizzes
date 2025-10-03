import { Router, Request, Response } from 'express';
import { getRecordStatus } from '../utils/airtable.js';

const router = Router();

/**
 * GET /api/check-status/:recordId
 * 查詢 Airtable 記錄的處理狀態
 */
router.get('/:recordId', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: '缺少 recordId',
      });
    }

    // 查詢記錄狀態
    const statusData = await getRecordStatus(recordId);

    res.json({
      success: true,
      ...statusData,
    });
  } catch (error: any) {
    console.error('Status check error:', error);

    // 如果是記錄不存在的錯誤
    if (error.message.includes('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: '找不到該記錄',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || '伺服器錯誤',
    });
  }
});

export default router;
