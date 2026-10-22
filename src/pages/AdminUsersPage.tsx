import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  KeyRound,
  CheckCircle2,
  X,
  Shield,
  UserCheck,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Database,
  RefreshCw,
  Eye,
  EyeOff,
  UserX,
  Lock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Role } from '../types';
import { store } from '../services/store';
import { apiClient, DatabaseStats } from '../services/api';
import { Badge } from '../components/common/Badge';

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('Siswa2026!');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states for Create/Edit
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('siswa');
  const [className, setClassName] = useState('XII IPA 1');
  const [nisn, setNisn] = useState(''); // Optional NISN for siswa
  const [idNumber, setIdNumber] = useState(''); // NIP for guru/admin
  const [phone, setPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('Siswa2026!');
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [accountStatus, setAccountStatus] = useState<'active' | 'inactive'>('active');

  // Async submission & notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Database status
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Excel / CSV Import states
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{
    successCount: number;
    failedCount: number;
    errors: Array<{ row: number; name: string; username?: string; nisn?: string; reason: string }>;
  } | null>(null);

  const users = store.getUsers();
  const classes = store.getClasses();

  // Load database status
  const refreshDbStatus = async () => {
    try {
      const stats = await apiClient.getDatabaseStatus();
      setDbStats(stats);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    refreshDbStatus();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await store.syncWithServer();
    await refreshDbStatus();
    setIsSyncing(false);
    setActionSuccess('Data pengguna berhasil disinkronkan dengan database pusat!');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.nisn && u.nisn.includes(search)) ||
      (u.nip && u.nip.includes(search));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setRole('siswa');
    setClassName(classes[0]?.name || 'XII IPA 1');
    setNisn('');
    setIdNumber('');
    setPhone('');
    setInitialPassword('Siswa2026!');
    setAccountStatus('active');
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setUsername(user.username || (user.email ? user.email.split('@')[0] : ''));
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setClassName(user.className || 'XII IPA 1');
    setNisn(user.nisn || '');
    setIdNumber(user.nip || '');
    setPhone(user.phone || '');
    setAccountStatus(user.status);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingUser) {
        // Edit existing user in central database
        if (role === 'siswa') {
          const cleanUser = username.trim().toLowerCase();
          if (!cleanUser) {
            setActionError('Username wajib diisi.');
            setIsSubmitting(false);
            return;
          }
          await store.updateStudentInCentral(editingUser.id, {
            username: cleanUser,
            name: name.trim() || cleanUser,
            nisn: nisn.trim() || undefined,
            className,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          });
        } else {
          await store.updateStudentInCentral(editingUser.id, {
            name: name.trim() || undefined,
            className: undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          });
        }

        if (editingUser.status !== accountStatus) {
          await store.setStudentStatusInCentral(editingUser.id, accountStatus);
        }

        setActionSuccess(`Data pengguna "${name || username}" berhasil diperbarui di database pusat.`);
        setIsModalOpen(false);
      } else {
        // Create new user in central database
        if (role === 'siswa') {
          const cleanUser = username.trim().toLowerCase();
          if (!cleanUser) {
            setActionError('Username wajib diisi.');
            setIsSubmitting(false);
            return;
          }
          if (cleanUser.length < 3) {
            setActionError('Username minimal 3 karakter.');
            setIsSubmitting(false);
            return;
          }
          if (!/^[a-zA-Z0-9._-]+$/.test(cleanUser)) {
            setActionError('Username hanya boleh berisi huruf, angka, titik, strip (-), atau garis bawah (_).');
            setIsSubmitting(false);
            return;
          }
          if (!initialPassword || initialPassword.length < 6) {
            setActionError('Kata sandi awal wajib diisi minimal 6 karakter.');
            setIsSubmitting(false);
            return;
          }

          const res = await store.addStudentToCentral({
            username: cleanUser,
            initialPassword: initialPassword.trim(),
            name: name.trim() || cleanUser,
            className,
            nisn: nisn.trim() || undefined,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            createdBy: 'admin',
          });
          setActionSuccess(res.message);
        } else {
          // Add teacher/admin
          const newUser: User = {
            id: `user-${role}-${Date.now()}`,
            username: username.trim().toLowerCase() || email.split('@')[0] || `${role}${Date.now()}`,
            name: name.trim() || `${role.toUpperCase()}`,
            email: email || `${role}@sekolah.sch.id`,
            role,
            avatar:
              role === 'guru'
                ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            nip: idNumber,
            phone,
            status: accountStatus,
          };
          store.saveUser(newUser);
          setActionSuccess(`Akun ${role.toUpperCase()} "${name}" berhasil ditambahkan.`);
        }
        setIsModalOpen(false);
      }

      await refreshDbStatus();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Gagal menyimpan data ke database pusat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionWord = nextStatus === 'active' ? 'mengaktifkan kembali' : 'menonaktifkan';

    if (
      window.confirm(
        `Yakin ingin ${actionWord} akun "${user.name}"? ${
          nextStatus === 'inactive'
            ? 'Pengguna tidak akan dapat login dari perangkat mana pun.'
            : 'Pengguna akan dapat login kembali.'
        }`
      )
    ) {
      try {
        await store.setStudentStatusInCentral(user.id, nextStatus);
        setActionSuccess(`Status akun "${user.name}" berhasil diubah menjadi ${nextStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`);
        await refreshDbStatus();
        setTimeout(() => setActionSuccess(null), 3500);
      } catch (err: any) {
        alert(err.message || 'Gagal memperbarui status akun.');
      }
    }
  };

  const handleOpenResetModal = (user: User) => {
    setTargetResetUser(user);
    setNewPasswordValue('Siswa2026!');
    setShowNewPassword(false);
    setIsResetModalOpen(true);
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetUser) return;

    setIsSubmitting(true);
    try {
      const res = await store.resetPasswordInCentral(targetResetUser.id, newPasswordValue);
      setIsResetModalOpen(false);
      setActionSuccess(
        `Kata sandi untuk "${targetResetUser.name}" berhasil di-reset menjadi "${newPasswordValue}". Siswa dapat langsung login dengan sandi ini.`
      );
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Gagal me-reset kata sandi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excel / CSV File Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setImportFileError('Berkas Excel/CSV kosong.');
          return;
        }

        // Map column variations with Username & Password as primary
        const mapped = rawJson.map((row) => ({
          username: String(row['Username'] || row['username'] || row['User'] || row['ID Pengguna'] || '').trim(),
          password: String(row['Password'] || row['password'] || row['Kata Sandi'] || row['initialPassword'] || 'Siswa2026!').trim(),
          name: row['Nama Lengkap'] || row['Nama'] || row['nama'] || '',
          nisn: String(row['NISN'] || row['NIS'] || row['nisn'] || row['NISN (Opsional)'] || '').trim(),
          className: row['Kelas'] || row['kelas'] || 'XII IPA 1',
          email: row['Email'] || row['email'] || '',
          phone: String(row['No HP'] || row['Telepon'] || row['phone'] || ''),
        }));

        setImportRows(mapped);
      } catch (err: any) {
        setImportFileError('Gagal membaca berkas. Pastikan format sesuai Excel/CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    if (importRows.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = await store.bulkImportStudentsToCentral(importRows);
      setImportResults({
        successCount: result.successCount,
        failedCount: result.failedCount,
        errors: result.errors,
      });
      await refreshDbStatus();
      if (result.successCount > 0) {
        setActionSuccess(`Berhasil mengimpor ${result.successCount} siswa ke database pusat!`);
      }
    } catch (err: any) {
      setImportFileError(err.message || 'Terjadi kesalahan saat memproses impor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Username: 'zaky.pratama',
        Password: 'Siswa2026!',
        'Nama Lengkap': 'Ahmad Zaky Pratama',
        Kelas: 'XII IPA 1',
        'NISN (Opsional)': '0054238920',
        Email: 'zaky.pratama@siswa.sekolah.sch.id',
        'No HP': '081234567800',
      },
      {
        Username: 'citra.kirana',
        Password: 'Siswa2026!',
        'Nama Lengkap': 'Citra Kirana Dewi',
        Kelas: 'XII IPA 1',
        'NISN (Opsional)': '',
        Email: 'citra.kirana@siswa.sekolah.sch.id',
        'No HP': '081234567801',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Data_Siswa_Sekolah.xlsx');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Central DB Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manajemen Pengguna (Siswa & Guru)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Database terpusat aktif: Siswa yang ditambahkan tersimpan permanen dan dapat login dari laptop atau perangkat lain.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setImportRows([]);
              setImportFileError(null);
              setImportResults(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Import Excel / CSV
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Database Status Strip */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                Database Pusat Terkoneksi
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sinkron Multi-Perangkat
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Total Pengguna: <strong>{users.length}</strong> • Siswa Terdaftar:{' '}
              <strong>{users.filter((u) => u.role === 'siswa').length}</strong> • Akun Aktif:{' '}
              <strong>{users.filter((u) => u.status === 'active').length}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Sekarang'}</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 font-medium">{actionSuccess}</div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{actionError}</div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, email, NISN, atau NIP..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex-1 md:flex-initial"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="siswa">Siswa Saja</option>
            <option value="guru">Guru Saja</option>
            <option value="admin">Administrator Saja</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex-1 md:flex-initial"
          >
            <option value="ALL">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Nama & Identitas</th>
                <th className="px-4 py-3.5">Email / Akun</th>
                <th className="px-4 py-3.5 text-center">Peran (Role)</th>
                <th className="px-4 py-3.5 text-center">Kelas / NIP</th>
                <th className="px-4 py-3.5 text-center">Status Akun</th>
                <th className="px-6 py-3.5 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                      u.status === 'inactive' ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {u.name}
                            </span>
                            {u.username && (
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-200/50 dark:border-indigo-800">
                                @{u.username}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u.role === 'siswa'
                              ? u.nisn
                                ? `NISN: ${u.nisn}`
                                : 'Siswa (Tanpa NISN)'
                              : u.nip
                              ? `NIP: ${u.nip}`
                              : 'Admin IT'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {u.email}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'purple'
                            : u.role === 'guru'
                            ? 'primary'
                            : 'success'
                        }
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-4 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                      {u.className || u.nip || '-'}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenResetModal(u)}
                          title="Reset Kata Sandi"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Data Pengguna"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Akun Siswa Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Login siswa hanya menggunakan Username dan Kata Sandi. Tersimpan di database pusat.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {/* Role & Class Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="siswa">Siswa</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === 'siswa' ? (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kelas Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIP Pegawai
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="19820315..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* Username (WAJIB - Kredensial Login Siswa & Pengguna) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: rizky26 atau alya_putri"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Wajib & unik. Siswa akan login menggunakan username ini (tanpa spasi).
                </span>
              </div>

              {/* Password Awal Siswa (WAJIB saat akun dibuat) */}
              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi Awal (Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showInitialPassword ? 'text' : 'password'}
                      required
                      value={initialPassword}
                      onChange={(e) => setInitialPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowInitialPassword(!showInitialPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showInitialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Siswa memasukkan kata sandi ini saat login di HP atau laptop (min. 6 karakter).
                  </span>
                </div>
              )}

              {/* Nama Lengkap (Opsional untuk Siswa) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky Pratama (default sama dengan username)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Opsional untuk kebutuhan profil raport & rekap nilai. Jika kosong, otomatis sama dengan username.
                </span>
              </div>

              {/* NISN (Strictly Opsional, Bukan Syarat Login) */}
              {role === 'siswa' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NISN (Nomor Induk Siswa Nasional) <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0054238910 (Boleh dikosongkan)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    NISN tidak lagi menjadi syarat login siswa. Boleh diisi atau dikosongkan sesuai kebutuhan sekolah.
                  </span>
                </div>
              )}

              {/* Email (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    username
                      ? `${username.toLowerCase()}@siswa.sekolah.sch.id`
                      : 'siswa@sekolah.sch.id (dibuat otomatis jika kosong)'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Phone (Opsional) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor HP / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Status Akun */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status Akun
                </label>
                <select
                  value={accountStatus}
                  onChange={(e: any) => setAccountStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="active">Aktif (Dapat Login)</option>
                  <option value="inactive">Nonaktif (Dilarang Login)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingUser ? 'Perbarui Akun' : 'Simpan Siswa ke Database'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && targetResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Reset Kata Sandi
                  </h3>
                  <p className="text-[11px] text-slate-400">{targetResetUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Kata sandi baru akan di-hash secara aman dan diperbarui di database pusat. Sesi login lama di perangkat lain akan otomatis dibatalkan.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPasswordValue('Siswa2026!')}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Gunakan "Siswa2026!"
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewPasswordValue(
                      `Pass#${Math.floor(1000 + Math.random() * 9000)}!`
                    )
                  }
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                >
                  Acak Sandi Kuat
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Import Data Siswa Sekaligus
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Unggah berkas Excel (.xlsx / .xls) atau CSV untuk menambahkan banyak siswa sekaligus.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download strip */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Kolom wajib: <strong>Username, Password</strong>. Kolom opsional: <strong>Nama Lengkap, Kelas, NISN, Email, No HP</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Format Excel
              </button>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Pilih Berkas Excel atau CSV
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mendukung .xlsx, .xls, .csv
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
              />
            </div>

            {importFileError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importFileError}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {importRows.length > 0 && !importResults && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Pratinjau Data ({importRows.length} Siswa Terdeteksi):</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Pastikan Username belum pernah digunakan.
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold text-[10px]">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Username (Wajib)</th>
                        <th className="p-2">Password</th>
                        <th className="p-2">Nama Lengkap</th>
                        <th className="p-2">Kelas</th>
                        <th className="p-2">NISN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {importRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 text-slate-400">{i + 1}</td>
                          <td className="p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {r.username || <span className="text-rose-500 font-sans italic">Kosong</span>}
                          </td>
                          <td className="p-2 font-mono text-slate-500 text-[11px]">
                            {r.password || 'Siswa2026!'}
                          </td>
                          <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">
                            {r.name || r.username || '-'}
                          </td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">
                            {r.className || 'XII IPA 1'}
                          </td>
                          <td className="p-2 font-mono text-slate-400">
                            {r.nisn || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setImportRows([])}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessImport}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'Memproses ke Database...' : `Proses Impor ${importRows.length} Siswa`}
                  </button>
                </div>
              </div>
            )}

            {/* Results Report */}
            {importResults && (
              <div className="mt-5 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs">
                  <div className="font-bold text-sm mb-1">Hasil Impor Selesai!</div>
                  <div>
                    Berhasil diimpor: <strong>{importResults.successCount} siswa</strong> • Gagal /
                    Duplikat: <strong>{importResults.failedCount} siswa</strong>
                  </div>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Rincian Siswa yang Gagal Diimpor:
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {importResults.errors.map((err, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between"
                        >
                          <span>
                            Baris {err.row}: <strong>{err.username || err.name}</strong>
                          </span>
                          <span className="font-semibold">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportRows([]);
                      setImportResults(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    Tutup & Lihat Siswa di Tabel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
