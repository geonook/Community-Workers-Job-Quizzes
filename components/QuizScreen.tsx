import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { JOBS, JobKey } from '../src/data/jobs';

interface QuizScreenProps {
    onPick: (jobKey: JobKey) => void;
    initialJobKey?: JobKey | null;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onPick, initialJobKey }) => {
    const initialIndex = (() => {
        if (!initialJobKey) return 0;
        const i = JOBS.findIndex((j) => j.key === initialJobKey);
        return i >= 0 ? i : 0;
    })();
    const [index, setIndex] = useState(initialIndex);
    const [direction, setDirection] = useState<'left' | 'right'>('right');

    const current = JOBS[index];
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[current.icon];

    const goPrev = () => {
        if (index > 0) {
            setDirection('left');
            setIndex(index - 1);
        }
    };
    const goNext = () => {
        if (index < JOBS.length - 1) {
            setDirection('right');
            setIndex(index + 1);
        }
    };
    const handlePick = () => onPick(current.key);

    const animationClass =
        direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center justify-between px-4 py-6">
            <header className="text-center pt-2 pb-4">
                <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl">
                    Pick your dream job
                </h1>
            </header>

            <section className="flex-1 w-full max-w-md md:max-w-2xl flex items-center justify-center">
                <div
                    key={current.key}
                    className={`bg-clay-surface rounded-clay shadow-clay p-8 md:p-10 w-full text-center ${animationClass}`}
                >
                    <div className="flex items-center justify-center mb-6">
                        {Icon ? (
                            <Icon size={96} strokeWidth={2.5} className="text-clay-primary" aria-hidden />
                        ) : (
                            <div className="w-24 h-24" />
                        )}
                    </div>

                    <p className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug mb-6">
                        {current.sentence}
                    </p>

                    <button
                        type="button"
                        onClick={handlePick}
                        className="clay-press-fx animate-wiggle w-full rounded-full bg-clay-primary text-white font-heading font-bold text-lg md:text-xl py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        {current.cta}
                    </button>
                </div>
            </section>

            <nav className="w-full max-w-md md:max-w-2xl flex items-center justify-between mt-6">
                <button
                    type="button"
                    onClick={goPrev}
                    disabled={index === 0}
                    aria-label="Previous job"
                    className="clay-press-fx flex items-center justify-center w-14 h-14 rounded-full bg-clay-surface text-clay-ink shadow-clay disabled:opacity-40"
                >
                    <LucideIcons.ChevronLeft size={28} strokeWidth={2.5} aria-hidden />
                </button>

                <ul className="flex items-center gap-2" aria-label="Job carousel position">
                    {JOBS.map((job, i) => (
                        <li
                            key={job.key}
                            aria-label={`Job indicator ${i + 1}`}
                            className={`rounded-full transition-all ${
                                i === index
                                    ? 'w-6 h-2 bg-clay-primary'
                                    : 'w-2 h-2 bg-orange-200'
                            }`}
                        />
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={goNext}
                    disabled={index === JOBS.length - 1}
                    aria-label="Next job"
                    className="clay-press-fx flex items-center justify-center w-14 h-14 rounded-full bg-clay-surface text-clay-ink shadow-clay disabled:opacity-40"
                >
                    <LucideIcons.ChevronRight size={28} strokeWidth={2.5} aria-hidden />
                </button>
            </nav>
        </main>
    );
};

export default QuizScreen;
