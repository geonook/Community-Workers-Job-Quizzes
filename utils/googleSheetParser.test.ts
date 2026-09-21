import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getQuizData, fetchSheetData } from './googleSheetParser';

function gviz(cols: string[], rows: (string | number | null)[][]): string {
  const body = JSON.stringify({
    version: '0.6',
    status: 'ok',
    table: {
      cols: cols.map((label, i) => ({ id: String.fromCharCode(65 + i), label, type: 'string' })),
      rows: rows.map((r) => ({ c: r.map((v) => (v === null ? null : { v })) })),
    },
  });
  return `/*O_o*/\ngoogle.visualization.Query.setResponse(${body});`;
}

const SHEETS: Record<string, string> = {
  Questions: gviz(['question_id', 'text', 'order', ''], [
    ['q2', 'Second?', 2, null],
    ['q1', 'First?', 1, null],
  ]),
  Options: gviz(['option_id', 'text', 'question_id', 'image_url'], [
    ['q1_A', 'Inside', 'q1', 'https://x/a.jpg'],
    ['q1_B', 'Outside', 'q1', null],
    ['q2_A', 'Kids', 'q2', 'https://x/c.jpg'],
  ]),
  Jobs: gviz(['job_id', 'job_name', ''], [
    ['t', 'Teacher', null],
    ['n', 'Nurse', null],
  ]),
  OptionJobMap: gviz(['option_id', 'job_id'], [
    ['q1_A', 't'],
    ['q1_B', 'n'],
    ['q2_A', 't'],
  ]),
};

function mockFetch(responder: (url: string) => string) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    text: async () => responder(url),
  })));
}

beforeEach(() => {
  mockFetch((url) => {
    const name = decodeURIComponent(url.match(/sheet=([^&]+)/)?.[1] ?? '');
    return SHEETS[name] ?? '';
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSheetData', () => {
  it('turns gviz JSONP into row objects keyed by trimmed header, ignoring empty headers', async () => {
    const rows = await fetchSheetData('Jobs');
    expect(rows).toEqual([
      { job_id: 't', job_name: 'Teacher' },
      { job_id: 'n', job_name: 'Nurse' },
    ]);
  });

  it('returns [] for an empty sheet', async () => {
    mockFetch(() => gviz([], []));
    expect(await fetchSheetData('Jobs')).toEqual([]);
  });

  it('throws a readable error when the sheet is not published', async () => {
    mockFetch(() => '<html>access_denied</html>');
    await expect(fetchSheetData('Jobs')).rejects.toThrow(/publish to web/i);
  });
});

describe('getQuizData', () => {
  it('builds questions sorted by order, with their choices', async () => {
    const data = await getQuizData();
    expect(data.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(data.questions[0].choices).toEqual([
      { id: 'q1_A', text: 'Inside', imageUrl: 'https://x/a.jpg' },
      { id: 'q1_B', text: 'Outside', imageUrl: undefined },
    ]);
  });

  it('returns jobs and optionJobMap', async () => {
    const data = await getQuizData();
    expect(data.jobs).toEqual([{ id: 't', name: 'Teacher' }, { id: 'n', name: 'Nurse' }]);
    expect(data.optionJobMap).toHaveLength(3);
  });

  it('matches headers case-insensitively', async () => {
    mockFetch((url) => {
      if (url.includes('sheet=Jobs')) return gviz(['JOB_ID', 'Job_Name'], [['t', 'Teacher']]);
      const name = decodeURIComponent(url.match(/sheet=([^&]+)/)?.[1] ?? '');
      return SHEETS[name];
    });
    const data = await getQuizData();
    expect(data.jobs).toEqual([{ id: 't', name: 'Teacher' }]);
  });

  it('throws when Questions sheet is empty', async () => {
    mockFetch((url) => (url.includes('sheet=Questions') ? gviz([], []) : SHEETS.Options));
    await expect(getQuizData()).rejects.toThrow(/Questions/);
  });

  it('drops questions that have no options', async () => {
    mockFetch((url) => {
      if (url.includes('sheet=Questions')) {
        return gviz(['question_id', 'text', 'order', ''], [
          ['q2', 'Second?', 2, null],
          ['q1', 'First?', 1, null],
          ['q9', 'Orphan?', 9, null],
        ]);
      }
      const name = decodeURIComponent(url.match(/sheet=([^&]+)/)?.[1] ?? '');
      return SHEETS[name];
    });
    const data = await getQuizData();
    expect(data.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
  });
});
