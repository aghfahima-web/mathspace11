import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Database,
  CheckCircle2,
  Sparkles,
  Shield,
  BookOpen,
} from 'lucide-react';
import { apiClient, DatabaseStats } from '../services/api';
import { store } from '../services/store';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isDbChecking, setIsDbChecking] = useState(true);

  // Check centralized database connectivity on mount
  useEffect(() => {
    let isMounted = true;
    apiClient
      .getDatabaseStatus()
      .then((stats) => {
        if (isMounted) {
          setDbStats(stats);
          setIsDbChecking(false);
        }
      })
      .catch((err) => {
        console.warn('Central database check failed:', err);
        if (isMounted) setIsDbChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan Username Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.login(identifier, password);
      // Update central store with logged in user
      store.setCurrentUser(response.user);
      // Trigger sync
      store.syncWithServer();
      onLoginSuccess(response.user);
    } catch (err: any) {
      // Show clean error message
      setErrorMessage(err.message || 'Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto space-y-6 relative z-10 animate-fade-in">
        {/* App Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            E-Learning School
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            SMA Negeri Unggulan 1 • Portal Siswa & Pengajar
          </p>

          {/* Centralized DB Connectivity Badge */}
          <div className="pt-1 flex items-center justify-center">
            {isDbChecking ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Menghubungkan ke Database Pusat...
              </span>
            ) : dbStats?.ok ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 shadow-xs">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Database Pusat Terhubung ({dbStats.totalUsers} Akun Terdaftar)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Mode Terpusat Siap
              </span>
            )}
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-400 mt-1">
              Siswa cukup memasukkan <strong className="text-indigo-300">Username</strong> dan <strong className="text-indigo-300">Kata Sandi</strong>.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username / Identitas Akun <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: rizky atau admin"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950/80 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 transition outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kata Sandi (Password) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950/80 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 placeholder-slate-500 transition outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 transition"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi di Database Pusat...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke E-Learning</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Pilih Akun Demo Cepat (1-Klik):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Sekolah2026!')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition group cursor-pointer"
              >
                <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <div className="text-[11px] font-medium text-slate-300 truncate">Budi Santoso</div>
                <div className="text-[9px] text-slate-500 font-mono">user: admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sri.wahyuni', 'Sekolah2026!')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition group cursor-pointer"
              >
                <div className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Guru
                </div>
                <div className="text-[11px] font-medium text-slate-300 truncate">Dra. Sri W.</div>
                <div className="text-[9px] text-slate-500 font-mono">user: sri.wahyuni</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rizky', 'Sekolah2026!')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition group cursor-pointer"
              >
                <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Siswa
                </div>
                <div className="text-[11px] font-medium text-slate-300 truncate">M. Rizky P.</div>
                <div className="text-[9px] text-slate-500 font-mono">user: rizky</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 text-center leading-relaxed">
              💡 <em>Akun siswa login hanya menggunakan Username dan Kata Sandi dari perangkat mana pun. NISN tidak wajib.</em>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400">
          © 2026 E-Learning School SMA Negeri Unggulan 1. Sistem Terpusat.
        </div>
      </div>
    </div>
  );
};
