import { describe, it, expect } from 'vitest';
import { JOBS, getJobByKey, JOB_KEYS } from './jobs';

describe('jobs data', () => {
  it('has exactly 11 jobs in canonical order', () => {
    expect(JOBS).toHaveLength(11);
    expect(JOB_KEYS).toEqual([
      'musician', 'police', 'hairdresser', 'firefighter', 'zookeeper',
      'farmer', 'pilot', 'baker', 'artist', 'dancer', 'doctor',
    ]);
  });

  it('every job has a sentence starting with "I want to be"', () => {
    for (const job of JOBS) {
      expect(job.sentence).toMatch(/^I want to be (a|an) /);
    }
  });

  it('every job has a Lucide icon name from the allowed set', () => {
    const allowed = new Set([
      'Music', 'Shield', 'Scissors', 'Flame', 'PawPrint',
      'Sprout', 'Plane', 'CookingPot', 'Palette', 'Sparkles', 'Stethoscope',
    ]);
    for (const job of JOBS) {
      expect(allowed.has(job.icon)).toBe(true);
    }
  });

  it('every job has a short CTA label', () => {
    for (const job of JOBS) {
      expect(job.cta).toMatch(/^I want to be (a|an) [a-z]+!$/);
    }
  });

  it('getJobByKey returns the matching job', () => {
    expect(getJobByKey('doctor')?.icon).toBe('Stethoscope');
    expect(getJobByKey('musician')?.sentence).toBe('I want to be a musician and play music.');
  });

  it('getJobByKey returns undefined for unknown key', () => {
    expect(getJobByKey('astronaut' as never)).toBeUndefined();
  });
});
