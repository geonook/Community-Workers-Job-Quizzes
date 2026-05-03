import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

describe('WelcomeScreen', () => {
  it('renders the heading', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /what do you want to be when you grow up/i })
    ).toBeInTheDocument();
  });

  it('disables Start button when name is empty', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /let's start/i })).toBeDisabled();
  });

  it('enables Start button once a name is typed', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    expect(screen.getByRole('button', { name: /let's start/i })).toBeEnabled();
  });

  it('calls onStart with trimmed name', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartScreen onStart={onStart} />);
    await user.type(screen.getByLabelText(/your name/i), '  Mia  ');
    await user.click(screen.getByRole('button', { name: /let's start/i }));
    expect(onStart).toHaveBeenCalledWith('Mia');
  });

  it('renders a BGM toggle that is off by default', () => {
    render(<StartScreen onStart={() => {}} />);
    const toggle = screen.getByRole('switch', { name: /background music/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
