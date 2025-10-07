import { Router, Request, Response } from 'express';
import { createRecord } from '../utils/airtable.js';

const router = Router();

/**
 * POST /api/upload
 * 建立 Airtable 記錄（照片上傳後）
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { photoUrl, studentName, studentClass } = req.body;

    // 驗證必填欄位
    if (!photoUrl || !studentName || !studentClass) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: photoUrl, studentName, studentClass',
      });
    }

    // 驗證不能使用預設值
    if (studentName === 'Student' || studentClass === 'Class') {
      return res.status(400).json({
        success: false,
        error: 'Please enter your real name and class',
      });
    }

    // 驗證姓名/班級長度
    if (studentName.trim().length < 2 || studentClass.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Name and class must be at least 2 characters',
      });
    }

    // 驗證 photoUrl 格式
    if (!photoUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photo URL',
      });
    }

    // 建立 Airtable 記錄
    const recordId = await createRecord({
      photoUrl,
      studentName,
      studentClass,
    });

    console.log(`✅ 記錄已建立: ${recordId} (${studentName})`);

    res.json({
      success: true,
      recordId,
      message: '照片已成功儲存',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '伺服器錯誤',
    });
  }
});

export default router;
