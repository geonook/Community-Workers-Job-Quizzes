import React from 'react';
import { RotateCcw } from 'lucide-react';
import ProcessingStatus from './ProcessingStatus';
import { JobKey, getJobByKey } from '../src/data/jobs';

interface ResultsScreenProps {
    recordId: string;
    pickedJob: JobKey;
    studentName: string;
    geminiDescription: string;
    onRestart: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    recordId,
    pickedJob,
    studentName,
    geminiDescription,
    onRestart,
}) => {
    const job = getJobByKey(pickedJob);
    const heading = job?.sentence ?? `Great choice, ${studentName}!`;

    // Suppress the description card when Gemini is unavailable and the
    // server returned a song-lyric fallback that just echoes the heading.
    // The fallback always starts with the same "I want to be ..." sentence.
    const headingPrefix = job ? job.sentence.replace(/\.$/, '') : null;
    const isFallbackEcho = !!(
        headingPrefix && geminiDescription.startsWith(headingPrefix)
    );
    const showDescription = geminiDescription && !isFallbackEcho;

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <div className="w-full max-w-md md:max-w-2xl space-y-6">
                <header className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 text-center">
                    <h1 className="font-heading font-bold text-clay-ink text-2xl md:text-3xl leading-snug">
                        {heading}
                    </h1>
                    <p className="font-body text-clay-ink-soft mt-2 text-base">
                        Great choice, {studentName}!
                    </p>
                </header>

                <ProcessingStatus
                    recordId={recordId}
                    onRestart={onRestart}
                />

                {showDescription && (
                    <article className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-8 border-l-8 border-clay-primary">
                        <p className="font-body text-clay-ink leading-relaxed text-base md:text-lg">
                            {geminiDescription}
                        </p>
                    </article>
                )}

                <div className="pb-8">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="clay-press-fx w-full inline-flex items-center justify-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-lg py-5 shadow-clay hover:bg-clay-primary-press"
                    >
                        <RotateCcw size={24} strokeWidth={2.5} aria-hidden />
                        Start over
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ResultsScreen;
