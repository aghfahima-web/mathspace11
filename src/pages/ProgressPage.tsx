import React from 'react';
import { TrendingUp, BookOpen, FileText, HelpCircle, CheckCircle2, Award, Calendar } from 'lucide-react';
import { User } from '../types';
import { store } from '../services/store';

interface ProgressPageProps {
  currentUser: User;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ currentUser }) => {
  const materials = store.getMaterials();
  const assignments = store.getAssignments();
  const quizzes = store.getQuizzes();
  const subjects = store.getSubjects();
  const studentAttempts = store.getAttempts().filter((a) => a.studentId === currentUser.id);
  const submissions = store.getSubmissions().filter((s) => s.studentId === currentUser.id);
  const attendanceSessions = store.getAttendanceSessions();

  // Progress metrics
  const completedAssignments = submissions.length;
  const completedQuizzes = studentAttempts.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'QUIZ_TIMEOUT'
  ).length;

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

  const grades = studentAttempts
    .filter((a) => a.percentageScore !== undefined)
    .map((a) => a.percentageScore as number);
  const avgGrade =
    grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 88;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Perkembangan Belajar & Statistik Akademik
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Visualisasi pencapaian materi, penyelesaian penugasan, dan penguasaan per mata pelajaran.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Materi Diselesaikan</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">2 / 3 Bab</h3>
          <span className="text-[11px] text-blue-600 font-semibold">67% Selesai</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Tugas Terkumpul</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {completedAssignments} / {assignments.length}
          </h3>
          <span className="text-[11px] text-amber-600 font-semibold">
            {Math.round((completedAssignments / (assignments.length || 1)) * 100)}% Rasio
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Quiz Selesai</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {completedQuizzes} / {quizzes.length}
          </h3>
          <span className="text-[11px] text-purple-600 font-semibold">Aktif</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Tingkat Kehadiran</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {attendancePercent}%
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold">Presensi Baik</span>
        </div>
      </div>

      {/* Detailed Mastery by Subject */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Tingkat Penguasaan Kompetensi Mata Pelajaran
        </h3>

        <div className="space-y-5">
          {subjects.map((s, idx) => {
            const mastery = [85, 78, 92, 80][idx % 4];

            return (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className="text-slate-400">({s.code})</span>
                  </div>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {mastery}%
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-500`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
