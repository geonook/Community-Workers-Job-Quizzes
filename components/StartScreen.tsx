import React, { useState } from 'react';

interface StartScreenProps {
    onStart: (name: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');

    const trimmed = name.trim();
    const canStart = trimmed.length > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canStart) {
            onStart(trimmed);
        }
    };

    return (
        <main className="min-h-dvh w-full bg-clay-bg flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md md:max-w-2xl">
                <div className="bg-clay-surface rounded-clay shadow-clay p-6 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-heading font-bold text-clay-ink text-3xl md:text-4xl leading-tight">
                            What do you want to be when you grow up?
                        </h1>
                        <p className="font-body text-clay-ink-soft mt-3 text-base md:text-lg">
                            Type your name to begin.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="welcome-name"
                                className="block font-body font-bold text-clay-ink mb-2 text-base"
                            >
                                Your Name
                            </label>
                            <input
                                id="welcome-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-4 rounded-clay border-2 border-orange-200 bg-white text-clay-ink font-body text-lg shadow-clay focus:border-clay-primary"
                                placeholder="e.g. Mia"
                                autoComplete="off"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!canStart}
                            className="clay-press-fx w-full rounded-full bg-clay-primary text-white font-heading font-bold text-xl py-5 shadow-clay hover:bg-clay-primary-press disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Let's start!
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default StartScreen;
