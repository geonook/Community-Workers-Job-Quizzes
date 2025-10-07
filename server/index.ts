import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import questionnaireRouter from './routes/questionnaire.js';
import statusRouter from './routes/status.js';

// 載入環境變數（本地開發用 .env.local，生產環境用平台環境變數）
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

const app = express();
const PORT = process.env.PORT || 4000;

// CORS 設定
// Monorepo 架構：前後端同 domain，簡化 CORS 設定
app.use(cors());

app.use(express.json());

// 請求日誌
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api/upload', uploadRouter);
app.use('/api/submit-questionnaire', questionnaireRouter);
app.use('/api/check-status', statusRouter);

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 提供前端靜態檔案（生產環境）
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.join(__dirname, '..', 'dist');

  console.log('📁 Serving static files from:', distPath);

  // 提供靜態檔案
  app.use(express.static(distPath));

  // SPA fallback - 所有非 API 請求返回 index.html
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
} else {
  // 開發環境的 404 處理
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
}

// 錯誤處理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log('\n環境變數檢查:');
  console.log('  AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅ 已設定' : '❌ 未設定');
  console.log('  AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅ 已設定' : '❌ 未設定');
  console.log('  AIRTABLE_TABLE_NAME:', process.env.AIRTABLE_TABLE_NAME ? '✅ 已設定' : '❌ 未設定');
  console.log('  N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL ? '✅ 已設定' : '❌ 未設定');
  console.log('');
});
