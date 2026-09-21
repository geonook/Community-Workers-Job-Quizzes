import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartScreen from './StartScreen';

vi.mock('./CameraCapture', () => ({
  default: ({ studentName, studentClass, onSuccess }: any) => (
    <button
      data-testid="mock-camera"
      onClick={() => onSuccess('rec_123', 'https://cdn/photo.jpg')}
    >
      camera for {studentName} / {studentClass}
    </button>
  ),
}));

async function fillNameAndClass(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/your name/i), 'Mia');
  await user.type(screen.getByLabelText(/your class/i), '3A');
}

describe('StartScreen', () => {
  it('renders the heading', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /what job is right for you/i })).toBeInTheDocument();
  });

  it('does not show the camera until name and class are valid', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    expect(screen.queryByTestId('mock-camera')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/your name/i), 'Mia');
    await user.type(screen.getByLabelText(/your class/i), '3');
    expect(screen.queryByTestId('mock-camera')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/your class/i), 'A');
    expect(screen.getByTestId('mock-camera')).toHaveTextContent('camera for Mia / 3A');
  });

  it('keeps Start disabled until a photo has been uploaded', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    await fillNameAndClass(user);
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeDisabled();
    await user.click(screen.getByTestId('mock-camera'));
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeEnabled();
  });

  it('calls onStart with trimmed values and the upload result', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartScreen onStart={onStart} />);
    await user.type(screen.getByLabelText(/your name/i), '  Mia ');
    await user.type(screen.getByLabelText(/your class/i), ' 3A ');
    await user.click(screen.getByTestId('mock-camera'));
    await user.click(screen.getByRole('button', { name: /start quiz/i }));
    expect(onStart).toHaveBeenCalledWith({
      studentName: 'Mia',
      studentClass: '3A',
      recordId: 'rec_123',
      photoUrl: 'https://cdn/photo.jpg',
    });
  });

  it('forgets the uploaded photo when name or class becomes invalid again', async () => {
    const user = userEvent.setup();
    render(<StartScreen onStart={() => {}} />);
    await fillNameAndClass(user);
    await user.click(screen.getByTestId('mock-camera'));
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeEnabled();
    await user.clear(screen.getByLabelText(/your class/i));
    await user.type(screen.getByLabelText(/your class/i), '3A');
    expect(screen.getByTestId('mock-camera')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start quiz/i })).toBeDisabled();
  });
});
