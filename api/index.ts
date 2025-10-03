import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload.js';
import questionnaireRouter from './routes/questionnaire.js';
import statusRouter from './routes/status.js';

// 載入環境變數
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 設定 - 允許前端跨域請求
const allowedOrigins = [
  // Zeabur 前端服務
  'https://career-explorer.zeabur.app',
  // 本地開發
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // 允許沒有 origin 的請求（例如：Postman、curl）
    if (!origin) {
      return callback(null, true);
    }

    // 檢查 origin 是否在允許清單中
    if (allowedOrigins.some(allowed => allowed && origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

// 根路徑返回 API 資訊
app.get('/', (req, res) => {
  res.json({
    service: 'Community Workers Job Quizzes API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'POST /api/upload',
      'POST /api/submit-questionnaire',
      'GET /api/check-status/:recordId'
    ]
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 錯誤處理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '伺服器內部錯誤' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`\n🚀 API Server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log('\n環境變數檢查:');
  console.log('  AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅ 已設定' : '❌ 未設定');
  console.log('  AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅ 已設定' : '❌ 未設定');
  console.log('  AIRTABLE_TABLE_NAME:', process.env.AIRTABLE_TABLE_NAME ? '✅ 已設定' : '❌ 未設定');
  console.log('  N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL ? '✅ 已設定' : '❌ 未設定');
  console.log('');
});
