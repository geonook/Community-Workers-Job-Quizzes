import { Job, OptionJobMapItem, ScoringResults, ScoreEntry, TopJob } from '../src/types';

/**
 * Count one point per (chosen option → job) mapping and return the top job(s).
 * Ported from v1.1.0; output shape feeds /api/generate-description and /api/submit-questionnaire.
 */
export function computeScores(
    selectedOptionIds: string[],
    jobs: Job[],
    optionJobMap: OptionJobMapItem[],
): ScoringResults {
    const optToJobs = optionJobMap.reduce<Record<string, string[]>>((acc, item) => {
        (acc[item.option_id] ??= []).push(item.job_id);
        return acc;
    }, {});

    const countsById: Record<string, number> = {};
    for (const optionId of selectedOptionIds) {
        for (const jobId of optToJobs[optionId] ?? []) {
            countsById[jobId] = (countsById[jobId] ?? 0) + 1;
        }
    }

    const entries = Object.entries(countsById);
    if (entries.length === 0) {
        return { counts: {}, topJobs: [], sortedScores: [] };
    }

    const idToName = Object.fromEntries(jobs.map((j) => [j.id, j.name]));
    const nameOf = (jobId: string) => idToName[jobId] ?? `Unknown Job (${jobId})`;

    const sortedScores: ScoreEntry[] = entries
        .map(([job_id, score]) => ({ job_id, job_name: nameOf(job_id), score }))
        .sort((a, b) => b.score - a.score);

    const maxScore = sortedScores[0].score;
    const topJobs: TopJob[] = sortedScores
        .filter((s) => s.score === maxScore)
        .map(({ job_id, job_name }) => ({ job_id, job_name }));

    const counts = Object.fromEntries(sortedScores.map((s) => [s.job_name, s.score]));

    return { counts, topJobs, sortedScores };
}
