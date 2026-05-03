import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import CameraCapture from './CameraCapture';
import { JobKey, getJobByKey } from '../src/data/jobs';
import { buildPickedJobPayload } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';
import { QuestionnaireSubmission } from '../src/types';

interface PhotoScreenProps {
    studentName: string;
    pickedJob: JobKey;
    onBack?: () => void;
    onComplete: (recordId: string, geminiDescription: string) => void;
}

type Phase = 'capture' | 'submitting' | 'error';

const FALLBACK_DESCRIPTION =
    'You have a great future ahead — keep dreaming big and trying new things every day!';

const PhotoScreen: React.FC<PhotoScreenProps> = ({ studentName, pickedJob, onBack, onComplete }) => {
    const [phase, setPhase] = useState<Phase>('capture');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingRecord, setPendingRecord] = useState<{ recordId: string; photoUrl: string } | null>(null);

    const job = getJobByKey(pickedJob);

    const fetchGeminiDescription = async (): Promise<string> => {
        const payload = buildPickedJobPayload(pickedJob);
        try {
            const response = await fetch(getApiUrl('/api/generate-description'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentName,
                    topJobs: payload.topJobsForGemini,
                    sortedScores: payload.sortedScoresForGemini,
                }),
            });
            if (!response.ok) return FALLBACK_DESCRIPTION;
            const data = await response.json();
            return data.success && data.description ? data.description : FALLBACK_DESCRIPTION;
        } catch {
            return FALLBACK_DESCRIPTION;
        }
    };

    const submitToBackend = async (recordId: string, geminiDescription: string) => {
        const payload = buildPickedJobPayload(pickedJob);
        const submission: QuestionnaireSubmission = {
            recordId,
            studentName,
            studentClass: '',
            answers: payload.answers,
            recommendedJobs: payload.recommendedJobs,
            scores: payload.scores,
            geminiDescription,
        };
        await submitQuestionnaire(submission);
    };

    const runPostUploadPipeline = async (recordId: string, photoUrl: string) => {
        setPhase('submitting');
        setErrorMessage(null);
        setPendingRecord({ recordId, photoUrl });
        try {
            const description = await fetchGeminiDescription();
            await submitToBackend(recordId, description);
            onComplete(recordId, description);
        } catch (err: any) {
            setErrorMessage(err?.message ?? 'Could not save your answer. Please try again.');
            setPhase('error');
        }
    };

    const handleCameraSuccess = (recordId: string, photoUrl: string) => {
        runPostUploadPipeline(recordId, photoUrl);
    };

    const handleRetry = () => {
        if (pendingRecord) {
            runPostUploadPipeline(pendingRecord.recordId, pendingRecord.photoUrl);
        }
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex flex-col items-center px-4 py-6">
            <header className="w-full max-w-md md:max-w-2xl flex items-center justify-between mb-6">
                {onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Go back to job selection"
                        className="clay-press-fx inline-flex items-center gap-2 rounded-full bg-clay-surface text-clay-ink shadow-clay px-4 py-2 font-body"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} aria-hidden />
                        Back
                    </button>
                ) : <span />}
                <p className="font-heading font-bold text-clay-ink text-lg md:text-xl">
                    {job ? job.cta : 'Take your photo!'}
                </p>
            </header>

            <section className="w-full max-w-md md:max-w-2xl">
                {phase === 'capture' && (
                    <CameraCapture
                        studentName={studentName}
                        studentClass=""
                        onSuccess={handleCameraSuccess}
                        onError={(msg) => {
                            setErrorMessage(msg);
                            setPhase('error');
                        }}
                    />
                )}

                {phase === 'submitting' && (
                    <div className="bg-clay-surface rounded-clay shadow-clay p-8 text-center" role="status" aria-live="polite">
                        <div className="font-heading font-bold text-clay-ink text-xl">Saving your answer…</div>
                        <p className="font-body text-clay-ink-soft mt-2">Please wait a moment.</p>
                    </div>
                )}

                {phase === 'error' && (
                    <div role="alert" className="bg-clay-surface rounded-clay shadow-clay p-6 text-center space-y-4">
                        <p className="font-heading font-bold text-clay-danger text-xl">Hmm, that didn't work.</p>
                        <p className="font-body text-clay-ink-soft">
                            {errorMessage ?? 'Please try again in a moment.'}
                        </p>
                        <button
                            type="button"
                            onClick={pendingRecord ? handleRetry : () => setPhase('capture')}
                            className="clay-press-fx rounded-full bg-clay-primary text-white font-heading font-bold py-4 px-8 shadow-clay hover:bg-clay-primary-press"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
};

export default PhotoScreen;
