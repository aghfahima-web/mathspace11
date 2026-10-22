import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, Upload, AlertCircle, FlipHorizontal, FileImage } from 'lucide-react';

interface CameraAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoDataUrl: string) => void;
  onLogEvent: (eventType: 'CAMERA_OPEN' | 'CAMERA_CAPTURE' | 'CAMERA_CONFIRM' | 'CAMERA_CANCEL', metadata?: any) => void;
  initialPhotoUrl?: string;
}

export const CameraAnswerModal: React.FC<CameraAnswerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onLogEvent,
  initialPhotoUrl,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialPhotoUrl || null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start camera stream
  const startCamera = async (mode = facingMode) => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // Explicitly no audio for privacy
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsInitializing(false);
      setCameraError(
        'Kamera tidak dapat digunakan atau izin akses belum diberikan pada browser Anda.'
      );
    }
  };

  // Stop camera stream safely
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      onLogEvent('CAMERA_OPEN', {
        context: 'Modal camera jawaban dibuka oleh siswa secara eksplisit',
      });
      if (activeTab === 'camera' && !capturedImage) {
        startCamera(facingMode);
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Capture current frame from video to canvas
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImage(dataUrl);
    stopCamera();
    onLogEvent('CAMERA_CAPTURE', { resolution: `${canvas.width}x${canvas.height}` });
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm photo answer
  const handleConfirm = () => {
    if (capturedImage) {
      onLogEvent('CAMERA_CONFIRM', { hasImage: true });
      onConfirm(capturedImage);
      stopCamera();
      onClose();
    }
  };

  // Cancel photo capture
  const handleCancel = () => {
    onLogEvent('CAMERA_CANCEL', { reason: 'User klik batal' });
    stopCamera();
    onClose();
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      onLogEvent('CAMERA_CAPTURE', { source: 'file_upload', fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Input Jawaban Melalui Kamera / Foto
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gunakan untuk foto coretan rumus, grafik, kalkulus, atau jawaban kertas.
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab('camera');
              if (!capturedImage) startCamera(facingMode);
            }}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'camera'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Camera className="w-4 h-4" />
            Kamera Langsung
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File Foto
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'camera' && (
            <div>
              {cameraError ? (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Kamera Tidak Dapat Digunakan
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 max-w-md mx-auto">
                    {cameraError} Anda tetap dapat mengunggah foto lembar jawaban secara manual dari galeri perangkat.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Pindah ke Upload File Foto
                  </button>
                </div>
              ) : capturedImage ? (
                /* Review Captured Image */
                <div className="flex flex-col items-center">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video max-h-[380px] flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Captured answer"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Pratinjau Hasil Foto
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                    Pastikan tulisan tangan, angka, dan rumus terbaca dengan jelas sebelum mengonfirmasi.
                  </p>
                </div>
              ) : (
                /* Live Camera Preview */
                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video max-h-[380px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isInitializing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                      <p className="text-sm font-medium">Memulai kamera...</p>
                    </div>
                  )}

                  {/* Switch camera button */}
                  <button
                    onClick={toggleCameraFacing}
                    title="Ganti kamera depan / belakang"
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition shadow-md"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center">
              {capturedImage ? (
                <div className="w-full">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-video max-h-[380px] flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Uploaded answer"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Pilih Foto Lain
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                    <FileImage className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Klik untuk Memilih Foto Jawaban
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs">
                    Mendukung format JPG, PNG, atau WEBP. Maksimal 10MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Foto Ulang (Retake)
                </button>
                <button
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Gunakan Foto Ini (Confirm)
                </button>
              </>
            ) : (
              activeTab === 'camera' &&
              !cameraError && (
                <button
                  onClick={handleCapture}
                  disabled={isInitializing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto (Capture)
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
