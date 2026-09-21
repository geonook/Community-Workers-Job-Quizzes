import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizScreen from './QuizScreen';

const question = {
  id: 'q3',
  text: 'What makes you most excited?',
  choices: [
    { id: 'q3_A', text: 'Helping', imageUrl: 'https://x/1.jpg' },
    { id: 'q3_B', text: 'Building' },
    { id: 'q3_C', text: 'Driving' },
    { id: 'q3_D', text: 'Fixing' },
  ],
};

function setup(overrides: Partial<React.ComponentProps<typeof QuizScreen>> = {}) {
  const props = {
    question,
    questionIndex: 2,
    totalQuestions: 10,
    onSelectChoice: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  };
  render(<QuizScreen {...props} />);
  return props;
}

describe('QuizScreen', () => {
  it('shows the question as the page heading and the progress text', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: /what makes you most excited/i })).toBeInTheDocument();
    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
  });

  it('renders one indicator per question', () => {
    setup();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
  });

  it('renders all four options as buttons', () => {
    setup();
    for (const text of ['Helping', 'Building', 'Driving', 'Fixing']) {
      expect(screen.getByRole('button', { name: new RegExp(text, 'i') })).toBeInTheDocument();
    }
  });

  it('calls onSelectChoice with the option id', async () => {
    const props = setup();
    await userEvent.setup().click(screen.getByRole('button', { name: /building/i }));
    expect(props.onSelectChoice).toHaveBeenCalledWith('q3_B');
  });

  it('shows Back and calls onBack when not on the first question', async () => {
    const props = setup();
    await userEvent.setup().click(screen.getByRole('button', { name: /back/i }));
    expect(props.onBack).toHaveBeenCalled();
  });

  it('hides Back on the first question', () => {
    setup({ questionIndex: 0 });
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });
});
