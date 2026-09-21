import { describe, it, expect } from 'vitest';
import { computeScores } from './scoring';

const jobs = [
  { id: 't', name: 'Teacher' },
  { id: 'n', name: 'Nurse' },
  { id: 'f', name: 'Fire Fighter' },
];
const map = [
  { option_id: 'q1_A', job_id: 't' },
  { option_id: 'q1_A', job_id: 'n' },
  { option_id: 'q1_B', job_id: 'f' },
  { option_id: 'q2_A', job_id: 't' },
];

describe('computeScores', () => {
  it('picks the single highest-scoring job', () => {
    const r = computeScores(['q1_A', 'q2_A'], jobs, map);
    expect(r.topJobs).toEqual([{ job_id: 't', job_name: 'Teacher' }]);
    expect(r.counts).toEqual({ Teacher: 2, Nurse: 1 });
    expect(r.sortedScores[0]).toEqual({ job_id: 't', job_name: 'Teacher', score: 2 });
  });

  it('returns every tied job on a tie', () => {
    const r = computeScores(['q1_A'], jobs, map);
    expect(r.topJobs.map((j) => j.job_id).sort()).toEqual(['n', 't']);
  });

  it('ignores option ids that are not in the map', () => {
    const r = computeScores(['nope', 'q1_B'], jobs, map);
    expect(r.topJobs).toEqual([{ job_id: 'f', job_name: 'Fire Fighter' }]);
  });

  it('returns empty results when nothing was answered', () => {
    expect(computeScores([], jobs, map)).toEqual({ counts: {}, topJobs: [], sortedScores: [] });
  });

  it('labels unknown job ids instead of crashing', () => {
    const r = computeScores(['q1_B'], [], map);
    expect(r.topJobs[0].job_name).toMatch(/unknown job \(f\)/i);
  });
});
