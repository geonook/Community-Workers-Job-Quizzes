import express from 'express';
import dotenv from 'dotenv';
import { JOBS } from '../../src/data/jobs.js';

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

// Echo back the same sentence the kid saw on the selection card so the
// fallback never drifts from what they actually read aloud in class.
const SONG_LYRICS: Record<string, string> = Object.fromEntries(
  JOBS.map((j) => [j.key, j.sentence]),
);

const SONG_OUTRO = " We can't wait to grow up!";
const SONG_INTRO = "When I grow up, what do you want to be? We can't wait to grow up!";

function songFallback(topJobs?: { job_id: string }[]): string {
  const key = topJobs?.[0]?.job_id;
  const lyric = key ? SONG_LYRICS[key] : undefined;
  return lyric ? lyric + SONG_OUTRO : SONG_INTRO;
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
      console.warn('⚠️  GEMINI_API_KEY not configured, using song-lyric fallback');
      return res.json({
        success: true,
        description: songFallback(topJobs),
        fallback: true,
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
      model: 'gemini-2.5-flash',
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

    // Gemini API 錯誤時使用歌詞 fallback（從教學影片中孩子聽過的那一行）
    res.json({
      success: true,
      description: songFallback(req.body?.topJobs),
      fallback: true,
    });
  }
});

export default router;
