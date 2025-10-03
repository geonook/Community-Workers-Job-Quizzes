// Fix: Replaced the incorrect component code with the correct type definitions for the application.
export enum GameState {
    Start,
    Quiz,
    Results,
}

export interface Choice {
    id: string;
    text: string;
    icon: string;
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
    clusterCode: string;
    clusterName: string;
    emoji: string;
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

export interface ScoreEntry {
    job_id: string;
    job_name: string;
    score: number;
}

export interface ScoringResults {
    counts: Record<string, number>;
    topJobs: { job_id: string; job_name: string; }[];
    sortedScores: ScoreEntry[];
}

// Part 1: 照片上傳相關型別
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

export enum CaptureStatus {
    Idle = 'idle',
    Capturing = 'capturing',
    Preview = 'preview',
    Uploading = 'uploading',
    Success = 'success',
    Error = 'error',
}

// Part 4: 問卷提交與狀態輪詢相關型別
export interface QuestionnaireSubmission {
    recordId: string;
    answers: string[];
    recommendedJobs: string;
    scores: Record<string, number>;
    studentName: string;
    studentClass: string;
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