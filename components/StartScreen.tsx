import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

export interface StartPayload {
    studentName: string;
    studentClass: string;
    recordId: string;
    photoUrl: string;
}

interface StartScreenProps {
    onStart: (payload: StartPayload) => void;
}

/** /api/upload rejects either field shorter than 2 chars after trim. */
const MIN_LEN = 2;

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [upload, setUpload] = useState<{ recordId: string; photoUrl: string } | null>(null);

    const trimmedName = name.trim();
    const trimmedClass = studentClass.trim();
    const inputsValid = trimmedName.length >= MIN_LEN && trimmedClass.length >= MIN_LEN;
    const canStart = inputsValid && upload !== null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canStart || !upload) return;
        onStart({ studentName: trimmedName, studentClass: trimmedClass, ...upload });
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md md:max-w-2xl">
                <div className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl leading-tight">
                            What job is right for you?
                        </h1>
                        <p className="font-body text-clay-ink-soft mt-3 text-base md:text-lg">
                            Tell us who you are, take a photo, then answer 10 quick questions.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="start-name" className="block font-body font-bold text-clay-ink mb-2 text-base">
                                Your Name
                            </label>
                            <input
                                id="start-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. Mia"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label htmlFor="start-class" className="block font-body font-bold text-clay-ink mb-2 text-base">
                                Your Class
                            </label>
                            <input
                                id="start-class"
                                type="text"
                                value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. 3A"
                                autoComplete="off"
                            />
                        </div>

                        {inputsValid ? (
                            <CameraCapture
                                studentName={trimmedName}
                                studentClass={trimmedClass}
                                onSuccess={(recordId, photoUrl) => setUpload({ recordId, photoUrl })}
                            />
                        ) : (
                            <p className="font-body text-clay-ink-soft text-center text-sm">
                                Type your name and class to unlock the camera.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!canStart}
                            className="clay-press-fx w-full rounded-full bg-clay-primary text-white font-heading font-bold text-xl py-5 shadow-clay hover:bg-clay-primary-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start quiz!
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default StartScreen;
