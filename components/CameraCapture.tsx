import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
    onError,
}) => {
    const [status, setStatus] = useState<CaptureStatus>(CaptureStatus.Idle);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const validateFile = (file: File): string | null => {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) return 'Only JPG or PNG images are allowed';
        if (file.size > maxSize) return 'Image too large! Please choose a photo under 5MB';
        return null;
    };

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

    const triggerCamera = () => fileInputRef.current?.click();

    const handleRetake = () => {
        setPreview(null);
        setPhotoFile(null);
        setStatus(CaptureStatus.Idle);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary setup incomplete, please contact your teacher');
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );
        if (!response.ok) throw new Error('Photo upload failed, please try again');
        const data: CloudinaryUploadResponse = await response.json();
        return data.secure_url;
    };

    const createAirtableRecord = async (photoUrl: string): Promise<string> => {
        const response = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl, studentName, studentClass }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save record, please try again');
        }
        const data: UploadResponse = await response.json();
        if (!data.success) throw new Error(data.message || 'Save failed');
        return data.recordId;
    };

    const handleConfirm = async () => {
        if (!photoFile) return;
        setStatus(CaptureStatus.Uploading);
        setError(null);
        try {
            const photoUrl = await uploadToCloudinary(photoFile);
            const recordId = await createAirtableRecord(photoUrl);
            setStatus(CaptureStatus.Success);
            onSuccess(recordId, photoUrl);
        } catch (err: any) {
            const errorMessage = err.message || 'Upload failed, please try again';
            setError(errorMessage);
            setStatus(CaptureStatus.Error);
            onError?.(errorMessage);
        }
    };

    if (status === CaptureStatus.Success) {
        return (
            <div className="text-center p-6 bg-clay-surface rounded-clay shadow-clay">
                <CheckCircle2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-green-600" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Photo uploaded!</p>
                {preview && (
                    <img
                        src={preview}
                        alt="Your captured photo"
                        className="w-32 h-32 object-cover rounded-clay mx-auto mt-4 shadow-clay"
                    />
                )}
            </div>
        );
    }

    if (status === CaptureStatus.Uploading) {
        return (
            <div className="text-center p-8 bg-clay-surface rounded-clay shadow-clay" role="status" aria-live="polite">
                <Loader2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-clay-primary animate-spin" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Uploading…</p>
            </div>
        );
    }

    if (status === CaptureStatus.Preview && preview) {
        return (
            <div className="space-y-5">
                <img
                    src={preview}
                    alt="Photo preview"
                    className="w-full max-h-72 object-contain rounded-clay shadow-clay bg-clay-surface"
                />
                <div className="flex gap-3">
                    <button
                        onClick={handleRetake}
                        className="clay-press-fx flex-1 rounded-full bg-clay-surface text-clay-ink font-heading font-bold py-4 shadow-clay"
                    >
                        Retake
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="clay-press-fx flex-1 rounded-full bg-clay-primary text-white font-heading font-bold py-4 shadow-clay hover:bg-clay-primary-press"
                    >
                        Use this photo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                onClick={triggerCamera}
                className="clay-press-fx w-full bg-clay-primary text-white font-heading font-bold text-xl py-6 rounded-clay shadow-clay hover:bg-clay-primary-press flex items-center justify-center gap-3"
            >
                <Camera size={32} strokeWidth={2.5} aria-hidden />
                Take a photo
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
            />
            {error && (
                <div role="alert" className="bg-red-50 border-2 border-red-300 text-red-800 px-4 py-3 rounded-clay flex items-start gap-2">
                    <AlertCircle size={20} strokeWidth={2.5} className="mt-0.5 flex-shrink-0" aria-hidden />
                    <p className="font-body">{error}</p>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
