import Airtable from 'airtable';

// 延遲初始化 Airtable (只在需要時初始化)
let _base: ReturnType<Airtable['base']> | null = null;

function getBase() {
  if (!_base) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      throw new Error('Airtable 環境變數未設定 (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)');
    }

    _base = new Airtable({ apiKey }).base(baseId);
  }
  return _base;
}

const getTableName = () => {
  const tableName = process.env.AIRTABLE_TABLE_NAME;
  if (!tableName) {
    throw new Error('AIRTABLE_TABLE_NAME 環境變數未設定');
  }
  return tableName;
};

export interface AirtableRecord {
  id: string;
  fields: {
    '學生姓名': string;
    '班級': string;
    '原始照片': Array<{ url: string }>;
    '推薦職業'?: string;
    '問卷分數'?: string;
    'AI職業描述'?: string;
    '處理狀態': string;
    '結果照片'?: Array<{ url: string }>;
    '結果URL'?: string;
    '錯誤訊息'?: string;
  };
}

/**
 * 建立新的 Airtable 記錄
 */
export async function createRecord(data: {
  photoUrl: string;
  studentName: string;
  studentClass: string;
}): Promise<string> {
  try {
    const base = getBase();
    const tableName = getTableName();

    const record = await base(tableName).create([
      {
        fields: {
          '學生姓名': data.studentName,
          '班級': data.studentClass,
          '原始照片': [{ url: data.photoUrl }],
          '處理狀態': '問卷中',
        },
      },
    ]);

    return record[0].id;
  } catch (error: any) {
    console.error('Airtable create error:', error);
    throw new Error(`建立記錄失敗: ${error.message}`);
  }
}

/**
 * 更新 Airtable 記錄（問卷提交）
 */
export async function updateQuestionnaireRecord(
  recordId: string,
  data: {
    recommendedJobs: string;
    scores: any;
    geminiDescription?: string;
  }
): Promise<void> {
  try {
    const base = getBase();
    const tableName = getTableName();

    await base(tableName).update([
      {
        id: recordId,
        fields: {
          '推薦職業': data.recommendedJobs,
          '問卷分數': JSON.stringify(data.scores),
          'AI職業描述': data.geminiDescription || '',
          '處理狀態': '待處理',
        },
      },
    ]);
  } catch (error: any) {
    console.error('Airtable update error:', error);
    throw new Error(`更新記錄失敗: ${error.message}`);
  }
}

/**
 * 查詢記錄狀態
 */
export async function getRecordStatus(recordId: string): Promise<{
  status: string;
  resultUrl?: string;
  error?: string;
}> {
  try {
    const base = getBase();
    const tableName = getTableName();

    const record = await base(tableName).find(recordId);

    const fields = record.fields as AirtableRecord['fields'];
    const status = fields['處理狀態'] || '未知';
    const resultUrl = fields['結果URL'];  // 讀取 n8n 寫入的 Google Drive URL
    const resultPhotos = fields['結果照片'];  // 備用：Airtable 附件格式
    const error = fields['錯誤訊息'];

    return {
      status,
      resultUrl: resultUrl || resultPhotos?.[0]?.url,  // 優先使用文字 URL，備用附件 URL
      error,
    };
  } catch (error: any) {
    console.error('Airtable find error:', error);
    throw new Error(`查詢記錄失敗: ${error.message}`);
  }
}
