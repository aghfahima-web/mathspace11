import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Camera,
  Edit3,
  X,
  Search,
  Check,
  RefreshCw,
  User,
  ExternalLink,
} from 'lucide-react';
import { User as UserType, QuizAttempt, Quiz, QuizQuestion, QuizAnswer } from '../types';
import { store } from '../services/store';
import { requestAICorrection, AICorrectionResponse } from '../services/aiService';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface GradesPageProps {
  currentUser: UserType;
  onNavigate: (page: string) => void;
}

export const GradesPage: React.FC<GradesPageProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'assignments'>('quizzes');
  const [selectedAttemptForGrading, setSelectedAttemptForGrading] = useState<QuizAttempt | null>(
    null
  );
  const [activeGradingQuestionId, setActiveGradingQuestionId] = useState<string | null>(null);

  // AI Evaluation state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AICorrectionResponse | null>(null);

  // Teacher manual override form
  const [manualScore, setManualScore] = useState<number>(0);
  const [manualFeedback, setManualFeedback] = useState<string>('');

  const quizzes = store.getQuizzes();
  const allAttempts = store.getAttempts();
  const assignments = store.getAssignments();
  const allSubmissions = store.getSubmissions();

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  // Filter for student vs teacher
  const displayedAttempts = isTeacherOrAdmin
    ? allAttempts
    : allAttempts.filter((a) => a.studentId === currentUser.id);

  const displayedSubmissions = isTeacherOrAdmin
    ? allSubmissions
    : allSubmissions.filter((s) => s.studentId === currentUser.id);

  // Helper to open grading modal for teacher
  const handleOpenGrading = (attempt: QuizAttempt, questionId?: string) => {
    setSelectedAttemptForGrading(attempt);
    const quiz = store.getQuizById(attempt.quizId);
    const firstGradableQ =
      questionId ||
      quiz?.questions.find(
        (q) => q.type === 'ESSAY' || q.type === 'PHOTO' || q.type === 'TEXT_AND_PHOTO'
      )?.id ||
      quiz?.questions[0]?.id;

    setActiveGradingQuestionId(firstGradableQ || null);
    setAiResult(null);

    const existingAns = attempt.answers[firstGradableQ || ''];
    setManualScore(existingAns?.finalScore || 0);
    setManualFeedback(existingAns?.teacherFeedback || '');
  };

  // Trigger Gemini AI Correction
  const handleTriggerAiCorrection = async () => {
    if (!selectedAttemptForGrading || !activeGradingQuestionId) return;
    const quiz = store.getQuizById(selectedAttemptForGrading.quizId);
    const question = quiz?.questions.find((q) => q.id === activeGradingQuestionId);
    const ans = selectedAttemptForGrading.answers[activeGradingQuestionId];
    if (!question) return;

    setIsAiLoading(true);
    setAiResult(null);

    try {
      const response = await requestAICorrection({
        questionText: question.question,
        questionType: question.type,
        maxScore: question.maxScore,
        studentAnswer: ans?.textAnswer || '',
        rubric: question.rubric,
        imageBase64: ans?.photoUrl,
      });

      setAiResult(response);
      // Pre-fill teacher fields with AI suggestions
      setManualScore(response.suggestedScore);
      setManualFeedback(response.suggestedFeedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Teacher commits final score (Teacher has final authority)
  const handleSaveTeacherGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttemptForGrading || !activeGradingQuestionId) return;

    store.updateTeacherQuizGrading(
      selectedAttemptForGrading.id,
      activeGradingQuestionId,
      manualScore,
      manualFeedback,
      !!aiResult,
      aiResult
        ? {
            suggestedScore: aiResult.suggestedScore,
            suggestedFeedback: aiResult.suggestedFeedback,
            reasoning: aiResult.reasoningSummary,
          }
        : undefined
    );

    // Refresh selected attempt from store
    const updated = store
      .getAttempts()
      .find((a) => a.id === selectedAttemptForGrading.id);
    setSelectedAttemptForGrading(updated || null);
    setAiResult(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Nilai, Rekap Hasil & Koreksi AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isTeacherOrAdmin
              ? 'Evaluasi lembar jawaban essay & foto coretan rumus dengan rekomendasi cerdas AI, guru sebagai penentu nilai akhir.'
              : 'Daftar perolehan nilai, umpan balik dari pengajar, dan status kelulusan standar KKM.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'quizzes'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Nilai Quiz & Ujian
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'assignments'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Nilai Tugas Siswa
          </button>
        </div>
      </div>

      {/* QUIZ GRADES TAB */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Rekap Hasil Ujian ({displayedAttempts.length} Data)
              </h3>
            </div>

            {displayedAttempts.length === 0 ? (
              <EmptyState
                icon={Award}
                title="Belum Ada Nilai Quiz"
                description="Belum ada ujian atau kuis yang selesai dikerjakan."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Nama Siswa</th>
                      <th className="px-4 py-3.5">Quiz / Mata Pelajaran</th>
                      <th className="px-4 py-3.5 text-center">Status Pengerjaan</th>
                      <th className="px-4 py-3.5 text-center">Nilai Akhir</th>
                      <th className="px-4 py-3.5 text-center">Kelulusan KKM</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedAttempts.map((att) => {
                      const quiz = quizzes.find((q) => q.id === att.quizId);
                      const isGraded = att.isGraded;

                      return (
                        <tr
                          key={att.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={att.studentAvatar}
                                alt={att.studentName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                              />
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {att.studentName}
                                </span>
                                <span className="text-[10px] text-slate-400">{att.className}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {quiz?.title || 'Quiz Akademik'}
                            </div>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                              {quiz?.subjectName}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <Badge
                              variant={
                                att.status === 'SUBMITTED'
                                  ? 'success'
                                  : att.status === 'QUIZ_TIMEOUT'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {att.status === 'QUIZ_TIMEOUT' ? 'Waktu Habis' : 'Selesai Dikumpul'}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                              {att.totalScore || 0}
                              <span className="text-xs text-slate-400 font-normal">
                                /{att.maxPossibleScore || 100}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ({att.percentageScore || 0}%)
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <Badge variant={att.isPassed ? 'success' : 'danger'}>
                              {att.isPassed ? 'Lulus KKM' : 'Remedial'}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-right">
                            {isTeacherOrAdmin ? (
                              <button
                                onClick={() => handleOpenGrading(att)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                Koreksi (AI)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenGrading(att)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                              >
                                Lihat Rincian
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS GRADES TAB */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Rekap Penilaian Tugas ({displayedSubmissions.length} Data)
              </h3>
            </div>

            {displayedSubmissions.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Belum Ada Pengumpulan Tugas"
                description="Belum ada riwayat pengumpulan tugas yang tercatat."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Nama Siswa</th>
                      <th className="px-4 py-3.5">Waktu Kumpul</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Nilai (0 - 100)</th>
                      <th className="px-6 py-3.5">Catatan Umpan Balik Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={sub.studentAvatar}
                              alt={sub.studentName}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                {sub.studentName}
                              </span>
                              <span className="text-[10px] text-slate-400">{sub.className}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <Badge variant={sub.status === 'DINILAI' ? 'success' : 'warning'}>
                            {sub.status === 'DINILAI' ? 'Telah Dinilai' : 'Menunggu Koreksi'}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                            {sub.score !== undefined ? sub.score : '-'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 italic">
                          {sub.feedback ? `"${sub.feedback}"` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Assisted Evaluation & Teacher Grading Modal */}
      {selectedAttemptForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Evaluasi Lembar Jawaban Siswa & Asistensi Koreksi AI
                  </h3>
                  <p className="text-xs text-slate-400">
                    Siswa: {selectedAttemptForGrading.studentName} ({selectedAttemptForGrading.className})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttemptForGrading(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Question Selector & Split View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Tabs */}
              {(() => {
                const quiz = store.getQuizById(selectedAttemptForGrading.quizId);
                if (!quiz) return null;

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                    {quiz.questions.map((q, idx) => {
                      const isActive = activeGradingQuestionId === q.id;
                      const hasAns = !!selectedAttemptForGrading.answers[q.id];

                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            setActiveGradingQuestionId(q.id);
                            setAiResult(null);
                            const ans = selectedAttemptForGrading.answers[q.id];
                            setManualScore(ans?.finalScore || 0);
                            setManualFeedback(ans?.teacherFeedback || '');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <span>Soal {idx + 1}</span>
                          <span className="text-[10px] opacity-75 capitalize">({q.type})</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Active Question & Student Answer Review */}
              {(() => {
                const quiz = store.getQuizById(selectedAttemptForGrading.quizId);
                const question = quiz?.questions.find((q) => q.id === activeGradingQuestionId);
                const studentAns = activeGradingQuestionId
                  ? selectedAttemptForGrading.answers[activeGradingQuestionId]
                  : undefined;

                if (!question) return null;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Question & Student Submission */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Pertanyaan Ujian: (Bobot Maks: {question.maxScore} Poin)
                        </span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {question.question}
                        </p>
                        {question.rubric && (
                          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 italic">
                            Rubrik: {question.rubric}
                          </div>
                        )}
                      </div>

                      {/* Student's answer content */}
                      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-2">
                          Jawaban Siswa:
                        </span>

                        {studentAns?.textAnswer && (
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed mb-3">
                            {studentAns.textAnswer}
                          </div>
                        )}

                        {studentAns?.photoUrl && (
                          <div>
                            <span className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-indigo-600" />
                              Foto Lembar Jawaban Siswa Terlampir:
                            </span>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video flex items-center justify-center">
                              <img
                                src={studentAns.photoUrl}
                                alt="Foto jawaban tulisan tangan"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>
                        )}

                        {!studentAns?.textAnswer && !studentAns?.photoUrl && (
                          <p className="text-slate-400 italic">Siswa tidak mengisi jawaban pada butir ini.</p>
                        )}
                      </div>
                    </div>

                    {/* Right: AI Assistance & Teacher Override Panel */}
                    <div className="space-y-4">
                      {isTeacherOrAdmin && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              Asisten Koreksi AI Gemini
                            </span>

                            <button
                              disabled={isAiLoading}
                              onClick={handleTriggerAiCorrection}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isAiLoading ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Menganalisis...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Analisis Jawaban Ini
                                </>
                              )}
                            </button>
                          </div>

                          <p className="text-[11px] text-purple-800/80 dark:text-purple-300 leading-relaxed">
                            AI membaca tulisan, rumus, dan konsistensi argumen terhadap rubrik, lalu memberikan rekomendasi nilai & saran feedback.
                          </p>

                          {/* AI Recommendation Output */}
                          {aiResult && (
                            <div className="mt-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2 text-xs animate-fade-in">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  Rekomendasi Skor:
                                </span>
                                <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                                  {aiResult.suggestedScore} / {question.maxScore}
                                </span>
                              </div>

                              <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 block text-[11px]">
                                  Pertimbangan AI:
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                  {aiResult.reasoningSummary}
                                </p>
                              </div>

                              <div>
                                <span className="font-bold text-slate-600 dark:text-slate-400 block text-[11px]">
                                  Saran Feedback:
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] italic">
                                  "{aiResult.suggestedFeedback}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Teacher Final Override Form (Guru is final decider) */}
                      {isTeacherOrAdmin ? (
                        <form
                          onSubmit={handleSaveTeacherGrading}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              Keputusan Nilai Final Guru
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold">
                              (Kendali Penuh Guru)
                            </span>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Nilai Poin (Maks {question.maxScore})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={question.maxScore}
                              value={manualScore}
                              onChange={(e) => setManualScore(Number(e.target.value))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-base"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Catatan Umpan Balik untuk Siswa
                            </label>
                            <textarea
                              rows={3}
                              value={manualFeedback}
                              onChange={(e) => setManualFeedback(e.target.value)}
                              placeholder="Ketikkan umpan balik mendidik untuk siswa..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Simpan Nilai & Publikasikan Hasil
                          </button>
                        </form>
                      ) : (
                        /* Student View of this Question */
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              Evaluasi Pengajar:
                            </span>
                            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                              {studentAns?.finalScore || 0} / {question.maxScore} Poin
                            </span>
                          </div>

                          {studentAns?.teacherFeedback && (
                            <div>
                              <span className="font-bold text-slate-500 block text-[11px] mb-1">
                                Feedback Guru:
                              </span>
                              <p className="text-slate-700 dark:text-slate-200 italic p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                "{studentAns.teacherFeedback}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedAttemptForGrading(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
