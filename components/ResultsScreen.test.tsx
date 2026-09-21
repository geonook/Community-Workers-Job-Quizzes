import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsScreen from './ResultsScreen';

vi.mock('./ProcessingStatus', () => ({
  default: ({ recordId, onRestart }: any) => (
    <div data-testid="processing-status">
      Polling {recordId}
      <button onClick={onRestart}>overlay restart</button>
    </div>
  ),
}));

const base = {
  studentName: 'Mia',
  description: 'You love helping people and learning new things.',
  recordId: 'rec_1',
  onRestart: () => {},
};

describe('ResultsScreen', () => {
  it('renders the single top job in the heading', () => {
    render(<ResultsScreen {...base} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    expect(screen.getByRole('heading', { level: 1, name: /mia, you'd be a great teacher!/i })).toBeInTheDocument();
  });

  it('joins tied jobs with "or"', () => {
    render(
      <ResultsScreen
        {...base}
        topJobs={[{ job_id: 't', job_name: 'Teacher' }, { job_id: 'l', job_name: 'Librarian' }]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: /a great teacher or librarian!/i })).toBeInTheDocument();
  });

  it('renders one job card per top job and the AI description', () => {
    render(
      <ResultsScreen
        {...base}
        topJobs={[{ job_id: 't', job_name: 'Teacher' }, { job_id: 'zzz', job_name: 'Astronaut' }]}
      />,
    );
    expect(screen.getAllByTestId('job-card')).toHaveLength(2);
    expect(screen.getByText(base.description)).toBeInTheDocument();
  });

  it('mounts ProcessingStatus with the record id', () => {
    render(<ResultsScreen {...base} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    expect(screen.getByTestId('processing-status')).toHaveTextContent('Polling rec_1');
  });

  it('Next student (bottom and overlay) calls onRestart', async () => {
    const onRestart = vi.fn();
    const user = userEvent.setup();
    render(<ResultsScreen {...base} onRestart={onRestart} topJobs={[{ job_id: 't', job_name: 'Teacher' }]} />);
    await user.click(screen.getByRole('button', { name: /next student/i }));
    await user.click(screen.getByRole('button', { name: /overlay restart/i }));
    expect(onRestart).toHaveBeenCalledTimes(2);
  });
});
