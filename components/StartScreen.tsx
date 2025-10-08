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
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && className.trim() && hasPhoto) {
            onStart(name, className);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 py-12 md:py-16 px-4">
            <div className="w-full max-w-xl md:max-w-2xl mx-auto">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10">
                    {/* Hero Section */}
                    <div className="text-center mb-8 md:mb-10">
                        <div className="text-5xl md:text-7xl mb-4">🚀</div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                            Discover Your Dream Job
                        </h1>
                        <p className="text-base md:text-lg text-gray-600">
                            What is your dream job in your community?
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl text-base md:text-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                aria-label="Your Name"
                                required
                            />
                        </div>

                        {/* Class Input */}
                        <div>
                            <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                                Your Class
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., G2 Pioneers"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="w-full px-4 md:px-5 py-3 md:py-4 bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 rounded-xl text-base md:text-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
                                aria-label="Your Class"
                                required
                            />
                        </div>

                        {/* Camera Capture */}
                        {name.trim() && className.trim() && (
                            <div className="pt-2">
                                <label className="block text-sm md:text-base font-medium text-gray-700 mb-3">
                                    Take Your Photo
                                </label>
                                <CameraCapture
                                    studentName={name}
                                    studentClass={className}
                                    onSuccess={handlePhotoSuccess}
                                    onError={handlePhotoError}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 md:py-5 px-8 rounded-xl text-base md:text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            disabled={!name.trim() || !className.trim() || !hasPhoto}
                            aria-label="Start Quiz"
                        >
                            {hasPhoto ? 'Start Quiz' : 'Please complete all steps above'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StartScreen;
