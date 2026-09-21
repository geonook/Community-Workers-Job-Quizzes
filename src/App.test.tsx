import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const quizData = {
  questions: [
    { id: 'q1', text: 'First?', choices: [{ id: 'q1_A', text: 'A1' }, { id: 'q1_B', text: 'B1' }] },
    { id: 'q2', text: 'Second?', choices: [{ id: 'q2_A', text: 'A2' }, { id: 'q2_B', text: 'B2' }] },
  ],
  jobs: [{ id: 't', name: 'Teacher' }, { id: 'n', name: 'Nurse' }],
  optionJobMap: [
    { option_id: 'q1_A', job_id: 't' },
    { option_id: 'q1_B', job_id: 'n' },
    { option_id: 'q2_A', job_id: 't' },
    { option_id: 'q2_B', job_id: 'n' },
  ],
};

const getQuizData = vi.fn();
vi.mock('../utils/googleSheetParser', () => ({ getQuizData: () => getQuizData() }));

vi.mock('../components/CameraCapture', () => ({
  default: ({ onSuccess }: any) => (
    <button data-testid="mock-camera" onClick={() => onSuccess('rec_1', 'https://cdn/p.jpg')}>camera</button>
  ),
}));
vi.mock('../components/ProcessingStatus', () => ({
  default: ({ recordId }: any) => <div data-testid="processing-status">Polling {recordId}</div>,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  getQuizData.mockReset().mockResolvedValue(quizData);
  fetchMock.mockReset().mockImplementation(async (url: string) => {
    if (url.endsWith('/api/generate-description')) {
      return { ok: true, json: async () => ({ success: true, description: 'Nice job text' }) };
    }
    if (url.endsWith('/api/submit-questionnaire')) {
      return { ok: true, json: async () => ({ success: true }) };
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function goToQuiz(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { level: 1, name: /what job is right for you/i });
  await user.type(screen.getByLabelText(/your name/i), 'Mia');
  await user.type(screen.getByLabelText(/your class/i), '3A');
  await user.click(screen.getByTestId('mock-camera'));
  await user.click(screen.getByRole('button', { name: /start quiz/i }));
}

describe('App state machine', () => {
  it('shows a loading state, then the start screen', async () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent(/getting your quiz ready/i);
    expect(await screen.findByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
  });

  it('shows the sheet error with retry when loading fails', async () => {
    getQuizData.mockRejectedValueOnce(new Error('Sheet not published'));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Sheet not published');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
    expect(getQuizData).toHaveBeenCalledTimes(2);
  });

  it('walks start → quiz → submitting → results and submits the right payload', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A2$/ }));

    expect(await screen.findByRole('heading', { level: 1, name: /mia, you'd be a great teacher!/i })).toBeInTheDocument();
    expect(screen.getByText('Nice job text')).toBeInTheDocument();
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');

    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/submit-questionnaire'));
    expect(JSON.parse(submitCall![1].body)).toEqual({
      recordId: 'rec_1',
      studentName: 'Mia',
      studentClass: '3A',
      answers: ['q1_A', 'q2_A'],
      recommendedJobs: 'Teacher',
      scores: { Teacher: 2 },
      geminiDescription: 'Nice job text',
    });
  });

  it('Back removes the last answer and returns to the previous question', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^B1$/ }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    await screen.findByRole('heading', { level: 1, name: /teacher/i });
    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/submit-questionnaire'));
    expect(JSON.parse(submitCall![1].body).answers).toEqual(['q1_A', 'q2_A']);
  });

  it('offers Try again when submission fails, then succeeds on retry', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: true, json: async () => ({ success: true, description: 'd' }) }))
             .mockImplementationOnce(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save your answers. Please try again.');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /teacher/i })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/generate-description'))).toHaveLength(2);
    expect(screen.getByText('Nice job text')).toBeInTheDocument();
    expect(screen.queryByText(/提交/)).not.toBeInTheDocument();
  });

  it('submits a placeholder recommendation and shows the fallback heading when no option maps to a job', async () => {
    getQuizData.mockResolvedValueOnce({ ...quizData, optionJobMap: [] });
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    expect(await screen.findByRole('heading', { level: 1, name: /mia, you'd be great at many jobs!/i })).toBeInTheDocument();
    const submitCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/api/submit-questionnaire'));
    expect(JSON.parse(submitCall![1].body).recommendedJobs).toBe('No clear match');
  });

  it('Next student resets to Start without refetching the sheet', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToQuiz(user);
    await user.click(screen.getByRole('button', { name: /^A1$/ }));
    await user.click(screen.getByRole('button', { name: /^A2$/ }));
    await screen.findByRole('heading', { level: 1, name: /teacher/i });
    await user.click(screen.getByRole('button', { name: /next student/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/your name/i)).toHaveValue('');
    expect(getQuizData).toHaveBeenCalledTimes(1);
  });
});
