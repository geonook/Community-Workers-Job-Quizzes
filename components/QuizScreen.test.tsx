import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizScreen from './QuizScreen';

describe('SelectionScreen', () => {
  it('renders the first job by default', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByText(/i want to be a musician and play music\./i)).toBeInTheDocument();
  });

  it('shows dynamic CTA matching the current job', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByRole('button', { name: /i want to be a musician!/i })).toBeInTheDocument();
  });

  it('Next button advances to the second job', async () => {
    const user = userEvent.setup();
    render(<QuizScreen onPick={() => {}} />);
    await user.click(screen.getByRole('button', { name: /next job/i }));
    expect(screen.getByText(/i want to be a police officer/i)).toBeInTheDocument();
  });

  it('Previous button at index 0 is disabled', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getByRole('button', { name: /previous job/i })).toBeDisabled();
  });

  it('Next button at the last job is disabled', async () => {
    const user = userEvent.setup();
    render(<QuizScreen onPick={() => {}} />);
    const next = screen.getByRole('button', { name: /next job/i });
    for (let i = 0; i < 10; i++) await user.click(next);
    expect(screen.getByText(/i want to be a doctor and help sick people/i)).toBeInTheDocument();
    expect(next).toBeDisabled();
  });

  it('clicking the primary CTA picks the current job', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<QuizScreen onPick={onPick} />);
    await user.click(screen.getByRole('button', { name: /next job/i }));
    await user.click(screen.getByRole('button', { name: /i want to be a police!/i }));
    expect(onPick).toHaveBeenCalledWith('police');
  });

  it('renders 11 page-indicator dots', () => {
    render(<QuizScreen onPick={() => {}} />);
    expect(screen.getAllByRole('listitem', { name: /job indicator/i })).toHaveLength(11);
  });

  it('starts on the previously picked job when initialJobKey is provided', () => {
    render(<QuizScreen onPick={() => {}} initialJobKey="doctor" />);
    expect(screen.getByText(/i want to be a doctor and help sick people/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next job/i })).toBeDisabled();
  });

  it('falls back to the first job when initialJobKey is unknown', () => {
    render(<QuizScreen onPick={() => {}} initialJobKey={'bogus' as any} />);
    expect(screen.getByText(/i want to be a musician and play music\./i)).toBeInTheDocument();
  });
});
