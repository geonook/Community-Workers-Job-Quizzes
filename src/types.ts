export enum GameState {
    Welcome = 'welcome',
    Selection = 'selection',
    Photo = 'photo',
    Results = 'results',
}

// Photo upload
export interface UploadResponse {
    success: boolean;
    recordId: string;
    message?: string;
    photoUrl?: string;
}

export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
    [key: string]: any;
}

// Submission to backend — shape preserved so n8n + Airtable see no change
export interface QuestionnaireSubmission {
    recordId: string;
    answers: string[];
    recommendedJobs: string;
    scores: Record<string, number>;
    studentName: string;
    studentClass: string;
    geminiDescription?: string;
}

export interface QuestionnaireResponse {
    success: boolean;
    recommendedJobs?: string;
    message?: string;
}

export interface StatusResponse {
    success: boolean;
    status: '問卷中' | '待處理' | '處理中' | '完成' | '失敗';
    resultUrl?: string;
    error?: string;
}

export enum ProcessingStatus {
    Idle = 'idle',
    Submitting = 'submitting',
    Polling = 'polling',
    Completed = 'completed',
    Failed = 'failed',
    Timeout = 'timeout',
}

// Used by /api/generate-description body — preserved shape
export interface ScoreEntry {
    job_id: string;
    job_name: string;
    score: number;
}