import React, { useEffect } from 'react';
import { LogOut, X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { Badge } from './Badge';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  user: User | null;
  isLoggingOut: boolean;
  error?: string | null;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoggingOut,
  error,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isLoggingOut) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          aria-label="Tutup modal"
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-900/50">
            <LogOut className="w-6 h-6" />
          </div>
          <div className="pr-6">
            <h3
              id="logout-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Konfirmasi Keluar (Logout)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Apakah Anda yakin ingin mengakhiri sesi pembelajaran ini?
            </p>
          </div>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="p-3.5 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </span>
                <Badge
                  variant={
                    user.role === 'admin'
                      ? 'purple'
                      : user.role === 'guru'
                      ? 'primary'
                      : 'success'
                  }
                  size="sm"
                >
                  {user.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Username: <strong className="text-slate-600 dark:text-slate-300">@{user.username || user.email?.split('@')[0]}</strong>
                {user.className && ` • Kelas ${user.className}`}
              </p>
            </div>
          </div>
        )}

        {/* Data Persistence Safety Notice */}
        <div className="p-3 mb-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Data tugas, absensi, dan nilai Anda <strong>tersimpan aman</strong> di database pusat sekolah dan dapat diakses kembali saat Anda login berikutnya.
          </p>
        </div>

        {/* Error Notification if any */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sedang keluar...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Ya, Keluar Akun</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
