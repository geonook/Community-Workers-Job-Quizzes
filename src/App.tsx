import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import { JobKey } from './data/jobs';
import StartScreen from '../components/StartScreen';
import QuizScreen from '../components/QuizScreen';
import PhotoScreen from '../components/PhotoScreen';
import ResultsScreen from '../components/ResultsScreen';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Welcome);
    const [studentName, setStudentName] = useState('');
    const [pickedJob, setPickedJob] = useState<JobKey | null>(null);
    const [recordId, setRecordId] = useState<string | null>(null);
    const [geminiDescription, setGeminiDescription] = useState<string>('');

    const handleWelcomeStart = useCallback((name: string) => {
        setStudentName(name);
        setGameState(GameState.Selection);
    }, []);

    const handlePickJob = useCallback((jobKey: JobKey) => {
        setPickedJob(jobKey);
        setGameState(GameState.Photo);
    }, []);

    const handlePhotoBack = useCallback(() => {
        setGameState(GameState.Selection);
    }, []);

    const handlePhotoComplete = useCallback((rid: string, description: string) => {
        setRecordId(rid);
        setGeminiDescription(description);
        setGameState(GameState.Results);
    }, []);

    const handleRestart = useCallback(() => {
        setGameState(GameState.Welcome);
        setStudentName('');
        setPickedJob(null);
        setRecordId(null);
        setGeminiDescription('');
    }, []);

    switch (gameState) {
        case GameState.Welcome:
            return <StartScreen onStart={handleWelcomeStart} />;
        case GameState.Selection:
            return <QuizScreen onPick={handlePickJob} />;
        case GameState.Photo:
            return pickedJob ? (
                <PhotoScreen
                    studentName={studentName}
                    pickedJob={pickedJob}
                    onBack={handlePhotoBack}
                    onComplete={handlePhotoComplete}
                />
            ) : null;
        case GameState.Results:
            return pickedJob && recordId ? (
                <ResultsScreen
                    recordId={recordId}
                    pickedJob={pickedJob}
                    studentName={studentName}
                    geminiDescription={geminiDescription}
                    onRestart={handleRestart}
                />
            ) : null;
        default:
            return null;
    }
};

export default App;
