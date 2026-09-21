import React, { useCallback, useEffect, useState } from 'react';
import { GameState, QuizData, ScoringResults, QuestionnaireSubmission } from './types';
import { getQuizData } from '../utils/googleSheetParser';
import { computeScores } from '../utils/scoring';
import { submitQuestionnaire } from '../utils/api';
import { getApiUrl } from '../config/api';
import StartScreen, { StartPayload } from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import BusyScreen from '../components/BusyScreen';
import ResultsScreen from '../components/ResultsScreen';

type Student = StartPayload;

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Loading);
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [student, setStudent] = useState<Student | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [results, setResults] = useState<{ scoring: ScoringResults; description: string } | null>(null);

    // ---- Loading ----
    const loadQuiz = useCallback(async () => {
        setGameState(GameState.Loading);
        setLoadError(null);
        try {
            const data = await getQuizData();
            setQuizData(data);
            setGameState(GameState.Start);
        } catch (err: any) {
            setLoadError(err?.message ?? 'Could not load the quiz.');
        }
    }, []);

    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    // ---- Submitting pipeline ----
    const fetchDescription = async (name: string, scoring: ScoringResults): Promise<string> => {
        const response = await fetch(getApiUrl('/api/generate-description'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentName: name, topJobs: scoring.topJobs, sortedScores: scoring.sortedScores }),
        });
        if (!response.ok) throw new Error('Could not write your job story. Please try again.');
        const data = await response.json();
        if (!data.success || !data.description) throw new Error('Could not write your job story. Please try again.');
        return data.description as string;
    };

    const runSubmission = useCallback(async (finalAnswers: string[]) => {
        if (!quizData || !student) return;
        setGameState(GameState.Submitting);
        setSubmitError(null);
        try {
            const scoring = computeScores(finalAnswers, quizData.jobs, quizData.optionJobMap);
            const description = await fetchDescription(student.studentName, scoring);
            const submission: QuestionnaireSubmission = {
                recordId: student.recordId,
                studentName: student.studentName,
                studentClass: student.studentClass,
                answers: finalAnswers,
                recommendedJobs: scoring.topJobs.map((j) => j.job_name).join(', '),
                scores: scoring.counts,
                geminiDescription: description,
            };
            await submitQuestionnaire(submission);
            setResults({ scoring, description });
            setGameState(GameState.Results);
        } catch (err: any) {
            setSubmitError(err?.message ?? 'Could not save your answers. Please try again.');
        }
    }, [quizData, student]);

    // ---- Handlers ----
    const handleStart = useCallback((payload: StartPayload) => {
        setStudent(payload);
        setAnswers([]);
        setGameState(GameState.Quiz);
    }, []);

    const handleSelectChoice = useCallback((optionId: string) => {
        if (!quizData) return;
        const next = [...answers, optionId];
        setAnswers(next);
        if (next.length >= quizData.questions.length) {
            runSubmission(next);
        }
    }, [answers, quizData, runSubmission]);

    const handleBack = useCallback(() => {
        setAnswers((prev) => prev.slice(0, -1));
    }, []);

    const handleRestart = useCallback(() => {
        setStudent(null);
        setAnswers([]);
        setResults(null);
        setSubmitError(null);
        setGameState(GameState.Start);
    }, []);

    // ---- Render ----
    switch (gameState) {
        case GameState.Loading:
            return (
                <BusyScreen
                    title="Getting your quiz ready…"
                    subtitle="Loading questions from your teacher's sheet."
                    error={loadError}
                    onRetry={loadQuiz}
                />
            );
        case GameState.Start:
            return <StartScreen onStart={handleStart} />;
        case GameState.Quiz: {
            if (!quizData) return null;
            const index = Math.min(answers.length, quizData.questions.length - 1);
            return (
                <QuizScreen
                    question={quizData.questions[index]}
                    questionIndex={index}
                    totalQuestions={quizData.questions.length}
                    onSelectChoice={handleSelectChoice}
                    onBack={handleBack}
                />
            );
        }
        case GameState.Submitting:
            return (
                <BusyScreen
                    title="Figuring out what you'd be great at…"
                    subtitle="This only takes a moment."
                    error={submitError}
                    onRetry={() => runSubmission(answers)}
                />
            );
        case GameState.Results:
            return student && results ? (
                <ResultsScreen
                    studentName={student.studentName}
                    topJobs={results.scoring.topJobs}
                    description={results.description}
                    recordId={student.recordId}
                    onRestart={handleRestart}
                />
            ) : null;
        default:
            return null;
    }
};

export default App;
