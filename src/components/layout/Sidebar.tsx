import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  Eye,
  Award,
  TrendingUp,
  Calendar,
  Users,
  Megaphone,
  CheckSquare,
  ShieldCheck,
  Settings,
  GraduationCap,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { Role, User } from '../../types';

interface SidebarProps {
  currentRole: Role;
  currentUser?: User | null;
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  currentUser,
  activePage,
  onNavigate,
  isOpen,
  onClose,
  onLogout,
  isLoggingOut = false,
}) => {
  // Define menu items tailored per role
  const getNavItems = () => {
    switch (currentRole) {
      case 'siswa':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'materials', label: 'Materi Pembelajaran', icon: BookOpen },
          { id: 'assignments', label: 'Tugas Siswa', icon: FileText },
          { id: 'quiz', label: 'Quiz & Ujian', icon: HelpCircle },
          { id: 'grades', label: 'Nilai & Evaluasi', icon: Award },
          { id: 'progress', label: 'Progress Belajar', icon: TrendingUp },
          { id: 'calendar', label: 'Kalender Akademik', icon: Calendar },
          { id: 'attendance', label: 'Kehadiran / Absensi', icon: CheckSquare },
          { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
        ];
      case 'guru':
        return [
          { id: 'dashboard', label: 'Dashboard Guru', icon: LayoutDashboard },
          { id: 'class-grades', label: 'Rekap Nilai Kelas', icon: ClipboardList, badge: 'Baru' },
          { id: 'materials', label: 'Kelola Materi', icon: BookOpen },
          { id: 'assignments', label: 'Kelola Tugas & Nilai', icon: FileText },
          { id: 'quiz', label: 'Kelola Quiz', icon: HelpCircle },
          { id: 'quiz-monitoring', label: 'Aktivitas Quiz & Anti-Cheat', icon: Eye, badge: 'Live' },
          { id: 'grades', label: 'Koreksi & Nilai (AI)', icon: Award },
          { id: 'attendance', label: 'Absensi Siswa', icon: CheckSquare },
          { id: 'announcements', label: 'Pengumuman Kelas', icon: Megaphone },
          { id: 'calendar', label: 'Kalender Akademik', icon: Calendar },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
          { id: 'class-grades', label: 'Rekap Nilai Kelas', icon: ClipboardList },
          { id: 'admin-users', label: 'Kelola Pengguna', icon: Users },
          { id: 'admin-classes', label: 'Kelas & Mapel', icon: GraduationCap },
          { id: 'materials', label: 'Semua Materi', icon: BookOpen },
          { id: 'assignments', label: 'Semua Tugas', icon: FileText },
          { id: 'quiz', label: 'Semua Quiz', icon: HelpCircle },
          { id: 'quiz-monitoring', label: 'Log Aktivitas Sistem', icon: Eye },
          { id: 'announcements', label: 'Pengumuman Sekolah', icon: Megaphone },
          { id: 'calendar', label: 'Kalender Sekolah', icon: Calendar },
          { id: 'admin-settings', label: 'Pengaturan & Threshold', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama • {currentRole}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout Section */}
        {currentUser && onLogout && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  @{currentUser.username || currentUser.email?.split('@')[0]} • <span className="capitalize">{currentUser.role}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLogout();
                onClose();
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/70 dark:border-rose-900/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-xs active:scale-[0.98]"
              title="Keluar dari akun e-learning"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}</span>
            </button>
          </div>
        )}

        {/* Security / System Footer Note */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Terverifikasi</span>
          </div>
          <p className="text-[10px] leading-tight text-slate-400">
            Data akademik tersimpan aman di database pusat sekolah.
          </p>
        </div>
      </aside>
    </>
  );
};
