import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

vi.mock('../components/PhotoScreen', () => ({
  default: ({ onComplete }: any) => (
    <button data-testid="mock-photo-done" onClick={() => onComplete('rec_xx')}>
      mock photo done
    </button>
  ),
}));
vi.mock('../components/ResultsScreen', () => ({
  default: ({ pickedJob }: any) => (
    <div data-testid="result-screen">
      result for {pickedJob}
    </div>
  ),
}));

describe('App state machine', () => {
  it('starts on the welcome screen', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /what do you want to be when you grow up/i })
    ).toBeInTheDocument();
  });

  it('flows welcome → selection → photo → result', async () => {
    const user = userEvent.setup();
    render(<App />);

    // welcome
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    await user.click(screen.getByRole('button', { name: /let's start/i }));

    // selection — pick first job (musician)
    await user.click(screen.getByRole('button', { name: /i want to be a musician!/i }));

    // photo
    await user.click(screen.getByTestId('mock-photo-done'));

    // result
    expect(screen.getByTestId('result-screen')).toHaveTextContent('result for musician');
  });
});
