import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { User, Quiz, QuizQuestion } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface QuizListPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
  initialOpenCreate?: boolean;
}

export const QuizListPage: React.FC<QuizListPageProps> = ({
  currentUser,
  onNavigate,
  initialOpenCreate = false,
}) => {
  const [isConfirmStartOpen, setIsConfirmStartOpen] = useState(false);
  const [selectedQuizToStart, setSelectedQuizToStart] = useState<Quiz | null>(null);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(initialOpenCreate);

  // Form states for creating a quiz
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('subj-math');
  const [newQuizClass, setNewQuizClass] = useState('XII IPA 1');
  const [newQuizDuration, setNewQuizDuration] = useState(30);
  const [newQuizPassing, setNewQuizPassing] = useState(75);
  const [newRandomQuestions, setNewRandomQuestions] = useState(true);
  const [newRandomOptions, setNewRandomOptions] = useState(true);

  const quizzes = store.getQuizzes();
  const subjects = store.getSubjects();
  const classes = store.getClasses();
  const attempts = store.getAttempts();

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  const handlePromptStart = (quiz: Quiz) => {
    setSelectedQuizToStart(quiz);
    setIsConfirmStartOpen(true);
  };

  const handleConfirmStart = () => {
    if (!selectedQuizToStart) return;
    setIsConfirmStartOpen(false);
    onNavigate('quiz-runner', { quizId: selectedQuizToStart.id });
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === newQuizSubject);

    // Default template questions
    const sampleQuestions: QuizQuestion[] = [
      {
        id: `q-demo-${Date.now()}-1`,
        quizId: `quiz-${Date.now()}`,
        type: 'SINGLE_CHOICE',
        question: 'Pilihlah definisi yang paling tepat mengenai materi bab ini:',
        options: [
          { id: 'opt-a', text: 'Konsep dasar terpadu' },
          { id: 'opt-b', text: 'Operasi turunan pertama' },
          { id: 'opt-c', text: 'Teorema kesetimbangan energi' },
        ],
        correctAnswer: 'opt-a',
        maxScore: 30,
      },
      {
        id: `q-demo-${Date.now()}-2`,
        quizId: `quiz-${Date.now()}`,
        type: 'ESSAY',
        question: 'Jelaskan tahapan penalaran logis serta kesimpulan yang diperoleh dari studi kasus tersebut:',
        maxScore: 40,
        rubric: 'Kelengkapan penjelasan konsep dan ketepatan argumen.',
      },
      {
        id: `q-demo-${Date.now()}-3`,
        quizId: `quiz-${Date.now()}`,
        type: 'PHOTO',
        question: 'Tuliskan perhitungan rumus pada kertas dan foto hasil pekerjaan Anda:',
        maxScore: 30,
        rubric: 'Kejelasan rumus matematis pada foto.',
      },
    ];

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: newQuizTitle,
      description: newQuizDesc,
      subjectId: newQuizSubject,
      subjectName: subj?.name || 'Mata Pelajaran',
      className: newQuizClass,
      durationMinutes: newQuizDuration,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 86400000).toISOString(),
      passingGrade: newQuizPassing,
      randomQuestion: newRandomQuestions,
      randomOption: newRandomOptions,
      attemptLimit: 2,
      status: 'ACTIVE',
      questions: sampleQuestions,
      createdAt: new Date().toISOString(),
    };

    store.saveQuiz(newQuiz);
    setIsCreateQuizOpen(false);
  };

  const handleDeleteQuiz = (id: string) => {
    if (window.confirm('Hapus quiz ini beserta seluruh riwayatnya?')) {
      store.deleteQuiz(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Quiz & Ujian Akademik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dilengkapi timer server, autosave, input kamera untuk coretan rumus, dan deteksi fokus yang adil.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isTeacherOrAdmin && (
            <>
              <button
                onClick={() => onNavigate('quiz-monitoring')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
              >
                <Eye className="w-4 h-4" />
                Live Monitoring Aktivitas
              </button>
              <button
                onClick={() => setIsCreateQuizOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                Buat Quiz Baru
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quiz Cards Grid */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Belum Ada Quiz"
          description="Saat ini belum ada kuis atau evaluasi sumatif yang dijadwalkan."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const studentAttempt = attempts.find(
              (a) => a.quizId === quiz.id && a.studentId === currentUser.id
            );
            const isCompleted =
              studentAttempt?.status === 'SUBMITTED' ||
              studentAttempt?.status === 'QUIZ_TIMEOUT';
            const isInProgress = studentAttempt?.status === 'IN_PROGRESS';
            const allQuizAttempts = attempts.filter((a) => a.quizId === quiz.id);

            return (
              <div
                key={quiz.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                      {quiz.subjectName} • {quiz.className}
                    </span>

                    <Badge variant={quiz.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {quiz.status === 'ACTIVE' ? 'Aktif' : 'Terjadwal'}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Durasi</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        {quiz.durationMinutes} Menit
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Jumlah Soal</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {quiz.questions.length} Butir
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">KKM / Lulus</span>
                      <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
                        {quiz.passingGrade}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {currentUser.role === 'siswa' ? (
                    isCompleted ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                              Nilai Anda: {studentAttempt.percentageScore}/100
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {studentAttempt.isPassed ? 'Lulus KKM' : 'Belum Mencapai KKM'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onNavigate('grades')}
                          className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                          Lihat Ulasan
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-400 font-medium">
                          Kesempatan: 1/{quiz.attemptLimit}
                        </span>

                        <button
                          onClick={() => handlePromptStart(quiz)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
                        >
                          {isInProgress ? 'Lanjutkan Pengerjaan' : 'Mulai Quiz Sekarang'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  ) : (
                    /* Teacher / Admin Action */
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-500 font-medium">
                        {allQuizAttempts.length} Siswa Telah Mengerjakan
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                          title="Hapus Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('quiz-monitoring', { quizId: quiz.id })}
                          className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          Aktivitas & Hasil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Start Modal */}
      {isConfirmStartOpen && selectedQuizToStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Anda Akan Memulai Quiz
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {selectedQuizToStart.title}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi Pengerjaan:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedQuizToStart.durationMinutes} Menit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Soal:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedQuizToStart.questions.length} Butir Soal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nilai Kelulusan (KKM):</span>
                <span className="font-bold text-emerald-600">
                  {selectedQuizToStart.passingGrade}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fitur Tersedia:</span>
                <span className="font-semibold text-indigo-600">
                  Autosave & Camera Answer
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsConfirmStartOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20"
              >
                Mulai Kerjakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Create Quiz Modal */}
      {isCreateQuizOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Buat Quiz / Ujian Baru
              </h3>
              <button
                onClick={() => setIsCreateQuizOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Quiz <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="Contoh: Kuis Harian Termodinamika & Fisika Terapan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={newQuizSubject}
                    onChange={(e) => setNewQuizSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas Target
                  </label>
                  <select
                    value={newQuizClass}
                    onChange={(e) => setNewQuizClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newQuizDuration}
                    onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Grade (KKM %)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newQuizPassing}
                    onChange={(e) => setNewQuizPassing(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi & Instruksi
                </label>
                <textarea
                  rows={2}
                  value={newQuizDesc}
                  onChange={(e) => setNewQuizDesc(e.target.value)}
                  placeholder="Keterangan singkat materi yang diujikan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRandomQuestions}
                    onChange={(e) => setNewRandomQuestions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Acak Urutan Soal (Random Question)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRandomOptions}
                    onChange={(e) => setNewRandomOptions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Acak Urutan Pilihan Ganda (Random Options)
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateQuizOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Simpan & Buat Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
