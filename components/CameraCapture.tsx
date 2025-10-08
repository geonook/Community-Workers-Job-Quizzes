import React, { useState, useRef } from 'react';
import { CaptureStatus, UploadResponse, CloudinaryUploadResponse } from '../src/types';
import { getApiUrl } from '../config/api';

interface CameraCaptureProps {
    studentName: string;
    studentClass: string;
    onSuccess: (recordId: string, photoUrl: string) => void;
    onError?: (error: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
    studentName,
    studentClass,
    onSuccess,
    onError
}) => {
    const [status, setStatus] = useState<CaptureStatus>(CaptureStatus.Idle);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Environment variables
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // File validation
    const validateFile = (file: File): string | null => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

        if (!allowedTypes.includes(file.type)) {
            return 'Only JPG or PNG images are allowed';
        }

        if (file.size > maxSize) {
            return 'Image too large! Please choose a photo under 5MB';
        }

        return null;
    };

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setStatus(CaptureStatus.Error);
            onError?.(validationError);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setPhotoFile(file);
            setStatus(CaptureStatus.Preview);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    // Trigger camera
    const triggerCamera = () => {
        fileInputRef.current?.click();
    };

    // Retake photo
    const handleRetake = () => {
        setPreview(null);
        setPhotoFile(null);
        setStatus(CaptureStatus.Idle);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload to Cloudinary
    const uploadToCloudinary = async (file: File): Promise<string> => {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary setup incomplete, please contact your teacher');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Photo upload failed, please try again');
        }

        const data: CloudinaryUploadResponse = await response.json();
        return data.secure_url;
    };

    // Create Airtable record
    const createAirtableRecord = async (photoUrl: string): Promise<string> => {
        const response = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                photoUrl,
                studentName,
                studentClass,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save record, please try again');
        }

        const data: UploadResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Save failed');
        }

        return data.recordId;
    };

    // Confirm photo
    const handleConfirm = async () => {
        if (!photoFile) return;

        setStatus(CaptureStatus.Uploading);
        setError(null);

        try {
            console.log('📤 Uploading photo to Cloudinary...');
            const photoUrl = await uploadToCloudinary(photoFile);
            console.log('✅ Cloudinary upload successful:', photoUrl);

            console.log('💾 Creating Airtable record...');
            const recordId = await createAirtableRecord(photoUrl);
            console.log('✅ Airtable record created:', recordId);

            setStatus(CaptureStatus.Success);
            onSuccess(recordId, photoUrl);
        } catch (err: any) {
            console.error('❌ Upload failed:', err);
            const errorMessage = err.message || 'Upload failed, please try again';
            setError(errorMessage);
            setStatus(CaptureStatus.Error);
            onError?.(errorMessage);
        }
    };

    // Render success state
    if (status === CaptureStatus.Success) {
        return (
            <div className="text-center p-5 md:p-7 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="text-5xl md:text-6xl mb-4">✅</div>
                <p className="text-xl md:text-2xl font-bold text-green-800 mb-2">Photo Uploaded!</p>
                {preview && (
                    <img
                        src={preview}
                        alt="Uploaded"
                        className="w-32 md:w-40 h-32 md:h-40 object-cover rounded-xl mx-auto mt-4 shadow-md"
                    />
                )}
            </div>
        );
    }

    // Render uploading state
    if (status === CaptureStatus.Uploading) {
        return (
            <div className="text-center p-6 md:p-10 bg-indigo-50 rounded-xl border-2 border-indigo-200">
                <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-16 md:h-20 w-16 md:w-20 border-b-4 border-indigo-600"></div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-indigo-800">Uploading Photo...</p>
                <p className="text-base md:text-lg text-indigo-600 mt-2">Please wait</p>
            </div>
        );
    }

    // Render preview state
    if (status === CaptureStatus.Preview && preview) {
        return (
            <div className="space-y-5 md:space-y-6">
                {/* Preview Photo */}
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-80 md:max-h-[600px] object-contain rounded-xl shadow-lg"
                    />
                </div>

                {/* Button Group */}
                <div className="flex gap-3 md:gap-4">
                    {/* Retake Button */}
                    <button
                        onClick={handleRetake}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 md:py-5 px-6 md:px-8 rounded-xl text-base md:text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
                    >
                        Retake
                    </button>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 md:py-5 px-6 md:px-8 rounded-xl text-base md:text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    // Render idle state (default)
    return (
        <div className="space-y-4 md:space-y-5">
            {/* Camera Button */}
            <button
                onClick={triggerCamera}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 md:py-7 px-8 md:px-10 rounded-xl text-lg md:text-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 min-h-[80px] md:min-h-[100px] focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
                Take a Photo
            </button>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 px-4 md:px-5 py-3 md:py-4 rounded-xl">
                    <p className="text-sm md:text-base font-semibold">{error}</p>
                </div>
            )}

            {/* Helper Text */}
            <p className="text-center text-gray-500 text-sm md:text-base">
                Tap the button to use your device camera
            </p>
        </div>
    );
};

export default CameraCapture;
