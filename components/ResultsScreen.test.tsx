import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsScreen from './ResultsScreen';

vi.mock('./ProcessingStatus', () => ({
  default: ({ recordId }: any) => <div data-testid="processing-status">Polling {recordId}</div>,
}));

describe('ResultScreen', () => {
  it('renders the picked job sentence as heading', () => {
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        onRestart={() => {}}
      />
    );
    expect(
      screen.getByRole('heading', { name: /i want to be a doctor and help sick people/i })
    ).toBeInTheDocument();
  });

  it('mounts ProcessingStatus for the AI portrait polling', () => {
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        onRestart={() => {}}
      />
    );
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');
  });

  it('Start over button calls onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    render(
      <ResultsScreen
        recordId="rec_1"
        pickedJob="doctor"
        studentName="Mia"
        onRestart={onRestart}
      />
    );
    await user.click(screen.getByRole('button', { name: /start over/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});
