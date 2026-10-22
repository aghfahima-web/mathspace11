import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { User } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { QuizListPage } from './pages/QuizListPage';
import { QuizRunnerPage } from './pages/QuizRunnerPage';
import { QuizMonitoringPage } from './pages/QuizMonitoringPage';
import { GradesPage } from './pages/GradesPage';
import { ProgressPage } from './pages/ProgressPage';
import { CalendarPage } from './pages/CalendarPage';
import { AttendancePage } from './pages/AttendancePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminClassesPage } from './pages/AdminClassesPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { ClassGradesRecapPage } from './pages/ClassGradesRecapPage';
import { LoginPage } from './pages/LoginPage';
import { LogoutConfirmModal } from './components/common/LogoutConfirmModal';
import { ShieldAlert, ArrowLeft, UserX } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Subscribe to central store updates (localStorage and role changes)
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await store.logout();
      setShowLogoutModal(false);
      setCurrentUser(null);
      setActivePage('dashboard');
      setPageParams({});
      setIsSidebarOpen(false);
    } catch (err: any) {
      console.error('Logout error:', err);
      setLogoutError(err?.message || 'Gagal menghubungi server untuk mengakhiri sesi.');
      // Guaranteed local clearance fallback
      setTimeout(() => {
        store.setCurrentUser(null);
        setShowLogoutModal(false);
        setCurrentUser(null);
        setActivePage('dashboard');
      }, 800);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigateTo = (page: string, params: any = {}) => {
    setActivePage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Role Access Guard
  const isPageAllowed = (page: string, user: User): boolean => {
    if (user.role === 'admin') return true;

    if (user.role === 'guru') {
      const forbiddenForTeacher = ['admin-users', 'admin-classes'];
      return !forbiddenForTeacher.includes(page);
    }

    if (user.role === 'siswa') {
      const forbiddenForStudent = [
        'quiz-monitoring',
        'class-grades',
        'admin-users',
        'admin-classes',
        'admin-settings',
      ];
      return !forbiddenForStudent.includes(page);
    }

    return true;
  };

  // If not logged in, show dedicated LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setActivePage('dashboard');
        }}
      />
    );
  }

  // If user account is deactivated
  if (currentUser.status === 'inactive') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/70 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-800">
            <UserX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akun Dinonaktifkan</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Akun Anda (<strong>{currentUser.name}</strong>) telah dinonaktifkan oleh administrator sekolah. Anda tidak dapat mengakses layanan e-learning hingga akun diaktifkan kembali.
          </p>
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                await store.logout();
              } finally {
                setIsLoggingOut(false);
                setCurrentUser(null);
                setActivePage('dashboard');
              }
            }}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? 'Sedang keluar...' : 'Kembali ke Halaman Login'}
          </button>
        </div>
      </div>
    );
  }

  // If page is quiz runner, we hide standard layout for focus
  if (activePage === 'quiz-runner' && pageParams.quizId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 font-sans">
        <OfflineBanner />
        <QuizRunnerPage
          currentUser={currentUser}
          quizId={pageParams.quizId}
          onExit={() => navigateTo('quiz')}
        />
      </div>
    );
  }

  const allowed = isPageAllowed(activePage, currentUser);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onNavigate={navigateTo}
        onLogout={() => setShowLogoutModal(true)}
        isLoggingOut={isLoggingOut}
      />

      <div className="flex flex-1">
        {/* Adaptive Sidebar */}
        <Sidebar
          currentRole={currentUser.role}
          currentUser={currentUser}
          activePage={activePage}
          onNavigate={navigateTo}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={() => setShowLogoutModal(true)}
          isLoggingOut={isLoggingOut}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {!allowed ? (
            /* Unauthorized Access Error State */
            <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg animate-scale-in">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                Akses Halaman Dibatasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Akun Anda ({currentUser.name}) dengan peran <strong>{currentUser.role.toUpperCase()}</strong> tidak memiliki hak akses administratif ke menu ini.
              </p>
              <button
                onClick={() => navigateTo('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Dashboard Saya
              </button>
            </div>
          ) : (
            <>
              {activePage === 'dashboard' && (
                <DashboardPage currentUser={currentUser} onNavigate={navigateTo} />
              )}
              {activePage === 'materials' && (
                <MaterialsPage
                  currentUser={currentUser}
                  initialOpenCreate={pageParams.openCreate}
                />
              )}
              {activePage === 'assignments' && (
                <AssignmentsPage
                  currentUser={currentUser}
                  initialOpenCreate={pageParams.openCreate}
                />
              )}
              {activePage === 'quiz' && (
                <QuizListPage
                  currentUser={currentUser}
                  onNavigate={navigateTo}
                  initialOpenCreate={pageParams.openCreate}
                />
              )}
              {activePage === 'quiz-monitoring' && (
                <QuizMonitoringPage
                  initialQuizId={pageParams.quizId}
                  initialStudentId={pageParams.studentId}
                />
              )}
              {activePage === 'grades' && (
                <GradesPage currentUser={currentUser} onNavigate={navigateTo} />
              )}
              {activePage === 'class-grades' && (
                <ClassGradesRecapPage currentUser={currentUser} onNavigate={navigateTo} />
              )}
              {activePage === 'progress' && <ProgressPage currentUser={currentUser} />}
              {activePage === 'calendar' && <CalendarPage currentUser={currentUser} />}
              {activePage === 'attendance' && <AttendancePage currentUser={currentUser} />}
              {activePage === 'announcements' && <AnnouncementsPage currentUser={currentUser} />}
              {activePage === 'admin-users' && <AdminUsersPage />}
              {activePage === 'admin-classes' && <AdminClassesPage />}
              {activePage === 'admin-settings' && <AdminSettingsPage />}
            </>
          )}
        </main>
      </div>

      {/* Modern Safe In-App Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
        onConfirm={handleConfirmLogout}
        user={currentUser}
        isLoggingOut={isLoggingOut}
        error={logoutError}
      />
    </div>
  );
}
