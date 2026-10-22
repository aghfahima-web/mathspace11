import React, { useState } from 'react';
import {
  Bell,
  GraduationCap,
  Menu,
  X,
  UserCheck,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  LogOut,
  Database,
} from 'lucide-react';
import { store } from '../../services/store';
import { User, Role } from '../../types';
import { Badge } from '../common/Badge';

interface NavbarProps {
  currentUser: User;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onToggleSidebar,
  isSidebarOpen,
  onNavigate,
  onLogout,
  isLoggingOut = false,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  const notifications = store.getNotifications(currentUser.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const allUsers = store.getUsers();

  const handleRoleSwitch = (targetRole: Role) => {
    store.switchUserByRole(targetRole);
    setShowRoleMenu(false);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusText('Sinkronisasi...');
    const ok = await store.syncWithServer();
    setIsSyncing(false);
    if (ok) {
      setSyncStatusText('Sinkron!');
      setTimeout(() => setSyncStatusText(null), 2500);
    } else {
      setSyncStatusText('Gagal');
      setTimeout(() => setSyncStatusText(null), 2500);
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowRoleMenu(false);
    setShowNotifs(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleResetData = () => {
    try {
      store.initIfEmpty(true);
      window.location.reload();
    } catch (e) {
      console.warn('Error resetting demo data:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  E-LEARNING
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  SCHOOL
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                SMA Negeri Unggulan 1
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher Demo Tool, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition border border-slate-200/60 dark:border-slate-700"
              title="Ganti akun untuk menguji role lain"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Ganti Peran:</span>
              <span className="uppercase text-indigo-600 dark:text-indigo-400 font-bold">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-scale-in">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Uji Coba Multi-Role (3 Akun)
                </div>

                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      store.setCurrentUser(u);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                      currentUser.id === u.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{u.role} {u.className ? `• ${u.className}` : ''}</div>
                      </div>
                    </div>
                    {currentUser.id === u.id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}

                <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition cursor-pointer font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar dari Akun (Logout)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Data Demo Sekolah
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition relative"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-scale-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => store.markAllNotificationsAsRead(currentUser.id)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">Belum ada notifikasi.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          store.markNotificationAsRead(n.id);
                          if (n.link) onNavigate(n.link);
                          setShowNotifs(false);
                        }}
                        className={`p-2.5 rounded-xl text-xs transition cursor-pointer flex items-start gap-2.5 ${
                          !n.isRead
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/60 dark:border-indigo-900/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</h4>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Central DB Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition border border-emerald-200/60 dark:border-emerald-800"
            title="Sinkronkan data dengan database pusat"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span className="hidden xl:inline text-[11px]">
              {syncStatusText || 'Database Pusat'}
            </span>
          </button>

          {/* User Profile & Logout */}
          <div className="relative flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {/* Clickable Profile trigger */}
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
                setShowNotifs(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer text-left focus:outline-hidden"
              title="Menu Profil Akun"
              aria-label="Profil Akun"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant={
                      currentUser.role === 'admin'
                        ? 'purple'
                        : currentUser.role === 'guru'
                        ? 'primary'
                        : 'success'
                    }
                    size="sm"
                  >
                    {currentUser.role.toUpperCase()}
                  </Badge>
                  {currentUser.className && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentUser.className}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-scale-in">
                <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      @{currentUser.username || currentUser.email?.split('@')[0]}
                    </p>
                    <div className="mt-1">
                      <Badge
                        variant={
                          currentUser.role === 'admin'
                            ? 'purple'
                            : currentUser.role === 'guru'
                            ? 'primary'
                            : 'success'
                        }
                        size="sm"
                      >
                        {currentUser.role.toUpperCase()} {currentUser.className ? `• ${currentUser.className}` : ''}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium"
                  >
                    Halaman Dashboard
                  </button>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{isLoggingOut ? 'Sedang keluar...' : 'Keluar dari Akun'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Logout Action Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="ml-1 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-rose-600 dark:text-rose-400 bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 rounded-xl transition cursor-pointer font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-95"
              title="Keluar dari akun (Logout)"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
