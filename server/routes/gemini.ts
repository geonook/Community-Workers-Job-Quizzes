import express from 'express';
import dotenv from 'dotenv';

const router = express.Router();

// 確保環境變數已載入
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

interface GenerateDescriptionRequest {
  studentName: string;
  topJobs: { job_id: string; job_name: string }[];
  sortedScores: { job_id: string; job_name: string; score: number }[];
}

/**
 * POST /api/generate-description
 * 使用 Gemini API 產生個人化的職業描述
 */
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const { studentName, topJobs, sortedScores } = req.body as GenerateDescriptionRequest;

    // 驗證必填欄位
    if (!studentName || !topJobs || !sortedScores) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentName, topJobs, sortedScores',
      });
    }

    // 檢查 Gemini API Key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not configured, using fallback description');
      return res.json({
        success: true,
        description: 'Your unique mix of traits opens up many possibilities! Whether it is helping others, being creative, or using technology, you have the potential to shine in fields you are passionate about.',
      });
    }

    // 處理平衡興趣的情況
    if (topJobs.length === 0) {
      return res.json({
        success: true,
        description: "You have a balanced set of interests! This means you're open to many different possibilities. Keep exploring activities you enjoy to discover what you're most passionate about.",
      });
    }

    // 動態 import Google Generative AI
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const topJobsText = topJobs.map(j => j.job_name).join(' or ');
    const scoresText = sortedScores.slice(0, 5).map(s => `${s.job_name} (Score: ${s.score})`).join(', ');

    const prompt = `You are a friendly and encouraging career counselor for a young person named ${studentName}. Their quiz results suggest their top job interests are: ${topJobsText}. Their top traits based on scores are: ${scoresText}.

Based on these results, write a personalized summary of about 50-70 words. Explain why these jobs might be a good fit and encourage them to explore these paths. Use a warm, positive tone.`;

    console.log(`🤖 Generating Gemini description for ${studentName}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
    });

    const description = response.text;

    console.log(`✅ Gemini description generated successfully`);

    res.json({
      success: true,
      description,
    });
  } catch (error: any) {
    console.error('❌ Gemini API error:', error);

    // Gemini API 錯誤時使用預設描述
    res.json({
      success: true,
      description: 'Your unique mix of traits opens up many possibilities! Whether it is helping others, being creative, or using technology, you have the potential to shine in fields you are passionate about.',
      fallback: true,
    });
  }
});

export default router;
