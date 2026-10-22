import React, { useState } from 'react';
import { CheckSquare, Plus, Calendar, User, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import { User as UserType, AttendanceSession, AttendanceRecord } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface AttendancePageProps {
  currentUser: UserType;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ currentUser }) => {
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New session form
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSubjectId, setSessionSubjectId] = useState('subj-math');
  const [sessionClass, setSessionClass] = useState('XII IPA 1');
  const [sessionDate, setSessionDate] = useState('2026-10-21');

  const sessions = store.getAttendanceSessions();
  const subjects = store.getSubjects();
  const classes = store.getClasses();
  const allStudents = store.getUsers().filter((u) => u.role === 'siswa');

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  // Compute student attendance stats if student
  let studentStats = { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
  if (currentUser.role === 'siswa') {
    sessions.forEach((s) => {
      const rec = s.records.find((r) => r.studentId === currentUser.id);
      if (rec) {
        studentStats.total++;
        if (rec.status === 'HADIR') studentStats.hadir++;
        else if (rec.status === 'IZIN') studentStats.izin++;
        else if (rec.status === 'SAKIT') studentStats.sakit++;
        else if (rec.status === 'ALPA') studentStats.alpa++;
      }
    });
  }

  const attendancePercentage =
    studentStats.total > 0
      ? Math.round((studentStats.hadir / studentStats.total) * 100)
      : 100;

  // Handle create session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === sessionSubjectId);

    // Default all students to HADIR initially
    const initialRecords: AttendanceRecord[] = allStudents.map((st) => ({
      studentId: st.id,
      studentName: st.name,
      status: 'HADIR',
    }));

    const newSession: AttendanceSession = {
      id: `att-${Date.now()}`,
      title: sessionTitle,
      subjectId: sessionSubjectId,
      subjectName: subj?.name || 'Mata Pelajaran',
      className: sessionClass,
      date: sessionDate,
      teacherName: currentUser.name,
      records: initialRecords,
    };

    store.saveAttendanceSession(newSession);
    setIsCreateModalOpen(false);
    setSelectedSession(newSession);
  };

  // Handle teacher updating a student's status
  const handleUpdateRecordStatus = (
    studentId: string,
    newStatus: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'
  ) => {
    if (!selectedSession) return;
    const updatedRecords = selectedSession.records.map((r) =>
      r.studentId === studentId ? { ...r, status: newStatus } : r
    );
    const updated = { ...selectedSession, records: updatedRecords };
    store.saveAttendanceSession(updated);
    setSelectedSession(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Presensi & Kehadiran Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isTeacherOrAdmin
              ? 'Kelola daftar presensi kelas pertemuan tatap muka maupun daring.'
              : 'Pantau rekap persentase kehadiran Anda pada setiap pertemuan mata pelajaran.'}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Buka Sesi Presensi Baru
          </button>
        )}
      </div>

      {/* Student Attendance Summary Cards */}
      {currentUser.role === 'siswa' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block mb-1">
              Persentase Kehadiran
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {attendancePercentage}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Standar KKM Presensi: 80%</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Total Hadir</span>
            <div className="text-xl font-bold text-emerald-600">{studentStats.hadir} Sesi</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Izin Resmi</span>
            <div className="text-xl font-bold text-blue-600">{studentStats.izin} Sesi</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Sakit (Keterangan)</span>
            <div className="text-xl font-bold text-amber-600">{studentStats.sakit} Sesi</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-xs font-medium text-slate-500 block mb-1">Alpa (Tanpa Berita)</span>
            <div className="text-xl font-bold text-rose-600">{studentStats.alpa} Sesi</div>
          </div>
        </div>
      )}

      {/* Main Sessions Grid / Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Daftar Sesi Pertemuan Kelas
          </h3>

          {sessions.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Belum Ada Presensi"
              description="Belum ada sesi presensi yang dibuat."
            />
          ) : (
            sessions.map((s) => {
              const isSelected = selectedSession?.id === s.id;
              const studentRec = s.records.find((r) => r.studentId === currentUser.id);

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer shadow-xs ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {s.subjectName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.date}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {s.className} • Pengajar: {s.teacherName}
                  </p>

                  {currentUser.role === 'siswa' && studentRec && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Status Anda:</span>
                      <Badge
                        variant={
                          studentRec.status === 'HADIR'
                            ? 'success'
                            : studentRec.status === 'IZIN'
                            ? 'info'
                            : studentRec.status === 'SAKIT'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {studentRec.status}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Session Student Checklist (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          {selectedSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSession.subjectName} • {selectedSession.className}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedSession.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block font-mono">
                    {selectedSession.date}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pengajar: {selectedSession.teacherName}
                  </span>
                </div>
              </div>

              {/* Records Checklist */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto">
                {selectedSession.records.map((rec) => (
                  <div
                    key={rec.studentId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                        {rec.studentName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {rec.studentName}
                        </span>
                        {rec.note && <span className="text-[10px] text-slate-400">{rec.note}</span>}
                      </div>
                    </div>

                    {isTeacherOrAdmin ? (
                      /* Status Buttons for Teacher */
                      <div className="flex items-center gap-1">
                        {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as const).map((statusOpt) => {
                          const isActive = rec.status === statusOpt;
                          return (
                            <button
                              key={statusOpt}
                              onClick={() => handleUpdateRecordStatus(rec.studentId, statusOpt)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                isActive
                                  ? statusOpt === 'HADIR'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : statusOpt === 'IZIN'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : statusOpt === 'SAKIT'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {statusOpt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Student Badge */
                      <Badge
                        variant={
                          rec.status === 'HADIR'
                            ? 'success'
                            : rec.status === 'IZIN'
                            ? 'info'
                            : rec.status === 'SAKIT'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {rec.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Pilih salah satu sesi pertemuan di samping untuk melihat atau mengisi lembar presensi.
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Buka Sesi Presensi Baru
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pertemuan / Materi Pembahasan
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Contoh: Pertemuan Ke-9: Latihan Integral Parsial"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={sessionSubjectId}
                    onChange={(e) => setSessionSubjectId(e.target.value)}
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
                    Kelas
                  </label>
                  <select
                    value={sessionClass}
                    onChange={(e) => setSessionClass(e.target.value)}
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
                  Tanggal Presensi
                </label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
                  Buka Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
