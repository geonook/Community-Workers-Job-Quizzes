import { describe, it, expect } from 'vitest';
import * as LucideIcons from 'lucide-react';
import { getJobIconName, JOB_ICONS, DEFAULT_JOB_ICON } from './jobIcons';

describe('jobIcons', () => {
  it('maps every known sheet job id to a real Lucide icon', () => {
    for (const [jobId, iconName] of Object.entries(JOB_ICONS)) {
      expect((LucideIcons as Record<string, unknown>)[iconName], `${jobId} → ${iconName}`).toBeDefined();
    }
  });

  it('covers the 13 ids currently in the sheet', () => {
    expect(Object.keys(JOB_ICONS).sort()).toEqual(
      ['a', 'b', 'dd', 'de', 'do', 'f', 'l', 'mc', 'me', 'n', 'p', 'r', 't'].sort(),
    );
  });

  it('falls back to the default icon for unknown ids', () => {
    expect(getJobIconName('zzz')).toBe(DEFAULT_JOB_ICON);
    expect((LucideIcons as Record<string, unknown>)[DEFAULT_JOB_ICON]).toBeDefined();
  });
});
