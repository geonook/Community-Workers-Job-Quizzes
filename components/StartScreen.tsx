import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

interface StartScreenProps {
    onStart: (name: string, className: string) => void;
    onPhotoCapture: (recordId: string, photoUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onPhotoCapture }) => {
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [hasPhoto, setHasPhoto] = useState(false);

    const handlePhotoSuccess = (recordId: string, photoUrl: string) => {
        setHasPhoto(true);
        onPhotoCapture(recordId, photoUrl);
    };

    const handlePhotoError = (error: string) => {
        console.error('Photo capture error:', error);
        // 錯誤已在 CameraCapture 元件中顯示
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && className.trim() && hasPhoto) {
            onStart(name, className);
        }
    };

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl md:max-w-2xl p-4 md:p-6">
            <div className="bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10 text-center">
                <h1 className="text-5xl md:text-6xl font-bold mb-3 md:mb-4">🚀</h1>
                <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">What is your dream job in your community?</h2>
                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                    {/* Step 1: Name input */}
                    <div>
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-white/50 text-gray-800 placeholder-gray-600 rounded-lg text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition"
                            aria-label="Your Name"
                            required
                        />
                    </div>

                    {/* Step 2: Class input */}
                    <div>
                        <input
                            type="text"
                            placeholder="Your Class (eg. G2 Pioneers)"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="w-full px-4 md:px-5 py-3 md:py-4 bg-white/50 text-gray-800 placeholder-gray-600 rounded-lg text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-purple-300 transition"
                            aria-label="Your Class"
                            required
                        />
                    </div>

                    {/* Step 3: Camera (only show after name and class are filled) */}
                    {name.trim() && className.trim() && (
                        <div>
                            <CameraCapture
                                studentName={name}
                                studentClass={className}
                                onSuccess={handlePhotoSuccess}
                                onError={handlePhotoError}
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg py-4 md:py-5 text-white font-bold text-lg md:text-2xl shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!name.trim() || !className.trim() || !hasPhoto}
                        aria-label="Start Quiz"
                    >
                        {hasPhoto ? 'Start Quiz' : 'Please take a photo first'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StartScreen;