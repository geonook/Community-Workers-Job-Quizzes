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

    const handlePhotoComplete = useCallback((rid: string) => {
        setRecordId(rid);
        setGameState(GameState.Results);
    }, []);

    const handleRestart = useCallback(() => {
        setGameState(GameState.Welcome);
        setStudentName('');
        setPickedJob(null);
        setRecordId(null);
    }, []);

    switch (gameState) {
        case GameState.Welcome:
            return <StartScreen onStart={handleWelcomeStart} />;
        case GameState.Selection:
            return <QuizScreen onPick={handlePickJob} initialJobKey={pickedJob} />;
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
                    onRestart={handleRestart}
                />
            ) : null;
        default:
            return null;
    }
};

export default App;
