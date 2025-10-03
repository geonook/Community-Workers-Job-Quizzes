import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload.js';
import questionnaireRouter from './routes/questionnaire.js';
import statusRouter from './routes/status.js';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 4000;

// 中介軟體
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

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

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
