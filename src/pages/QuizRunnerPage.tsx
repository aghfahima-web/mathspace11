import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Check,
  FileImage,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Quiz, QuizAttempt, QuizQuestion, QuizAnswer, QuizEventType } from '../types';
import { store } from '../services/store';
import { CameraAnswerModal } from '../components/quiz/CameraAnswerModal';
import { Badge } from '../components/common/Badge';

interface QuizRunnerPageProps {
  currentUser: User;
  quizId: string;
  onExit: () => void;
}

export const QuizRunnerPage: React.FC<QuizRunnerPageProps> = ({
  currentUser,
  quizId,
  onExit,
}) => {
  const quiz = store.getQuizById(quizId);

  // Initialize or resume attempt
  const [attempt, setAttempt] = useState<QuizAttempt | null>(() => {
    if (!quiz) return null;
    return store.startOrResumeQuizAttempt(quiz, currentUser);
  });

  const [currentIdx, setCurrentIdx] = useState<number>(attempt?.currentQuestionIndex || 0);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    attempt?.timeRemainingSeconds || (quiz ? quiz.durationMinutes * 60 : 1800)
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(
    attempt?.status === 'SUBMITTED' || attempt?.status === 'QUIZ_TIMEOUT'
  );
  const [focusWarning, setFocusWarning] = useState<string | null>(null);

  // References for monitoring
  const exitTimestampRef = useRef<number | null>(null);
  const isCameraActiveRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Current question according to attempt question order
  const currentQuestionId = attempt?.questionOrder?.[currentIdx] || quiz?.questions[currentIdx]?.id;
  const currentQuestion: QuizQuestion | undefined = quiz?.questions.find(
    (q) => q.id === currentQuestionId
  );

  const currentAnswer: QuizAnswer | undefined = currentQuestion
    ? attempt?.answers[currentQuestion.id]
    : undefined;

  // Log activity helper
  const logEvent = (eventType: QuizEventType, durationSeconds = 0, metadata: any = {}) => {
    if (!quiz) return;
    store.logQuizActivity(quiz.id, currentUser.id, currentUser.name, eventType, durationSeconds, metadata);
  };

  // --- TIMER COUNTDOWN ---
  useEffect(() => {
    if (isFinished || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOutSubmit();
          return 0;
        }
        const nextTime = prev - 1;
        // Autosave time remaining every 10 seconds
        if (nextTime % 10 === 0 && quiz && attempt) {
          store.updateAttemptProgress(quiz.id, currentUser.id, currentIdx, nextTime);
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, currentIdx, quiz, attempt]);

  // --- EXIT & RETURN DETECTION (NON-JUDGMENTAL) ---
  useEffect(() => {
    if (isFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only treat as exit if camera modal is not open
        if (!isCameraActiveRef.current && !isSubmittingRef.current) {
          exitTimestampRef.current = Date.now();
          logEvent('QUIZ_EXIT', 0, { reason: 'Perubahan visibilitas tab/jendela' });
        }
      } else {
        if (exitTimestampRef.current && !isCameraActiveRef.current) {
          const durationSec = Math.round((Date.now() - exitTimestampRef.current) / 1000);
          exitTimestampRef.current = null;
          logEvent('QUIZ_RETURN', durationSec, { reason: 'Kembali fokus pada halaman kuis' });
          setFocusWarning(
            `Perubahan fokus halaman terdeteksi (${durationSec} detik). Sistem mencatat aktivitas untuk pemantauan pengajar.`
          );
          setTimeout(() => setFocusWarning(null), 6000);
        }
      }
    };

    const handleWindowBlur = () => {
      if (!isCameraActiveRef.current && !isSubmittingRef.current && !exitTimestampRef.current) {
        exitTimestampRef.current = Date.now();
        logEvent('QUIZ_EXIT', 0, { reason: 'Jendela kehilangan fokus (blur)' });
      }
    };

    const handleWindowFocus = () => {
      if (exitTimestampRef.current && !isCameraActiveRef.current) {
        const durationSec = Math.round((Date.now() - exitTimestampRef.current) / 1000);
        exitTimestampRef.current = null;
        logEvent('QUIZ_RETURN', durationSec, { reason: 'Fokus jendela dipulihkan' });
      }
    };

    const handleOnline = () => {
      setSaveStatus('saved');
      logEvent('CONNECTION_RESTORED', 0);
    };

    const handleOffline = () => {
      setSaveStatus('offline');
      logEvent('CONNECTION_LOST', 0);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isFinished]);

  // Handle question answer update
  const handleAnswerChange = (partial: Partial<QuizAnswer>) => {
    if (!quiz || !currentQuestion || isFinished) return;
    setSaveStatus('saving');

    const updatedAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      textAnswer: partial.textAnswer !== undefined ? partial.textAnswer : currentAnswer?.textAnswer,
      selectedOptions:
        partial.selectedOptions !== undefined
          ? partial.selectedOptions
          : currentAnswer?.selectedOptions,
      photoUrl: partial.photoUrl !== undefined ? partial.photoUrl : currentAnswer?.photoUrl,
      photoCapturedAt:
        partial.photoCapturedAt !== undefined
          ? partial.photoCapturedAt
          : currentAnswer?.photoCapturedAt,
      savedAt: new Date().toISOString(),
      autoSaved: true,
    };

    // Save to store immediately
    store.saveQuizAnswer(quiz.id, currentUser.id, updatedAnswer);

    // Update local state
    setAttempt((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: updatedAnswer,
        },
      };
    });

    logEvent('QUESTION_ANSWER', 0, { questionId: currentQuestion.id });

    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  };

  // Multiple choice toggle
  const toggleMultipleChoiceOption = (optId: string) => {
    const existing = currentAnswer?.selectedOptions || [];
    const next = existing.includes(optId)
      ? existing.filter((id) => id !== optId)
      : [...existing, optId];
    handleAnswerChange({ selectedOptions: next });
  };

  // Timeout auto-submit
  const handleTimeOutSubmit = () => {
    if (!quiz || isFinished) return;
    isSubmittingRef.current = true;
    const submitted = store.submitQuizAttempt(quiz.id, currentUser.id, true);
    setAttempt(submitted || null);
    setIsFinished(true);
  };

  // Explicit user submit
  const handleConfirmFinalSubmit = () => {
    if (!quiz) return;
    isSubmittingRef.current = true;
    setIsConfirmSubmitOpen(false);
    const submitted = store.submitQuizAttempt(quiz.id, currentUser.id, false);
    setAttempt(submitted || null);
    setIsFinished(true);

    if (submitted?.isPassed) {
      try {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        // ignore if not loaded
      }
    }
  };

  // Camera event handler with isolated logging
  const handleCameraEvent = (
    eventType: 'CAMERA_OPEN' | 'CAMERA_CAPTURE' | 'CAMERA_CONFIRM' | 'CAMERA_CANCEL',
    metadata?: any
  ) => {
    if (eventType === 'CAMERA_OPEN') {
      isCameraActiveRef.current = true;
    } else if (eventType === 'CAMERA_CONFIRM' || eventType === 'CAMERA_CANCEL') {
      setTimeout(() => {
        isCameraActiveRef.current = false;
      }, 500);
    }
    logEvent(eventType, 0, metadata);
  };

  if (!quiz || !currentQuestion) {
    return (
      <div className="p-12 text-center text-slate-500">
        Quiz tidak ditemukan.
        <button onClick={onExit} className="block mx-auto mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl">
          Kembali
        </button>
      </div>
    );
  }

  // Calculate formatted time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Count answered questions
  const answeredCount = Object.keys(attempt?.answers || {}).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // --- SUBMITTED / TIMEOUT SCREEN ---
  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-scale-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {attempt?.status === 'QUIZ_TIMEOUT'
              ? 'Waktu Quiz Telah Habis!'
              : 'Quiz Berhasil Dikumpulkan! 🎉'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Seluruh jawaban dan aktivitas Anda telah disimpan ke server dengan aman.
          </p>

          <div className="my-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Nilai Skor Objektif Sementara
            </span>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
              {attempt?.totalScore || 0}
              <span className="text-lg text-slate-400 font-normal"> / {attempt?.maxPossibleScore || 100}</span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <Badge variant={attempt?.isPassed ? 'success' : 'warning'}>
                {attempt?.isPassed ? 'Memenuhi Standar KKM' : 'Belum Memenuhi KKM'}
              </Badge>
              <span className="text-xs text-slate-400">• KKM: {quiz.passingGrade}%</span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              *Soal uraian essay dan foto rumus tulisan tangan akan dievaluasi oleh Guru Pengampu berbantukan rekomendasi AI. Nilai akhir akan diperbarui pada halaman Nilai & Evaluasi.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onExit}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              Kembali ke Menu Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Non-judgmental focus advisory notice */}
      {focusWarning && (
        <div className="p-3.5 bg-amber-500/90 text-white text-xs font-medium rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-slide-down sticky top-20 z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{focusWarning}</span>
          </div>
          <button
            onClick={() => setFocusWarning(null)}
            className="text-[10px] font-bold underline shrink-0 hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Bar: Quiz Info, Timer, Autosave Status */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {quiz.subjectName}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">{quiz.className}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {quiz.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <span className="text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Menyimpan...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                Jawaban tersimpan
              </span>
            )}
            {saveStatus === 'offline' && (
              <span className="text-rose-500 flex items-center gap-1 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                Menunggu koneksi...
              </span>
            )}
          </div>

          {/* Accurate Timer Badge */}
          <div
            className={`px-4 py-2 rounded-2xl font-mono text-sm sm:text-base font-black flex items-center gap-2 border shadow-xs transition ${
              timeRemaining < 300
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-800 animate-pulse'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Main Runner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Content (3 Cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-xs">
                    Soal No. {currentIdx + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    dari {totalQuestions} Soal
                  </span>
                </div>

                <Badge variant="purple">
                  {currentQuestion.type === 'SINGLE_CHOICE'
                    ? 'Pilihan Ganda'
                    : currentQuestion.type === 'MULTIPLE_CHOICE'
                    ? 'Pilihan Jamak'
                    : currentQuestion.type === 'TRUE_FALSE'
                    ? 'Benar / Salah'
                    : currentQuestion.type === 'SHORT_ANSWER'
                    ? 'Jawaban Singkat'
                    : currentQuestion.type === 'ESSAY'
                    ? 'Uraian / Essay'
                    : currentQuestion.type === 'PHOTO'
                    ? 'Jawaban Foto / Kamera'
                    : 'Teks + Foto'}
                </Badge>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-6 font-sans">
                {currentQuestion.question}
              </div>

              {/* Options or Answer Input by Type */}
              {/* 1. SINGLE CHOICE & TRUE/FALSE */}
              {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, i) => {
                    const isSelected = currentAnswer?.selectedOptions?.[0] === opt.id;
                    const letters = ['A', 'B', 'C', 'D', 'E'];

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleAnswerChange({ selectedOptions: [opt.id] })}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {currentQuestion.type === 'TRUE_FALSE'
                            ? opt.text === 'Benar'
                              ? 'B'
                              : 'S'
                            : letters[i] || i + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. MULTIPLE CHOICE */}
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                    *Pilih semua jawaban yang benar (bisa lebih dari satu pilihan):
                  </p>
                  {currentQuestion.options?.map((opt) => {
                    const isChecked = currentAnswer?.selectedOptions?.includes(opt.id) || false;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => toggleMultipleChoiceOption(opt.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-3.5 ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-500'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/70'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. SHORT ANSWER */}
              {currentQuestion.type === 'SHORT_ANSWER' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Ketik Jawaban Singkat Anda:
                  </label>
                  <input
                    type="text"
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                    placeholder="Ketikkan teks atau angka jawaban Anda di sini..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* 4. ESSAY */}
              {currentQuestion.type === 'ESSAY' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Lembar Jawaban Uraian (Essay):
                  </label>
                  <textarea
                    rows={6}
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                    placeholder="Uraikan jawaban Anda secara terstruktur, runtut, dan lengkap..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* 5. PHOTO ONLY OR TEXT + PHOTO */}
              {(currentQuestion.type === 'PHOTO' || currentQuestion.type === 'TEXT_AND_PHOTO') && (
                <div className="space-y-4">
                  {currentQuestion.type === 'TEXT_AND_PHOTO' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Uraian Penjelasan Teks:
                      </label>
                      <textarea
                        rows={3}
                        value={currentAnswer?.textAnswer || ''}
                        onChange={(e) => handleAnswerChange({ textAnswer: e.target.value })}
                        placeholder="Tuliskan analisis penjelasan Anda..."
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                  )}

                  {/* Camera answer preview & trigger buttons */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Foto Coretan Rumus / Jawaban Kertas:
                    </label>

                    {currentAnswer?.photoUrl ? (
                      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col sm:flex-row items-center gap-4">
                        <img
                          src={currentAnswer.photoUrl}
                          alt="Foto jawaban siswa"
                          className="w-32 h-24 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-700"
                        />
                        <div className="flex-1 text-center sm:text-left">
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 justify-center sm:justify-start">
                            <CheckCircle2 className="w-4 h-4" />
                            Foto Jawaban Berhasil Dilampirkan
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Waktu ambil: {new Date(currentAnswer.savedAt).toLocaleTimeString('id-ID')}
                          </p>
                          <button
                            onClick={() => setIsCameraModalOpen(true)}
                            className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Ganti Foto / Ambil Ulang
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-center">
                        <FileImage className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Belum Ada Foto Jawaban
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                          Gunakan kamera perangkat Anda untuk memfoto lembar coretan rumus matematika, diagram, atau hitungan fisika.
                        </p>

                        <button
                          onClick={() => setIsCameraModalOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20"
                        >
                          <Camera className="w-4 h-4" />
                          Buka Kamera / Upload Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Buttons */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-6">
              <button
                disabled={currentIdx === 0}
                onClick={() => {
                  setCurrentIdx((prev) => Math.max(0, prev - 1));
                  logEvent('QUESTION_VIEW', 0, { questionIndex: currentIdx });
                }}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              {currentIdx === totalQuestions - 1 ? (
                <button
                  onClick={() => setIsConfirmSubmitOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Kumpulkan Quiz
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1));
                    logEvent('QUESTION_VIEW', 0, { questionIndex: currentIdx + 2 });
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  Berikutnya
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator Side Panel (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              Navigasi Butir Soal
            </h3>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
              {quiz.questions.map((q, idx) => {
                const qId = attempt?.questionOrder?.[idx] || q.id;
                const isAnswered = !!attempt?.answers[qId];
                const isActive = currentIdx === idx;

                return (
                  <button
                    key={qId}
                    onClick={() => {
                      setCurrentIdx(idx);
                      logEvent('QUESTION_VIEW', 0, { questionIndex: idx + 1 });
                    }}
                    className={`h-10 rounded-xl font-bold text-xs transition flex items-center justify-center relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isAnswered && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-600" />
                <span>Sedang Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-400" />
                <span>Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300" />
                <span>Belum Dijawab ({totalQuestions - answeredCount})</span>
              </div>
            </div>

            {/* Final Submit Button */}
            <button
              onClick={() => setIsConfirmSubmitOpen(true)}
              className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              Selesai & Kumpulkan
            </button>
          </div>
        </div>
      </div>

      {/* Camera Answer Modal */}
      <CameraAnswerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onConfirm={(photoDataUrl) => {
          handleAnswerChange({
            photoUrl: photoDataUrl,
            photoCapturedAt: new Date().toISOString(),
          });
        }}
        onLogEvent={handleCameraEvent}
        initialPhotoUrl={currentAnswer?.photoUrl}
      />

      {/* Pre-Submit Confirmation Modal */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Kumpulkan Lembar Quiz?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum mengumpulkan secara permanen.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs text-left space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Terjawab:</span>
                <span className="font-bold text-emerald-600">
                  {answeredCount} dari {totalQuestions} Soal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Belum Terjawab:</span>
                <span className="font-bold text-rose-500">
                  {totalQuestions - answeredCount} Soal
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Waktu:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
              >
                Lanjutkan Mengerjakan
              </button>
              <button
                onClick={handleConfirmFinalSubmit}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
