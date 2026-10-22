import React, { useState } from 'react';
import {
  Eye,
  Clock,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Calendar,
  X,
  Search,
  WifiOff,
  User,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { store } from '../services/store';
import { QuizActivityLog, QuizAttempt, QuizMonitorThreshold } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface QuizMonitoringPageProps {
  initialQuizId?: string;
  initialStudentId?: string;
}

export const QuizMonitoringPage: React.FC<QuizMonitoringPageProps> = ({
  initialQuizId,
  initialStudentId,
}) => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>(initialQuizId || 'quiz-demo-1');
  const [selectedStudentForTimeline, setSelectedStudentForTimeline] = useState<string | null>(
    initialStudentId || null
  );
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  // Thresholds state
  const [thresholds, setThresholds] = useState<QuizMonitorThreshold>(store.getThresholds());

  const quizzes = store.getQuizzes();
  const attempts = store.getAttempts(selectedQuizId);
  const allLogs = store.getActivityLogs(selectedQuizId);

  // Compute metrics per student
  const studentMetrics = attempts.map((att) => {
    const studentLogs = allLogs.filter((l) => l.studentId === att.studentId);

    const exitLogs = studentLogs.filter((l) => l.eventType === 'QUIZ_EXIT');
    const returnLogs = studentLogs.filter((l) => l.eventType === 'QUIZ_RETURN');
    const cameraLogs = studentLogs.filter(
      (l) =>
        l.eventType === 'CAMERA_OPEN' ||
        l.eventType === 'CAMERA_CAPTURE' ||
        l.eventType === 'CAMERA_CONFIRM'
    );
    const connectionLogs = studentLogs.filter(
      (l) => l.eventType === 'CONNECTION_LOST' || l.eventType === 'CONNECTION_RESTORED'
    );

    const totalExitCount = exitLogs.length;
    const totalReturnCount = returnLogs.length;

    let totalExitDuration = 0;
    let longestExitDuration = 0;

    returnLogs.forEach((l) => {
      const dur = l.durationSeconds || 0;
      totalExitDuration += dur;
      if (dur > longestExitDuration) longestExitDuration = dur;
    });

    // Determine status objectively based on configurable thresholds
    let status: 'Normal' | 'Perlu Diperhatikan' | 'Risiko Tinggi' = 'Normal';
    if (
      totalExitCount >= thresholds.maxExits * 2 ||
      totalExitDuration >= thresholds.maxTotalExitSeconds * 2 ||
      longestExitDuration >= thresholds.maxSingleExitSeconds * 2
    ) {
      status = 'Risiko Tinggi';
    } else if (
      totalExitCount >= thresholds.maxExits ||
      totalExitDuration >= thresholds.maxTotalExitSeconds ||
      longestExitDuration >= thresholds.maxSingleExitSeconds
    ) {
      status = 'Perlu Diperhatikan';
    }

    return {
      attempt: att,
      totalExitCount,
      totalReturnCount,
      totalExitDuration,
      longestExitDuration,
      cameraActivityCount: cameraLogs.length,
      connectionEventsCount: connectionLogs.length,
      status,
      logs: studentLogs,
    };
  });

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveThresholds(thresholds);
    setIsThresholdModalOpen(false);
  };

  const selectedStudentData = studentMetrics.find(
    (m) => m.attempt.studentId === selectedStudentForTimeline
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Monitoring Aktivitas & Integritas Quiz
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pantau pola fokus kuis, aktivitas kamera, dan perubahan halaman secara objektif dan non-judgmental.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsThresholdModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            Atur Ambang Batas (Threshold)
          </button>
        </div>
      </div>

      {/* Quiz Selector & Ethical Principles Notice */}
      <div className="p-4 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              Prinsip Monitoring Etis & Realistis
            </h4>
            <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300 leading-relaxed max-w-2xl">
              Perubahan fokus dapat diakibatkan oleh notifikasi perangkat, koneksi terputus, atau pembukaan jendela kamera. Sistem tidak mengklaim otomatis sebagai kecurangan; Guru manusia memegang pertimbangan evaluasi akhir.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full md:w-auto px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-950 dark:text-indigo-200 focus:outline-hidden"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} ({q.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Daftar Peserta & Analisis Aktivitas ({studentMetrics.length} Siswa)
          </h3>
          <span className="text-xs text-slate-400">
            Threshold: Exit &gt; {thresholds.maxExits}x | Total &gt; {thresholds.maxTotalExitSeconds}s
          </span>
        </div>

        {studentMetrics.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Belum Ada Aktivitas Quiz"
            description="Belum ada siswa yang memulai pengerjaan untuk kuis ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Siswa</th>
                  <th className="px-4 py-3.5">Waktu Mulai / Selesai</th>
                  <th className="px-4 py-3.5 text-center">Keluar / Kembali</th>
                  <th className="px-4 py-3.5 text-center">Durasi Keluar</th>
                  <th className="px-4 py-3.5 text-center">Aktivitas Kamera</th>
                  <th className="px-4 py-3.5 text-center">Status Aktivitas</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studentMetrics.map((item) => {
                  const { attempt, totalExitCount, totalReturnCount, totalExitDuration, longestExitDuration, cameraActivityCount, status } = item;

                  return (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={attempt.studentAvatar}
                            alt={attempt.studentName}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {attempt.studentName}
                            </span>
                            <span className="text-[10px] text-slate-400">{attempt.className}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        <div className="font-mono text-[11px]">
                          {new Date(attempt.startedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' → '}
                          {attempt.submittedAt
                            ? new Date(attempt.submittedAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Sedang Mengerjakan'}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`font-bold font-mono px-2 py-0.5 rounded-lg ${
                            totalExitCount > 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {totalExitCount}x Keluar / {totalReturnCount}x Kembali
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          Total: <span className="font-bold">{totalExitDuration} detik</span>
                          {longestExitDuration > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              Terlama: {longestExitDuration}s
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{cameraActivityCount} Log Kamera</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant={
                            status === 'Normal'
                              ? 'success'
                              : status === 'Perlu Diperhatikan'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedStudentForTimeline(attempt.studentId)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
                        >
                          Buka Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Timeline Modal */}
      {selectedStudentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentData.attempt.studentAvatar}
                  alt={selectedStudentData.attempt.studentName}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Activity Timeline: {selectedStudentData.attempt.studentName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedStudentData.attempt.className} • Status: {selectedStudentData.status}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForTimeline(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Events List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {selectedStudentData.logs.map((log) => {
                  const timeStr = new Date(log.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  // Event-specific badge icon & color
                  let iconBg = 'bg-slate-200 text-slate-700';
                  let eventLabel: string = log.eventType;
                  let description = '';

                  if (log.eventType === 'QUIZ_START') {
                    iconBg = 'bg-indigo-600 text-white';
                    eventLabel = 'Quiz Dimulai';
                    description = 'Siswa membuka lembar ujian dan timer mulai berjalan.';
                  } else if (log.eventType === 'QUIZ_EXIT') {
                    iconBg = 'bg-amber-500 text-white';
                    eventLabel = 'Perubahan Fokus Halaman (Quiz Exit)';
                    description =
                      log.metadata?.reason ||
                      'Jendela browser kehilangan fokus atau berganti tab.';
                  } else if (log.eventType === 'QUIZ_RETURN') {
                    iconBg = 'bg-emerald-500 text-white';
                    eventLabel = 'Kembali ke Lembar Kuis (Quiz Return)';
                    description = `Siswa kembali fokus ke soal setelah ${
                      log.durationSeconds || 0
                    } detik di luar tab.`;
                  } else if (log.eventType === 'CAMERA_OPEN') {
                    iconBg = 'bg-blue-600 text-white';
                    eventLabel = 'Kamera Jawaban Dibuka';
                    description =
                      'Siswa secara sadar membuka jendela kamera untuk foto rumus tulisan tangan.';
                  } else if (log.eventType === 'CAMERA_CAPTURE') {
                    iconBg = 'bg-blue-500 text-white';
                    eventLabel = 'Foto Jawaban Diambil (Capture)';
                    description = 'Pengambilan frame foto lembar kertas pengerjaan.';
                  } else if (log.eventType === 'CAMERA_CONFIRM') {
                    iconBg = 'bg-teal-600 text-white';
                    eventLabel = 'Foto Dikonfirmasi & Disimpan';
                    description = 'Foto terpasang sebagai lampiran jawaban soal.';
                  } else if (log.eventType === 'QUESTION_ANSWER') {
                    iconBg = 'bg-slate-600 text-white';
                    eventLabel = 'Jawaban Diperbarui';
                    description = `Menyimpan jawaban butir soal ${
                      log.metadata?.questionId || ''
                    }.`;
                  } else if (log.eventType === 'QUIZ_SUBMIT') {
                    iconBg = 'bg-emerald-600 text-white';
                    eventLabel = 'Quiz Berhasil Dikumpulkan';
                    description = `Selesai dikumpulkan secara permanen. Nilai objektif: ${
                      log.metadata?.totalScore || 0
                    }`;
                  } else if (log.eventType === 'QUIZ_TIMEOUT') {
                    iconBg = 'bg-rose-600 text-white';
                    eventLabel = 'Waktu Quiz Habis (Timeout)';
                    description = 'Sistem otomatis mengunci dan menyimpan seluruh jawaban.';
                  }

                  return (
                    <div key={log.id} className="relative group text-xs">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${iconBg} shadow-xs`}
                      />

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {eventLabel}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">{timeStr}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">
                          {description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedStudentForTimeline(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
              >
                Tutup Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Config Modal */}
      {isThresholdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Atur Ambang Batas (Threshold) Monitoring
              </h3>
              <button
                onClick={() => setIsThresholdModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maksimal Jumlah Keluar Halaman (Exit Count)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={thresholds.maxExits}
                  onChange={(e) =>
                    setThresholds({ ...thresholds, maxExits: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Jika keluar melebihi angka ini, status berubah menjadi "Perlu Diperhatikan".
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maksimal Total Durasi Keluar (Detik)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1200"
                  required
                  value={thresholds.maxTotalExitSeconds}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      maxTotalExitSeconds: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Contoh: 120 detik (2 menit kumulatif di luar tab kuis).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Maksimal Durasi Satu Kali Keluar Terlama (Detik)
                </label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  required
                  value={thresholds.maxSingleExitSeconds}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      maxSingleExitSeconds: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsThresholdModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Simpan Aturan Threshold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
