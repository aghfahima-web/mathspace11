import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onStatusChange }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      if (onStatusChange) onStatusChange(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      if (onStatusChange) onStatusChange(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-pulse sticky top-0 z-50">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Koneksi terputus. Jawaban akan disimpan secara lokal dan disinkronkan otomatis ketika koneksi kembali.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all sticky top-0 z-50">
        <Wifi className="w-4 h-4 shrink-0" />
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Koneksi kembali. Jawaban berhasil disinkronkan dengan server.</span>
      </div>
    );
  }

  return null;
};
