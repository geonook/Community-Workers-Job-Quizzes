import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { UploadResponse, CloudinaryUploadResponse } from '../src/types';
import { getApiUrl } from '../config/api';

interface CameraCaptureProps {
    studentName: string;
    studentClass: string;
    onSuccess: (recordId: string, photoUrl: string) => void;
    onError?: (error: string) => void;
}

type Phase =
    | 'idle'
    | 'starting'
    | 'live'
    | 'preview'
    | 'uploading'
    | 'success'
    | 'error';

const CameraCapture: React.FC<CameraCaptureProps> = ({
    studentName,
    studentClass,
    onSuccess,
    onError,
}) => {
    const [phase, setPhase] = useState<Phase>('idle');
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const photoBlobRef = useRef<Blob | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopStream();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [stopStream, previewUrl]);

    const startCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('This browser does not support camera access.');
            setPhase('error');
            onError?.('No getUserMedia');
            return;
        }
        setPhase('starting');
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            setPhase('live');
            requestAnimationFrame(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { /* autoplay may need a click; ignore */ });
                }
            });
        } catch (err: any) {
            const msg =
                err?.name === 'NotAllowedError'
                    ? 'Camera permission was denied. Please allow camera access and try again.'
                    : err?.name === 'NotFoundError'
                    ? 'No camera was found on this device.'
                    : err?.message ?? 'Could not start the camera.';
            setError(msg);
            setPhase('error');
            onError?.(msg);
        }
    };

    const snapPhoto = () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Could not capture the photo.');
            setPhase('error');
            return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setError('Could not save the photo.');
                    setPhase('error');
                    return;
                }
                photoBlobRef.current = blob;
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(URL.createObjectURL(blob));
                stopStream();
                setPhase('preview');
            },
            'image/jpeg',
            0.92,
        );
    };

    const handleRetake = () => {
        photoBlobRef.current = null;
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setError(null);
        setPhase('idle');
    };

    const uploadToCloudinary = async (blob: Blob): Promise<string> => {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            throw new Error('Cloudinary setup incomplete, please contact your teacher');
        }
        const formData = new FormData();
        formData.append('file', blob, `photo-${Date.now()}.jpg`);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData },
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to save record, please try again');
        }
        const data: UploadResponse = await response.json();
        if (!data.success) throw new Error(data.message || 'Save failed');
        return data.recordId;
    };

    const handleConfirm = async () => {
        const blob = photoBlobRef.current;
        if (!blob) return;
        setPhase('uploading');
        setError(null);
        try {
            const photoUrl = await uploadToCloudinary(blob);
            const recordId = await createAirtableRecord(photoUrl);
            setPhase('success');
            onSuccess(recordId, photoUrl);
        } catch (err: any) {
            const msg = err?.message || 'Upload failed, please try again';
            setError(msg);
            setPhase('error');
            onError?.(msg);
        }
    };

    if (phase === 'success') {
        return (
            <div className="text-center p-6 bg-clay-surface rounded-clay shadow-clay">
                <CheckCircle2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-green-600" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Photo uploaded!</p>
                {previewUrl && (
                    <img
                        src={previewUrl}
                        alt="Your captured photo"
                        className="w-32 h-32 object-cover rounded-clay mx-auto mt-4 shadow-clay"
                    />
                )}
            </div>
        );
    }

    if (phase === 'uploading') {
        return (
            <div className="text-center p-8 bg-clay-surface rounded-clay shadow-clay" role="status" aria-live="polite">
                <Loader2 size={56} strokeWidth={2.5} className="mx-auto mb-3 text-clay-primary animate-spin" aria-hidden />
                <p className="font-heading font-bold text-clay-ink text-xl">Uploading…</p>
            </div>
        );
    }

    if (phase === 'preview' && previewUrl) {
        return (
            <div className="space-y-5">
                <img
                    src={previewUrl}
                    alt="Photo preview"
                    className="w-full max-h-80 object-contain rounded-clay shadow-clay bg-clay-surface"
                />
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleRetake}
                        className="clay-press-fx flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-clay-surface text-clay-ink font-heading font-bold py-4 shadow-clay"
                    >
                        <RefreshCw size={20} strokeWidth={2.5} aria-hidden />
                        Retake
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="clay-press-fx flex-1 rounded-full bg-clay-primary text-white font-heading font-bold py-4 shadow-clay hover:bg-clay-primary-press"
                    >
                        Use this photo
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'live' || phase === 'starting') {
        return (
            <div className="space-y-4">
                <div className="relative w-full bg-black rounded-clay overflow-hidden shadow-clay aspect-[3/4] sm:aspect-video">
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                    />
                    {phase === 'starting' && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/60"
                        >
                            <Loader2 size={48} strokeWidth={2.5} className="animate-spin mb-2" aria-hidden />
                            <p className="font-body">Starting camera…</p>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={snapPhoto}
                    disabled={phase !== 'live'}
                    className="clay-press-fx w-full inline-flex items-center justify-center gap-3 rounded-full bg-clay-primary text-white font-heading font-bold text-xl py-5 shadow-clay hover:bg-clay-primary-press disabled:opacity-50"
                >
                    <Camera size={28} strokeWidth={2.5} aria-hidden />
                    Snap!
                </button>
            </div>
        );
    }

    // idle / error
    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={startCamera}
                className="clay-press-fx w-full bg-clay-primary text-white font-heading font-bold text-xl py-6 rounded-clay shadow-clay hover:bg-clay-primary-press flex items-center justify-center gap-3"
            >
                <Camera size={32} strokeWidth={2.5} aria-hidden />
                Take a photo
            </button>
            <p className="text-center font-body text-clay-ink-soft text-sm">
                We will ask for camera permission.
            </p>
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
