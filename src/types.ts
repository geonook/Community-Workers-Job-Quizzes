export enum GameState {
    Loading = 'loading',
    Start = 'start',
    Quiz = 'quiz',
    Submitting = 'submitting',
    Results = 'results',
}

// ---- Quiz content (from Google Sheet) ----
export interface Choice {
    id: string;
    text: string;
    imageUrl?: string;
}

export interface Question {
    id: string;
    text: string;
    choices: Choice[];
}

export interface Job {
    id: string;
    name: string;
}

export interface OptionJobMapItem {
    option_id: string;
    job_id: string;
}

export interface QuizData {
    questions: Question[];
    jobs: Job[];
    optionJobMap: OptionJobMapItem[];
}

// ---- Scoring ----
export interface ScoreEntry {
    job_id: string;
    job_name: string;
    score: number;
}

export interface TopJob {
    job_id: string;
    job_name: string;
}

export interface ScoringResults {
    /** job_name → score, for QuestionnaireSubmission.scores */
    counts: Record<string, number>;
    topJobs: TopJob[];
    sortedScores: ScoreEntry[];
}

// ---- API (unchanged contracts) ----
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
