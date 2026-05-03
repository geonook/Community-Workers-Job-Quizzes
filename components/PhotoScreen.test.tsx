import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoScreen from './PhotoScreen';

vi.mock('./CameraCapture', () => ({
  default: ({ onSuccess }: any) => (
    <button
      data-testid="mock-camera-confirm"
      onClick={() => onSuccess('rec_123', 'https://cdn.example/photo.jpg')}
    >
      Mock confirm photo
    </button>
  ),
}));

const originalFetch = global.fetch;

describe('PhotoScreen', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('after photo upload, calls generate-description then submit-questionnaire and advances', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, description: 'You will be a great doctor!' }),
        });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith('rec_123', 'You will be a great doctor!')
    );

    const submitCall = (global.fetch as any).mock.calls.find(
      ([url]: [string]) => url.includes('/api/submit-questionnaire')
    );
    const submittedBody = JSON.parse(submitCall[1].body);
    expect(submittedBody).toMatchObject({
      recordId: 'rec_123',
      studentName: 'Mia',
      studentClass: '',
      answers: ['doctor'],
      recommendedJobs: 'Doctor',
      scores: { doctor: 1 },
      geminiDescription: 'You will be a great doctor!',
    });
  });

  it('shows a retry button when submit-questionnaire fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, description: 'desc' }),
        });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={() => {}}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('uses fallback description when generate-description fails but still submits', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/generate-description')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      if (url.includes('/api/submit-questionnaire')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoScreen
        studentName="Mia"
        pickedJob="doctor"
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByTestId('mock-camera-confirm'));

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    const [, geminiText] = onComplete.mock.calls[0];
    expect(typeof geminiText).toBe('string');
    expect(geminiText.length).toBeGreaterThan(0);
  });
});
