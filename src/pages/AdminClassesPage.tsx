import React, { useState } from 'react';
import { GraduationCap, Plus, BookOpen, User, X, Check } from 'lucide-react';
import { ClassRoom } from '../types';
import { store } from '../services/store';

export const AdminClassesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('12');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [homeroomTeacherName, setHomeroomTeacherName] = useState('Dra. Sri Wahyuni, M.Pd');

  const classes = store.getClasses();
  const subjects = store.getSubjects();

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: ClassRoom = {
      id: `class-${Date.now()}`,
      name,
      grade,
      academicYear,
      homeroomTeacherId: 'user-guru-1',
      homeroomTeacherName,
      totalStudents: 32,
    };
    store.saveClass(newClass);
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manajemen Kelas & Kurikulum Mapel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pengelolaan rombongan belajar, tahun ajaran aktif, wali kelas, dan pemetaan mata pelajaran.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Tambah Rombel Kelas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                  Tingkat {cls.grade}
                </span>
                <span className="text-xs text-slate-400 font-mono">{cls.academicYear}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {cls.name}
              </h3>

              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Wali Kelas:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {cls.homeroomTeacherName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Siswa:</span>
                  <span className="font-bold text-indigo-600">
                    {cls.totalStudents} Siswa Terdaftar
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Rombel Terverifikasi
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Subjects Overview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Mata Pelajaran Aktif ({subjects.length} Mapel)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            >
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono block">
                {s.code}
              </span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {s.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">Pengampu: {s.teacherName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tambah Rombongan Belajar (Kelas)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: XII IPA 3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                    <option value="12">Kelas 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Wali Kelas
                </label>
                <input
                  type="text"
                  value={homeroomTeacherName}
                  onChange={(e) => setHomeroomTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
