import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Question } from '../src/types';
import OptionCard from './OptionCard';

export interface QuizScreenProps {
    question: Question;
    questionIndex: number;      // 0-based
    totalQuestions: number;
    onSelectChoice: (optionId: string) => void;
    onBack: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({
    question,
    questionIndex,
    totalQuestions,
    onSelectChoice,
    onBack,
}) => {
    const [leaving, setLeaving] = useState(false);

    // New question mounted → reset the leaving animation
    useEffect(() => {
        setLeaving(false);
    }, [question.id]);

    const handleSelect = (optionId: string) => {
        if (leaving) return;
        setLeaving(true);
        onSelectChoice(optionId);
    };

    const gridCols = question.choices.length === 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2';

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <header className="w-full max-w-md md:max-w-3xl text-center space-y-3">
                <p className="font-body font-bold text-clay-ink-soft text-base md:text-lg">
                    Question {questionIndex + 1} of {totalQuestions}
                </p>
                <ul className="flex items-center justify-center gap-2" aria-label="Quiz progress">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                        <li
                            key={i}
                            aria-label={`Question ${i + 1}${i === questionIndex ? ' (current)' : i < questionIndex ? ' (answered)' : ''}`}
                            className={`rounded-full transition-all ${
                                i === questionIndex
                                    ? 'w-6 h-2 bg-clay-primary'
                                    : i < questionIndex
                                    ? 'w-2 h-2 bg-clay-ink'
                                    : 'w-2 h-2 border-2 border-orange-300'
                            }`}
                        />
                    ))}
                </ul>
                <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug pt-2">
                    {question.text}
                </h1>
            </header>

            <section
                key={question.id}
                className={`w-full max-w-md md:max-w-3xl grid ${gridCols} gap-4 mt-6 ${leaving ? 'animate-slide-out' : 'animate-slide-in-right'}`}
            >
                {question.choices.map((choice, index) => (
                    <OptionCard key={choice.id} choice={choice} index={index} onSelect={handleSelect} />
                ))}
            </section>

            <nav className="w-full max-w-md md:max-w-3xl flex items-center justify-start mt-6">
                {questionIndex > 0 && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface text-clay-ink font-heading font-bold shadow-clay px-5 py-3"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} aria-hidden />
                        Back
                    </button>
                )}
            </nav>
        </main>
    );
};

export default QuizScreen;
