import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BusyScreen from './BusyScreen';

describe('BusyScreen', () => {
  it('shows a live status with the title while busy', () => {
    render(<BusyScreen title="Getting your quiz ready…" subtitle="One moment" />);
    expect(screen.getByRole('status')).toHaveTextContent('Getting your quiz ready…');
    expect(screen.getByText('One moment')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the error and a Try again button when error is set', async () => {
    const onRetry = vi.fn();
    render(<BusyScreen title="Loading" error="Sheet not published" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Sheet not published');
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
});
