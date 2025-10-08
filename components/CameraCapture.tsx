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

    // 環境變數
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // 檔案驗證
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

    // 處理檔案選擇
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 驗證檔案
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setStatus(CaptureStatus.Error);
            onError?.(validationError);
            return;
        }

        // 生成預覽
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setPhotoFile(file);
            setStatus(CaptureStatus.Preview);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    // 觸發相機
    const triggerCamera = () => {
        fileInputRef.current?.click();
    };

    // 重拍
    const handleRetake = () => {
        setPreview(null);
        setPhotoFile(null);
        setStatus(CaptureStatus.Idle);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 上傳到 Cloudinary
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

    // 建立 Airtable 記錄
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

    // 確定使用照片
    const handleConfirm = async () => {
        if (!photoFile) return;

        setStatus(CaptureStatus.Uploading);
        setError(null);

        try {
            // 1. 上傳到 Cloudinary
            console.log('📤 上傳照片到 Cloudinary...');
            const photoUrl = await uploadToCloudinary(photoFile);
            console.log('✅ Cloudinary 上傳成功:', photoUrl);

            // 2. 建立 Airtable 記錄
            console.log('💾 建立 Airtable 記錄...');
            const recordId = await createAirtableRecord(photoUrl);
            console.log('✅ Airtable 記錄建立成功:', recordId);

            setStatus(CaptureStatus.Success);
            onSuccess(recordId, photoUrl);
        } catch (err: any) {
            console.error('❌ 上傳失敗:', err);
            const errorMessage = err.message || 'Upload failed, please try again';
            setError(errorMessage);
            setStatus(CaptureStatus.Error);
            onError?.(errorMessage);
        }
    };

    // 渲染不同狀態
    if (status === CaptureStatus.Success) {
        return (
            <div className="text-center p-5 md:p-7 bg-green-100 rounded-2xl">
                <div className="text-5xl md:text-7xl mb-4">✅</div>
                <p className="text-xl md:text-3xl font-bold text-green-800 mb-2">Photo Uploaded!</p>
                {preview && (
                    <img
                        src={preview}
                        alt="Uploaded"
                        className="w-32 md:w-40 h-32 md:h-40 object-cover rounded-xl mx-auto mt-4"
                    />
                )}
            </div>
        );
    }

    if (status === CaptureStatus.Uploading) {
        return (
            <div className="text-center p-6 md:p-10 bg-blue-100 rounded-2xl">
                <div className="animate-spin rounded-full h-16 md:h-20 w-16 md:w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-xl md:text-3xl font-bold text-blue-800">Uploading Photo...</p>
                <p className="text-base md:text-xl text-blue-600 mt-2">Please wait 😊</p>
            </div>
        );
    }

    if (status === CaptureStatus.Preview && preview) {
        return (
            <div className="space-y-5 md:space-y-6">
                {/* 預覽照片 */}
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-80 md:max-h-[600px] object-contain rounded-2xl shadow-lg"
                    />
                </div>

                {/* 按鈕組 */}
                <div className="flex gap-3 md:gap-4">
                    {/* 重拍按鈕 */}
                    <button
                        onClick={handleRetake}
                        className="flex-1 bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl text-lg md:text-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
                    >
                        🔄 Retake
                    </button>

                    {/* 確定按鈕 */}
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-gradient-to-br from-green-400 to-green-600 text-white font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl text-lg md:text-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
                    >
                        ✅ Confirm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-5">
            {/* 拍照按鈕 */}
            <button
                onClick={triggerCamera}
                className="w-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold py-5 md:py-7 px-8 md:px-10 rounded-2xl text-xl md:text-3xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 min-h-[80px] md:min-h-[100px]"
            >
                📸 Take a Photo
            </button>

            {/* 隱藏的 file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* 錯誤訊息 */}
            {error && (
                <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 md:px-5 py-3 md:py-4 rounded-xl">
                    <p className="text-base md:text-lg font-semibold">❌ {error}</p>
                </div>
            )}

            {/* 提示文字 */}
            <p className="text-center text-gray-600 text-sm md:text-base">
                Tap the button to use iPad camera
            </p>
        </div>
    );
};

export default CameraCapture;
