import React from 'react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Megaphone,
  UserCheck,
  Plus,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const materials = store.getMaterials();
  const assignments = store.getAssignments();
  const quizzes = store.getQuizzes();
  const announcements = store.getAnnouncements();
  const attempts = store.getAttempts();
  const users = store.getUsers();
  const classes = store.getClasses();

  // --- SISWA DASHBOARD ---
  if (currentUser.role === 'siswa') {
    const studentAttempts = attempts.filter((a) => a.studentId === currentUser.id);
    const submissions = store.getSubmissions().filter((s) => s.studentId === currentUser.id);

    // Calculate learning metrics
    const completedAssignments = submissions.length;
    const completedQuizzes = studentAttempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'QUIZ_TIMEOUT'
    ).length;

    const gradesWithScore = studentAttempts
      .filter((a) => a.percentageScore !== undefined)
      .map((a) => a.percentageScore as number);
    const avgScore =
      gradesWithScore.length > 0
        ? Math.round(gradesWithScore.reduce((a, b) => a + b, 0) / gradesWithScore.length)
        : 88;

    const attendanceSessions = store.getAttendanceSessions();
    let totalAttended = 0;
    let totalSessions = 0;
    attendanceSessions.forEach((s) => {
      const rec = s.records.find((r) => r.studentId === currentUser.id);
      if (rec) {
        totalSessions++;
        if (rec.status === 'HADIR') totalAttended++;
      }
    });
    const attendancePercent =
      totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 100;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
              />
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Siswa Aktif • {currentUser.className || 'XII IPA 1'}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Halo, {currentUser.name}! 👋
                </h1>
                <p className="text-sm text-indigo-100 mt-1 max-w-xl">
                  Selamat datang kembali di E-Learning School. Siap melanjutkan pembelajaran dan latihan soal hari ini?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('quiz')}
                className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition shadow-md flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Mulai Quiz Sekarang
              </button>
            </div>
          </div>

          {/* Background decorative glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Materi Tersedia</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{materials.length}</h3>
              <span className="text-[11px] text-emerald-600 font-medium">3 Bab Aktif</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tugas Selesai</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {completedAssignments}/{assignments.length}
              </h3>
              <span className="text-[11px] text-indigo-600 font-medium">1 Perlu Dikumpul</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rata-rata Nilai</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{avgScore}</h3>
              <span className="text-[11px] text-emerald-600 font-medium">Predikat Amat Baik</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kehadiran Siswa</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{attendancePercent}%</h3>
              <span className="text-[11px] text-purple-600 font-medium">Sangat Disiplin</span>
            </div>
          </div>
        </div>

        {/* Two Columns: Upcoming Assignments & Quizzes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tugas Mendatang Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Tugas Mendatang
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Perhatikan tenggat waktu pengumpulan</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('assignments')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {assignments.map((asg) => {
                  const sub = submissions.find((s) => s.assignmentId === asg.id);
                  const isSubmitted = !!sub;

                  return (
                    <div
                      key={asg.id}
                      onClick={() => onNavigate('assignments')}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 hover:border-indigo-200 dark:hover:border-indigo-800 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {asg.subjectName}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(asg.deadline).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {asg.title}
                        </h4>
                      </div>

                      <Badge variant={isSubmitted ? 'success' : 'warning'}>
                        {isSubmitted ? 'Sudah Dikumpulkan' : 'Belum Dikerjakan'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quiz Mendatang Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Quiz & Penilaian Aktif
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Dilengkapi fitur foto kamera dan autosave</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('quiz')}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  Semua Quiz <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {quizzes.map((quiz) => {
                  const studentAtt = studentAttempts.find((a) => a.quizId === quiz.id);
                  const isSubmitted =
                    studentAtt?.status === 'SUBMITTED' || studentAtt?.status === 'QUIZ_TIMEOUT';
                  const isInProgress = studentAtt?.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={quiz.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-800/50 dark:to-indigo-950/20 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            {quiz.subjectName}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Durasi {quiz.durationMinutes} Menit • {quiz.questions.length} Soal
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {quiz.title}
                        </h4>
                      </div>

                      <div>
                        {isSubmitted ? (
                          <div className="text-right">
                            <Badge variant="success">Selesai</Badge>
                            <div className="text-xs font-bold text-emerald-600 mt-1">
                              Nilai: {studentAtt.percentageScore}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => onNavigate('quiz-runner', { quizId: quiz.id })}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                          >
                            {isInProgress ? 'Lanjutkan' : 'Kerjakan'}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Belajar & Pengumuman */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Progress */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Progress Belajar Tiap Mata Pelajaran
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Matematika Peminatan (Kalkulus Integral)</span>
                  <span className="text-indigo-600">85% Selesai</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[85%] transition-all" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Fisika Terapan (Termodinamika)</span>
                  <span className="text-amber-600">72% Selesai</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full w-[72%] transition-all" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Biologi Sel & Genetika</span>
                  <span className="text-emerald-600">90% Selesai</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full w-[90%] transition-all" />
                </div>
              </div>
            </div>
          </div>

          {/* Pengumuman Widget */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  Pengumuman
                </h3>
                <button
                  onClick={() => onNavigate('announcements')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Semua
                </button>
              </div>

              <div className="space-y-3">
                {announcements.slice(0, 2).map((a) => (
                  <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge variant={a.priority === 'URGENT' ? 'danger' : 'warning'} size="sm">
                        {a.priority}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {a.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- GURU DASHBOARD ---
  if (currentUser.role === 'guru') {
    const submissions = store.getSubmissions();
    const ungradedAssignments = submissions.filter((s) => s.status === 'SUDAH_DIKUMPULKAN');
    const logs = store.getActivityLogs();
    const focusExitLogs = logs.filter((l) => l.eventType === 'QUIZ_EXIT');

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Guru Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Pendidik Profesional • NIP: {currentUser.nip || '-'}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Selamat Bertugas, {currentUser.name}!
              </h1>
              <p className="text-sm text-indigo-100 mt-1 max-w-xl">
                Kelola materi pengajaran, pantau aktivitas pengerjaan kuis real-time, dan manfaatkan asisten AI untuk rekomendasi koreksi jawaban siswa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('quiz-monitoring')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs transition shadow-md flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-slate-900" />
              Monitoring Aktivitas Quiz
            </button>
            <button
              onClick={() => onNavigate('grades')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-indigo-50 transition shadow-md flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-indigo-600" />
              Koreksi Jawaban (AI)
            </button>
          </div>
        </div>

        {/* Guru Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Materi Saya</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{materials.length}</h3>
              <span className="text-[11px] text-indigo-600 font-medium">Semua Terbit</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Perlu Dinilai</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {ungradedAssignments.length}
              </h3>
              <span className="text-[11px] text-amber-600 font-medium">Tugas Siswa Masuk</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Kuis Aktif</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{quizzes.length}</h3>
              <span className="text-[11px] text-purple-600 font-medium">7 Model Soal</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Perubahan Fokus Kuis</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {focusExitLogs.length}
              </h3>
              <span className="text-[11px] text-rose-600 font-medium">Perlu Diperhatikan</span>
            </div>
          </div>
        </div>

        {/* Action Panel & Quick Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Ringkasan Pengerjaan Siswa Terkini
              </h3>
              <button
                onClick={() => onNavigate('quiz-monitoring')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
              >
                Buka Live Monitoring <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={att.studentAvatar}
                      alt={att.studentName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {att.studentName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {att.className} • Mulai: {new Date(att.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        att.status === 'SUBMITTED'
                          ? 'success'
                          : att.status === 'IN_PROGRESS'
                          ? 'primary'
                          : 'warning'
                      }
                    >
                      {att.status}
                    </Badge>
                    <button
                      onClick={() => onNavigate('quiz-monitoring', { studentId: att.studentId })}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-xs"
                    >
                      Lihat Timeline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Create Shortuts */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Aksi Cepat Guru
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Kelola aktivitas pembelajaran dengan 1-klik.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => onNavigate('materials', { openCreate: true })}
                  className="w-full p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-between hover:bg-indigo-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Buat Materi Pembelajaran Baru
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('assignments', { openCreate: true })}
                  className="w-full p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-between hover:bg-blue-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Buat Tugas Kelas Baru
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('quiz', { openCreate: true })}
                  className="w-full p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-between hover:bg-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    Buat Kuis & Bank Soal Baru
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('attendance')}
                  className="w-full p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-between hover:bg-emerald-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Buka Sesi Absensi Pertemuan
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  const totalStudents = users.filter((u) => u.role === 'siswa').length;
  const totalTeachers = users.filter((u) => u.role === 'guru').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold backdrop-blur-md mb-2">
            Administrator Sistem • Hak Akses Penuh
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Pusat Kendali E-Learning School
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Pantau seluruh data sekolah, kelola akun siswa & guru, konfigurasi ambang batas monitoring kuis, dan kelola kalender akademik.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-users')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Kelola Pengguna
          </button>
          <button
            onClick={() => onNavigate('admin-settings')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
          >
            Pengaturan Threshold
          </button>
        </div>
      </div>

      {/* Admin Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Siswa</p>
          <h3 className="text-2xl font-black text-indigo-600 mt-1">{totalStudents}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Guru</p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">{totalTeachers}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Kelas</p>
          <h3 className="text-2xl font-black text-purple-600 mt-1">{classes.length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Materi</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{materials.length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Tugas</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{assignments.length}</h3>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <p className="text-xs text-slate-400 font-medium">Total Quiz</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{quizzes.length}</h3>
        </div>
      </div>

      {/* Admin Shortcuts & System Logs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Manajemen Akademik Cepat
          </h3>
          <div className="space-y-3">
            <div
              onClick={() => onNavigate('admin-users')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Data Siswa & Guru
                </h4>
                <p className="text-xs text-slate-400">
                  Tambah akun baru, reset password, nonaktifkan, atau assign kelas.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => onNavigate('admin-classes')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Kelas, Tahun Ajaran & Wali Kelas
                </h4>
                <p className="text-xs text-slate-400">
                  Konfigurasi tahun ajaran 2026/2027 dan pembagian rombel.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => onNavigate('announcements')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Siaran Pengumuman Sekolah
                </h4>
                <p className="text-xs text-slate-400">
                  Kirim pengumuman resmi berkategori Urgent atau Normal ke seluruh siswa.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Log Aktivitas Sistem Terkini
              </h3>
              <button
                onClick={() => onNavigate('quiz-monitoring')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Selengkapnya
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {store.getActivityLogs().slice(-5).reverse().map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.studentName}</span>
                    <span className="text-slate-400"> • </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{log.eventType}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
