import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BgmToggleProps {
  on: boolean;
  onToggle: (next: boolean) => void;
}

const BgmToggle: React.FC<BgmToggleProps> = ({ on, onToggle }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? 'Background music: turn off' : 'Background music: turn on'}
      onClick={() => onToggle(!on)}
      className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface px-4 py-2 text-clay-ink-soft shadow-clay font-body text-sm"
    >
      {on ? <Volume2 size={20} strokeWidth={2.5} aria-hidden /> : <VolumeX size={20} strokeWidth={2.5} aria-hidden />}
      <span>Background music</span>
    </button>
  );
};

export default BgmToggle;
