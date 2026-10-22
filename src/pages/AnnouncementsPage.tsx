import React, { useState } from 'react';
import { Megaphone, Plus, Calendar, User, Trash2, X, AlertTriangle } from 'lucide-react';
import { User as UserType, Announcement } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface AnnouncementsPageProps {
  currentUser: UserType;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ currentUser }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetClass, setTargetClass] = useState('Semua Kelas');
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');

  const announcements = store.getAnnouncements();
  const classes = store.getClasses();
  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'admin' ? 'Admin Sekolah' : 'Guru Pengampu',
      targetClass,
      priority,
      createdAt: new Date().toISOString(),
    };

    store.saveAnnouncement(newAnn);
    setIsCreateOpen(false);
    setTitle('');
    setContent('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      store.deleteAnnouncement(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-rose-500" />
            Papan Pengumuman & Informasi Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Informasi resmi akademik, edaran jadwal ujian, dan pemberitahuan penting sekolah.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Buat Pengumuman Baru
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Belum Ada Pengumuman"
          description="Saat ini belum ada pengumuman baru yang dipublikasikan."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-sm ${
                ann.priority === 'URGENT'
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20'
                  : ann.priority === 'IMPORTANT'
                  ? 'border-amber-200 dark:border-amber-900/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      ann.priority === 'URGENT'
                        ? 'danger'
                        : ann.priority === 'IMPORTANT'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {ann.priority === 'URGENT'
                      ? 'Penting & Mendesak'
                      : ann.priority === 'IMPORTANT'
                      ? 'Penting'
                      : 'Informasi'}
                  </Badge>

                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">
                    {ann.targetClass}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(ann.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>

                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                {ann.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Diterbitkan oleh: <strong className="text-slate-700 dark:text-slate-300">{ann.authorName}</strong> ({ann.authorRole})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Buat Pengumuman Baru
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Ujian Susulan Semester Ganjil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Penerima
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="NORMAL">Normal / Informasi Biasa</option>
                    <option value="IMPORTANT">Important (Penting)</option>
                    <option value="URGENT">Urgent (Mendesak / Wajib)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Surat / Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ketikkan isi pemberitahuan resmi untuk siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Siarkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
