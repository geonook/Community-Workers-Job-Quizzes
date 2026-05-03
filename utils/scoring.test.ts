import { describe, it, expect } from 'vitest';
import { buildPickedJobPayload } from './scoring';
import { JOBS } from '../src/data/jobs';

describe('buildPickedJobPayload', () => {
  it('returns the canonical n8n-compatible payload for a picked job', () => {
    const result = buildPickedJobPayload('doctor');
    expect(result).toEqual({
      answers: ['doctor'],
      recommendedJobs: 'Doctor',
      scores: { doctor: 1 },
      topJobsForGemini: [{ job_id: 'doctor', job_name: 'Doctor' }],
      sortedScoresForGemini: [{ job_id: 'doctor', job_name: 'Doctor', score: 1 }],
    });
  });

  it('uses the displayName from JOBS for recommendedJobs', () => {
    const result = buildPickedJobPayload('police');
    expect(result.recommendedJobs).toBe('Police Officer');
  });

  it('throws on unknown job key', () => {
    expect(() => buildPickedJobPayload('astronaut' as never)).toThrow(/unknown job key/i);
  });

  it('produces consistent output for every known job', () => {
    for (const job of JOBS) {
      const result = buildPickedJobPayload(job.key);
      expect(result.answers).toEqual([job.key]);
      expect(result.recommendedJobs).toBe(job.displayName);
      expect(result.scores).toEqual({ [job.key]: 1 });
    }
  });
});
