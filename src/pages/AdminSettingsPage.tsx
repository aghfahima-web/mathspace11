import React, { useState } from 'react';
import { Settings, Shield, Sliders, RotateCcw, Check, Database, Lock, Eye } from 'lucide-react';
import { store } from '../services/store';
import { QuizMonitorThreshold } from '../types';

export const AdminSettingsPage: React.FC = () => {
  const [thresholds, setThresholds] = useState<QuizMonitorThreshold>(store.getThresholds());
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveThresholds(thresholds);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'PERINGATAN: Seluruh data materi, kuis, jawaban, dan log aktivitas akan di-reset ke kondisi awal demo sekolah. Lanjutkan?'
      )
    ) {
      store.initIfEmpty(true);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Pengaturan Sistem & Konfigurasi Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Atur parameter ambang batas aktivitas kuis, privasi pengawasan, dan manajemen basis data sekolah.
        </p>
      </div>

      {/* Thresholds Settings Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Parameter Ambang Batas (Monitoring Thresholds)
            </h3>
          </div>
          {isSaved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Berhasil disimpan
            </span>
          )}
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maksimal Keluar Halaman (Exit)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={thresholds.maxExits}
                onChange={(e) => setThresholds({ ...thresholds, maxExits: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standar: 3 kali</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maksimal Total Durasi Keluar (Detik)
              </label>
              <input
                type="number"
                min="10"
                max="1200"
                value={thresholds.maxTotalExitSeconds}
                onChange={(e) =>
                  setThresholds({ ...thresholds, maxTotalExitSeconds: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standar: 120 detik</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maksimal Keluar Tunggal (Detik)
              </label>
              <input
                type="number"
                min="5"
                max="600"
                value={thresholds.maxSingleExitSeconds}
                onChange={(e) =>
                  setThresholds({ ...thresholds, maxSingleExitSeconds: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Standar: 60 detik</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            *Jika siswa melampaui batasan ini, status aktivitas diubah menjadi <strong>"Perlu Diperhatikan"</strong>. Sistem tidak otomatis menjatuhkan hukuman tanpa evaluasi guru.
          </p>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm"
            >
              Simpan Perubahan Threshold
            </button>
          </div>
        </form>
      </div>

      {/* Security and Privacy Constitution */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Kebijakan Privasi & Etika Pengawasan (Privacy Guidelines)
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Kamera Berizin Eksplisit:</strong> Kamera hanya aktif ketika siswa menekan tombol kamera pada soal essay/foto. Tidak ada background recording atau hidden camera.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Pemisahan Event Kamera:</strong> Tindakan membuka kamera (CAMERA_OPEN) tidak dihitung sebagai pelanggaran keluar fokus kuis (QUIZ_EXIT).
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Guru Sebagai Otoritas Nilai:</strong> AI hanya memberikan asistensi rekomendasi nilai dan feedback; guru manusia tetap memegang keputusan akhir.
            </span>
          </div>
        </div>
      </div>

      {/* Database Management & Reset */}
      <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-600" />
            Reset Basis Data Demo Sekolah
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-1 max-w-lg">
            Mengembalikan seluruh data akun pengguna, materi, tugas, kuis demo, dan riwayat aktivitas pengerjaan ke kondisi awal bawaan aplikasi.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-rose-600/20 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Data Sekarang
        </button>
      </div>
    </div>
  );
};
