import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Video,
  Download,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react';
import { User, Material } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface MaterialsPageProps {
  currentUser: User;
  initialOpenCreate?: boolean;
}

export const MaterialsPage: React.FC<MaterialsPageProps> = ({
  currentUser,
  initialOpenCreate = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [readingMaterial, setReadingMaterial] = useState<Material | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialOpenCreate);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('subj-math');
  const [formClass, setFormClass] = useState('XII IPA 1');
  const [formChapter, setFormChapter] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');

  const materials = store.getMaterials();
  const subjects = store.getSubjects();
  const classes = store.getClasses();

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.chapter.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchSubj = selectedSubject === 'ALL' || m.subjectId === selectedSubject;
    const matchClass = selectedClass === 'ALL' || m.className === selectedClass;
    return matchSearch && matchSubj && matchClass;
  });

  const isTeacherOrAdmin = currentUser.role === 'guru' || currentUser.role === 'admin';

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setFormTitle('');
    setFormDesc('');
    setFormSubjectId('subj-math');
    setFormClass('XII IPA 1');
    setFormChapter('');
    setFormContent('');
    setFormVideoUrl('');
    setFormStatus('published');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMaterial(m);
    setFormTitle(m.title);
    setFormDesc(m.description);
    setFormSubjectId(m.subjectId);
    setFormClass(m.className);
    setFormChapter(m.chapter);
    setFormContent(m.content);
    setFormVideoUrl(m.videoUrl || '');
    setFormStatus(m.status);
    setIsCreateModalOpen(true);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === formSubjectId);

    const newMat: Material = {
      id: editingMaterial ? editingMaterial.id : `mat-${Date.now()}`,
      title: formTitle,
      description: formDesc,
      subjectId: formSubjectId,
      subjectName: subj?.name || 'Mata Pelajaran',
      className: formClass,
      chapter: formChapter || 'Bab 1',
      content: formContent,
      videoUrl: formVideoUrl || undefined,
      status: formStatus,
      publishedAt: editingMaterial ? editingMaterial.publishedAt : new Date().toISOString(),
      readTimeEstimate: '15 Menit',
      files: editingMaterial?.files || [
        { name: 'Modul_Pendukung.pdf', url: '#', size: '1.5 MB', type: 'application/pdf' },
      ],
    };

    store.saveMaterial(newMat);
    setIsCreateModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus materi ini?')) {
      store.deleteMaterial(id);
    }
  };

  const handleUpdateStudentProgress = (
    matId: string,
    newStatus: 'BELUM_DIBACA' | 'SEDANG_DIPELAJARI' | 'SELESAI'
  ) => {
    store.setMaterialProgress(matId, currentUser.id, newStatus);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Materi Pembelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Akses modul, artikel akademik, bahan ajar digital, dan video pembelajaran interaktif.
          </p>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Materi Baru
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi berdasarkan judul, bab, atau kata kunci..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Materi"
          description="Tidak ditemukan materi yang cocok dengan filter atau kata kunci pencarian Anda."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const progress =
              currentUser.role === 'siswa'
                ? store.getMaterialProgress(mat.id, currentUser.id)?.status || 'BELUM_DIBACA'
                : null;

            return (
              <div
                key={mat.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                      {mat.subjectName}
                    </span>

                    {currentUser.role === 'siswa' && progress && (
                      <Badge
                        variant={
                          progress === 'SELESAI'
                            ? 'success'
                            : progress === 'SEDANG_DIPELAJARI'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {progress === 'SELESAI'
                          ? 'Selesai'
                          : progress === 'SEDANG_DIPELAJARI'
                          ? 'Sedang Dipelajari'
                          : 'Belum Dibaca'}
                      </Badge>
                    )}

                    {isTeacherOrAdmin && (
                      <Badge variant={mat.status === 'published' ? 'success' : 'neutral'} size="sm">
                        {mat.status === 'published' ? 'Terbit' : 'Draft'}
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">
                    {mat.chapter} • {mat.className}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                    {mat.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mat.readTimeEstimate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isTeacherOrAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(mat)}
                          title="Edit Materi"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id)}
                          title="Hapus Materi"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setReadingMaterial(mat)}
                      className="px-3.5 py-1.5 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
                    >
                      Buka Materi
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Material Reader Modal */}
      {readingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {readingMaterial.subjectName} • {readingMaterial.chapter}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {readingMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setReadingMaterial(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Deskripsi Modul
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {readingMaterial.description}
                </p>
              </div>

              {/* Formatted Content Body */}
              <div className="prose dark:prose-invert max-w-none whitespace-pre-line font-sans text-sm">
                {readingMaterial.content}
              </div>

              {/* Video Attachment if any */}
              {readingMaterial.videoUrl && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                    <Video className="w-4 h-4" />
                    Video Pendukung Pembelajaran
                  </div>
                  <a
                    href={readingMaterial.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Tonton Video Pengantar di Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Files */}
              {readingMaterial.files && readingMaterial.files.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Lampiran Berkas & E-Book
                  </h4>
                  <div className="space-y-2">
                    {readingMaterial.files.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{f.name}</span>
                          <span className="text-slate-400">({f.size})</span>
                        </div>
                        <button
                          onClick={() => alert(`Mengunduh file: ${f.name}`)}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
                        >
                          <Download className="w-3 h-3" /> Unduh
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Student Progress Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              {currentUser.role === 'siswa' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Status Anda:</span>
                  <button
                    onClick={() => handleUpdateStudentProgress(readingMaterial.id, 'SEDANG_DIPELAJARI')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                  >
                    Sedang Dipelajari
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStudentProgress(readingMaterial.id, 'SELESAI');
                      setReadingMaterial(null);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Mode Pratinjau Pengajar</div>
              )}

              <button
                onClick={() => setReadingMaterial(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Material Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingMaterial ? 'Edit Materi Pembelajaran' : 'Buat Materi Pembelajaran Baru'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Materi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Kalkulus Integral: Teorema Fundamental"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
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

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bab / Topik
                </label>
                <input
                  type="text"
                  value={formChapter}
                  onChange={(e) => setFormChapter(e.target.value)}
                  placeholder="Contoh: Bab 3 - Integral Tentu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ringkasan poin bahasan yang akan dipelajari siswa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Konten Materi (Teks & Rumus) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Ketikkan teks materi modul pembelajaran lengkap..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Link Video (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="published">Terbitkan Langsung (Published)</option>
                    <option value="draft">Simpan Sebagai Draf (Draft)</option>
                  </select>
                </div>
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
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
