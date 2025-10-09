import React, { useMemo, useState, useEffect } from 'react';
import { QuizData, ScoringResults, QuestionnaireSubmission } from '../src/types';
import ReportModal from './ReportModal';
import ProcessingStatus from './ProcessingStatus';
import { computeScores } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';

interface ResultsScreenProps {
    answers: string[];
    quizData: QuizData;
    onRestart: () => void;
    studentName: string;
    studentClass: string;
    recordId: string | null;
    photoUrl: string | null;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
    answers,
    quizData,
    onRestart,
    studentName,
    studentClass,
    recordId,
    photoUrl
}) => {
    const [geminiDescription, setGeminiDescription] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [questionnaireSubmitted, setQuestionnaireSubmitted] = useState(false);


    const results = useMemo<ScoringResults>(() => {
        return computeScores(answers, quizData.jobs, quizData.optionJobMap);
    }, [answers, quizData]);

    const topJobs = results.topJobs;
    const otherResults = results.sortedScores.filter(
        score => !topJobs.some(topJob => topJob.job_id === score.job_id)
    ).slice(0, 2);

    useEffect(() => {
        const generateDescription = async () => {
            if (topJobs.length === 0) {
                setIsLoading(false);
                setGeminiDescription("You have a balanced set of interests! This means you're open to many different possibilities. Keep exploring activities you enjoy to discover what you're most passionate about.");
                return;
            }

            try {
                console.log('🤖 Requesting Gemini description from backend...');

                const response = await fetch(getApiUrl('/api/generate-description'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        studentName,
                        topJobs,
                        sortedScores: results.sortedScores,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setGeminiDescription(data.description);
                    if (data.fallback) {
                        console.warn('⚠️  Using fallback description (Gemini API not available)');
                    }
                } else {
                    throw new Error(data.error || 'Failed to generate description');
                }
            } catch (e: any) {
                console.error('❌ Failed to generate description:', e);
                setGeminiDescription('Your unique mix of traits opens up many possibilities! Whether it is helping others, being creative, or using technology, you have the potential to shine in fields you are passionate about.');
            } finally {
                setIsLoading(false);
            }
        };

        generateDescription();
    }, [results, topJobs, studentName]);

    // Effect to submit questionnaire to backend API
    useEffect(() => {
        const submitQuestionnaireData = async () => {
            if (!recordId || questionnaireSubmitted || isLoading) {
                return;
            }

            console.log('📤 Auto-submitting questionnaire...', recordId);

            try {
                const submission: QuestionnaireSubmission = {
                    recordId,
                    answers,
                    recommendedJobs: topJobs.map(j => j.job_name).join(' / '),
                    scores: results.counts,
                    studentName,
                    studentClass,
                    geminiDescription,
                };

                await submitQuestionnaire(submission);
                console.log('✅ Questionnaire submitted successfully');
                setQuestionnaireSubmitted(true);
            } catch (error) {
                console.error('❌ Failed to submit questionnaire:', error);
            }
        };

        submitQuestionnaireData();
    }, [recordId, questionnaireSubmitted, isLoading, answers, topJobs, results, studentName, studentClass, geminiDescription]);

    return (
        <>
            {/* Processing Status - Full screen overlay when active */}
            {recordId && questionnaireSubmitted && (
                <ProcessingStatus
                    recordId={recordId}
                    onComplete={(resultUrl) => {
                        console.log('🎉 Result photo ready:', resultUrl);
                    }}
                    onError={(error) => {
                        console.error('❌ Processing error:', error);
                    }}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-8 md:py-12">
                <div className="max-w-3xl mx-auto px-4 space-y-6 md:space-y-8">

                {/* Welcome Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up">
                    <div className="text-center mb-4">
                        <div className="text-5xl md:text-6xl mb-3">🎉</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Your Career Path, {studentName}!
                        </h1>
                        <p className="text-base md:text-lg text-gray-600">
                            Based on your responses, here are personalized career recommendations
                        </p>
                    </div>
                </div>

                {/* Top Recommendations Card */}
                {topJobs.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                            Top Recommendations
                        </h2>
                        <div className="p-5 md:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                            <p className="text-2xl md:text-3xl font-bold text-indigo-700 text-center">
                                {topJobs.map(j => j.job_name).join(' or ')}
                            </p>
                        </div>
                    </div>
                )}

                {/* Other Options Card */}
                {otherResults.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                            Other Paths to Consider
                        </h2>
                        <ul className="space-y-3">
                            {otherResults.map((job, index) => (
                                <li key={job.job_id} className="flex items-center text-base md:text-lg text-gray-700">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></span>
                                    <span>{job.job_name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* AI Insight Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
                        Personalized Insight
                    </h2>

                    {isLoading && (
                        <div className="flex items-center justify-center gap-3 p-5 bg-gray-50 rounded-xl">
                            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-base md:text-lg text-gray-600">Generating your personalized insight...</span>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="p-4 bg-red-50 rounded-xl border-l-4 border-red-500">
                            <p className="text-sm md:text-base text-red-600">{error}</p>
                        </div>
                    )}

                    {!isLoading && geminiDescription && (
                        <div className="p-4 md:p-5 bg-gray-50 rounded-xl border-l-4 border-indigo-500">
                            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                                {geminiDescription}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 md:gap-5 pb-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <button
                        onClick={onRestart}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 md:py-5 px-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        Restart Quiz
                    </button>
                    <button
                        onClick={() => setIsReportVisible(true)}
                        className="flex-1 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-4 md:py-5 px-8 rounded-xl transition-all transform hover:scale-105 text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    >
                        View Report
                    </button>
                </div>
            </div>

            <ReportModal
                isOpen={isReportVisible}
                onClose={() => setIsReportVisible(false)}
                studentName={studentName}
                studentClass={studentClass}
                results={results}
                geminiDescription={geminiDescription}
            />

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
            </div>
        </>
    );
};

export default ResultsScreen;
