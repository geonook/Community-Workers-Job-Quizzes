import { describe, it, expect } from 'vitest';
import { buildFallbackDescription } from './fallbackDescription';

describe('buildFallbackDescription', () => {
  it('uses the top job name and the student name', () => {
    const s = buildFallbackDescription('Mia', [{ job_name: 'Teacher' }]);
    expect(s).toBe('Teacher — a great choice! Mia, you can grow up to help people every day.');
  });

  it('works without a student name', () => {
    expect(buildFallbackDescription(undefined, [{ job_name: 'Nurse' }]))
      .toBe('Nurse — a great choice! You can grow up to help people every day.');
  });

  it('has a generic sentence when there is no top job', () => {
    expect(buildFallbackDescription('Mia', [])).toMatch(/many different jobs/i);
    expect(buildFallbackDescription('Mia', undefined)).toMatch(/many different jobs/i);
  });
});
