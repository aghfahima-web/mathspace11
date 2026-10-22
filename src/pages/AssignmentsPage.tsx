import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  X,
  User,
  Award,
  Send,
  FileCheck,
  Search,
} from 'lucide-react';
import { User as UserType, Assignment, AssignmentSubmission } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface AssignmentsPageProps {
  currentUser: UserType;
  initialOpenCreate?: boolean;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({
  currentUser,
  initialOpenCreate = false,
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreate);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);

  // Student submission form
  const [submitText, setSubmitText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');

  // Teacher grade form
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Teacher create assignment form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('subj-math');
  const [newClass, setNewClass] = useState('XII IPA 1');
  const [newDeadline, setNewDeadline] = useState('2026-10-27T23:59');
  const [newInstructions, setNewInstructions] = useState('');
  const [newMaxScore, setNewMaxScore] = useState(100);

  const assignments = store.getAssignments();
  const submissions = store.getSubmissions();
  const subjects = store.getSubjects();
  const classes = store.getClasses();

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  // Handle student submit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const newSub: AssignmentSubmission = {
      id: `sub-${Date.now()}`,
      assignmentId: selectedAssignment.id,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar: currentUser.avatar,
      className: currentUser.className || 'XII IPA 1',
      submittedAt: new Date().toISOString(),
      textAnswer: submitText,
      fileAttachment: submitFileName
        ? {
            name: submitFileName,
            url: '#',
            size: '2.1 MB',
            type: 'application/pdf',
          }
        : undefined,
      status: 'SUDAH_DIKUMPULKAN',
    };

    store.saveSubmission(newSub);
    setIsSubmitModalOpen(false);
    setSubmitText('');
    setSubmitFileName('');

    // Send notification to teacher
    store.addNotification({
      id: `notif-${Date.now()}`,
      userId: 'user-guru-1',
      title: 'Tugas Dikumpulkan',
      message: `${currentUser.name} telah mengumpulkan tugas "${selectedAssignment.title}".`,
      type: 'ASSIGNMENT',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: 'assignments',
    });
  };

  // Handle teacher grade submission
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const updated: AssignmentSubmission = {
      ...selectedSubmission,
      score: gradeScore,
      feedback: gradeFeedback,
      status: 'DINILAI',
      gradedAt: new Date().toISOString(),
      gradedBy: currentUser.name,
    };

    store.saveSubmission(updated);
    setIsGradeModalOpen(false);

    // Notify student
    store.addNotification({
      id: `notif-${Date.now()}`,
      userId: selectedSubmission.studentId,
      title: 'Nilai Tugas Tersedia',
      message: `Tugas Anda telah dinilai oleh ${currentUser.name}. Nilai: ${gradeScore}/100.`,
      type: 'GRADE',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: 'assignments',
    });
  };

  // Handle teacher create assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === newSubjectId);

    const asg: Assignment = {
      id: `asg-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      subjectId: newSubjectId,
      subjectName: subj?.name || 'Mata Pelajaran',
      className: newClass,
      deadline: new Date(newDeadline).toISOString(),
      instructions: newInstructions,
      maxScore: newMaxScore,
      status: 'published',
      createdAt: new Date().toISOString(),
      attachments: [
        { name: 'Lembar_Tugas_Resmi.pdf', url: '#', size: '650 KB', type: 'application/pdf' },
      ],
    };

    store.saveAssignment(asg);
    setIsCreateModalOpen(false);

    // Add calendar event
    store.saveCalendarEvent({
      id: `cal-${Date.now()}`,
      title: `Deadline Tugas: ${newTitle}`,
      date: newDeadline.split('T')[0],
      time: '23:59',
      type: 'ASSIGNMENT',
      description: newDesc,
      className: newClass,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Tugas & Evaluasi Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser.role === 'siswa'
              ? 'Kumpulkan hasil pekerjaan tugas rumah, proyek mandiri, dan pantau umpan balik guru.'
              : 'Buat penugasan siswa, periksa lembar jawaban, dan input penilaian autentik.'}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Buat Tugas Baru
          </button>
        )}
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum Ada Tugas"
              description="Belum ada penugasan aktif dari pengajar untuk kelas Anda."
            />
          ) : (
            assignments.map((asg) => {
              const studentSub = submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === currentUser.id
              );
              const totalSubs = submissions.filter((s) => s.assignmentId === asg.id).length;
              const isSelected = selectedAssignment?.id === asg.id;

              return (
                <div
                  key={asg.id}
                  onClick={() => setSelectedAssignment(asg)}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {asg.subjectName}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs text-slate-500 font-medium">{asg.className}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {asg.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {asg.description}
                      </p>
                    </div>

                    {currentUser.role === 'siswa' ? (
                      <Badge
                        variant={
                          studentSub?.status === 'DINILAI'
                            ? 'success'
                            : studentSub?.status === 'SUDAH_DIKUMPULKAN'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {studentSub?.status === 'DINILAI'
                          ? `Nilai: ${studentSub.score}/100`
                          : studentSub?.status === 'SUDAH_DIKUMPULKAN'
                          ? 'Sudah Dikumpulkan'
                          : 'Belum Dikerjakan'}
                      </Badge>
                    ) : (
                      <Badge variant="primary">{totalSubs} Dikumpulkan</Badge>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span>
                        Tenggat:{' '}
                        {new Date(asg.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Klik untuk detail & kumpul →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          {selectedAssignment ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedAssignment.subjectName}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedAssignment.title}
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block text-slate-700 dark:text-slate-200 mb-1">
                  Petunjuk & Instruksi:
                </span>
                {selectedAssignment.instructions || selectedAssignment.description}
              </div>

              {/* Attachments */}
              {selectedAssignment.attachments?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Lampiran Panduan
                  </h4>
                  {selectedAssignment.attachments.map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between border border-slate-200 dark:border-slate-700"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{f.name}</span>
                      <button
                        onClick={() => alert(`Mengunduh berkas: ${f.name}`)}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Unduh
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Student View: Check if already submitted */}
              {currentUser.role === 'siswa' && (
                <div className="pt-2">
                  {(() => {
                    const sub = submissions.find(
                      (s) =>
                        s.assignmentId === selectedAssignment.id &&
                        s.studentId === currentUser.id
                    );

                    if (sub) {
                      return (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Tugas Telah Anda Kumpulkan
                          </div>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            Waktu kumpul:{' '}
                            {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>

                          {sub.status === 'DINILAI' && (
                            <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                                  Nilai Akhir Guru:
                                </span>
                                <span className="text-base font-extrabold text-emerald-600">
                                  {sub.score}/100
                                </span>
                              </div>
                              {sub.feedback && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                                  "{sub.feedback}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Kumpulkan Jawaban Sekarang
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Teacher View: Submissions list for this assignment */}
              {isTeacherOrAdmin && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Daftar Pengumpulan Siswa
                  </h4>

                  {(() => {
                    const taskSubs = submissions.filter(
                      (s) => s.assignmentId === selectedAssignment.id
                    );
                    if (taskSubs.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 italic">Belum ada siswa yang mengumpulkan.</p>
                      );
                    }

                    return (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {taskSubs.map((s) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={s.studentAvatar}
                                alt={s.studentName}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {s.studentName}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {s.status === 'DINILAI' ? `Nilai: ${s.score}` : 'Menunggu Koreksi'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedSubmission(s);
                                setGradeScore(s.score || 85);
                                setGradeFeedback(s.feedback || '');
                                setIsGradeModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
                            >
                              {s.status === 'DINILAI' ? 'Ubah Nilai' : 'Beri Nilai'}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Pilih salah satu tugas di samping untuk melihat rincian instruksi & lembar pengumpulan.
            </div>
          )}
        </div>
      </div>

      {/* Student Submit Modal */}
      {isSubmitModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pengumpulan Tugas: {selectedAssignment.title}
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Jawaban / Catatan Siswa
                </label>
                <textarea
                  rows={4}
                  required
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Ketikkan intisari jawaban atau pengantar penjelasan tugas Anda..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lampiran Berkas (PDF / Gambar)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submitFileName}
                    onChange={(e) => setSubmitFileName(e.target.value)}
                    placeholder="Nama file, misal: Tugas_Integral_Rizky.pdf"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setSubmitFileName(`Dokumen_Tugas_${currentUser.name.replace(/\s+/g, '_')}.pdf`)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-300 transition"
                  >
                    Simulasi File
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Grade Modal */}
      {isGradeModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Koreksi & Nilai: {selectedSubmission.studentName}
              </h3>
              <button
                onClick={() => setIsGradeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl mb-4 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">
                Jawaban Siswa:
              </span>
              <p className="italic">"{selectedSubmission.textAnswer}"</p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Angka (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Umpan Balik (Feedback) Guru
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Bagus, langkah integrasi runtut. Perhatikan tanda minus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-sm"
                >
                  Simpan Nilai & Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Buat Tugas Baru
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Latihan Soal Pemodelan Kurva Integral"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tenggat Pengumpulan (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi & Instruksi Pengerjaan
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Jelaskan format pengumpulan, bobot penilaian, dan aturan tugas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
