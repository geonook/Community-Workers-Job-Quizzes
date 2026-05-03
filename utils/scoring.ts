import { JobKey, getJobByKey } from '../src/data/jobs';
import { ScoreEntry } from '../src/types';

export interface PickedJobPayload {
    /** Goes into QuestionnaireSubmission.answers */
    answers: string[];
    /** Goes into QuestionnaireSubmission.recommendedJobs */
    recommendedJobs: string;
    /** Goes into QuestionnaireSubmission.scores */
    scores: Record<string, number>;
    /** Goes into POST /api/generate-description body.topJobs */
    topJobsForGemini: { job_id: string; job_name: string }[];
    /** Goes into POST /api/generate-description body.sortedScores */
    sortedScoresForGemini: ScoreEntry[];
}

export function buildPickedJobPayload(jobKey: JobKey): PickedJobPayload {
    const job = getJobByKey(jobKey);
    if (!job) {
        throw new Error(`Unknown job key: ${jobKey}`);
    }
    return {
        answers: [job.key],
        recommendedJobs: job.displayName,
        scores: { [job.key]: 1 },
        topJobsForGemini: [{ job_id: job.key, job_name: job.displayName }],
        sortedScoresForGemini: [{ job_id: job.key, job_name: job.displayName, score: 1 }],
    };
}
