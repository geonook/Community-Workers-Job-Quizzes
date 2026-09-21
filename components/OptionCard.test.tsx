import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionCard from './OptionCard';

const choice = { id: 'q1_A', text: 'Inside', imageUrl: 'https://x/a.jpg' };

describe('OptionCard', () => {
  it('renders the image and the text', () => {
    render(<OptionCard choice={choice} index={0} onSelect={() => {}} />);
    expect(screen.getByRole('img', { name: 'Inside' })).toHaveAttribute('src', 'https://x/a.jpg');
    expect(screen.getByRole('button', { name: /inside/i })).toBeInTheDocument();
  });

  it('calls onSelect with the option id', async () => {
    const onSelect = vi.fn();
    render(<OptionCard choice={choice} index={0} onSelect={onSelect} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /inside/i }));
    expect(onSelect).toHaveBeenCalledWith('q1_A');
  });

  it('swaps to a text-only card when the image fails to load', () => {
    render(<OptionCard choice={choice} index={0} onSelect={() => {}} />);
    fireEvent.error(screen.getByRole('img', { name: 'Inside' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-text-fallback')).toHaveTextContent('Inside');
  });

  it('renders text-only when there is no imageUrl', () => {
    render(<OptionCard choice={{ id: 'q1_B', text: 'Outside' }} index={1} onSelect={() => {}} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('option-text-fallback')).toHaveTextContent('Outside');
  });
});
