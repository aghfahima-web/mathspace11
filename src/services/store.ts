import {
  User,
  Role,
  ClassRoom,
  Subject,
  Material,
  MaterialProgress,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  QuizAnswer,
  QuizActivityLog,
  QuizEventType,
  AttendanceSession,
  Announcement,
  CalendarEvent,
  AppNotification,
  QuizMonitorThreshold,
  ClassGradeConfig,
  GradeCategory,
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_MATERIALS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_QUIZZES,
  INITIAL_ATTEMPTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_NOTIFICATIONS,
  DEFAULT_THRESHOLDS,
  DEFAULT_GRADE_CONFIGS,
} from './mockData';
import { apiClient } from './api';

const STORAGE_KEYS = {
  CURRENT_USER: 'els_current_user',
  USERS: 'els_users',
  CLASSES: 'els_classes',
  SUBJECTS: 'els_subjects',
  MATERIALS: 'els_materials',
  MATERIAL_PROGRESS: 'els_material_progress',
  ASSIGNMENTS: 'els_assignments',
  SUBMISSIONS: 'els_submissions',
  QUIZZES: 'els_quizzes',
  ATTEMPTS: 'els_attempts',
  ACTIVITY_LOGS: 'els_activity_logs',
  ATTENDANCE: 'els_attendance',
  ANNOUNCEMENTS: 'els_announcements',
  CALENDAR: 'els_calendar',
  NOTIFICATIONS: 'els_notifications',
  THRESHOLDS: 'els_thresholds',
  GRADE_CONFIGS: 'els_grade_configs',
  EXAM_SCORES: 'els_exam_scores',
};

const INITIAL_EXAM_SCORES: Record<string, { uts?: number; uas?: number }> = {
  'user-siswa-2_subj-math': { uts: 92, uas: 95 },
  'user-siswa-1_subj-math': { uts: 86, uas: 88 },
  'user-siswa-4_subj-math': { uts: 89, uas: 92 },
  'user-siswa-5_subj-math': { uts: 96, uas: 98 },
  'user-siswa-3_subj-math': { uts: 78, uas: 82 },
  'user-siswa-6_subj-math': { uts: 70, uas: 74 },
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}`, e);
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('els_store_update', { detail: { key } }));
  } catch (e) {
    console.error(`Error saving localStorage for ${key}`, e);
  }
}

class SchoolDataStore {
  private listeners: Set<() => void> = new Set();
  private isSyncing: boolean = false;
  private lastSyncTime: string = new Date().toISOString();

  constructor() {
    this.initIfEmpty();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.notify());
      window.addEventListener('els_store_update', () => this.notify());
      // Re-sync when tab gains focus
      window.addEventListener('focus', () => {
        this.syncWithServer();
      });
      // Initial background sync
      setTimeout(() => {
        this.syncWithServer();
      }, 150);
      // Periodic synchronization every 15s to keep all devices in sync
      setInterval(() => {
        this.syncWithServer();
      }, 15000);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public async syncWithServer(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const serverUsers = await apiClient.fetchUsers();
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        setStorage(STORAGE_KEYS.USERS, serverUsers);

        // Verify current user status and sync updates
        const current = this.getCurrentUser();
        if (current) {
          const fresh = serverUsers.find((u) => u.id === current.id);
          if (fresh) {
            setStorage(STORAGE_KEYS.CURRENT_USER, fresh);
          }
        }
        this.lastSyncTime = new Date().toISOString();
        this.notify();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Sync with centralized server skipped/failed:', err);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  public initIfEmpty(forceReset = false) {
    if (typeof window === 'undefined') return;

    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      setStorage(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      setStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
      setStorage(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
      setStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
      setStorage(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
      setStorage(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
      setStorage(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
      setStorage(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
      setStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
      setStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
      setStorage(STORAGE_KEYS.CALENDAR, INITIAL_CALENDAR_EVENTS);
      setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      setStorage(STORAGE_KEYS.THRESHOLDS, DEFAULT_THRESHOLDS);
      setStorage(STORAGE_KEYS.GRADE_CONFIGS, DEFAULT_GRADE_CONFIGS);
      setStorage(STORAGE_KEYS.EXAM_SCORES, INITIAL_EXAM_SCORES);
      setStorage(STORAGE_KEYS.MATERIAL_PROGRESS, [
        {
          materialId: 'mat-1',
          studentId: 'user-siswa-1',
          status: 'SEDANG_DIPELAJARI',
          updatedAt: new Date().toISOString(),
        },
      ]);
      // Default to student 1 for quick initial view
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || forceReset) {
        setStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[3]); // Siswa 1
      }
      this.notify();
    }
  }

  // --- AUTHENTICATION & USERS ---
  public getCurrentUser(): User | null {
    return getStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public setCurrentUser(user: User | null): void {
    setStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.notify();
  }

  public async logout(): Promise<void> {
    try {
      await apiClient.logout();
    } catch (e) {
      console.warn('Error during logout api call:', e);
    } finally {
      this.setCurrentUser(null);
    }
  }

  public switchUserByRole(role: Role): void {
    const users = this.getUsers();
    const target = users.find((u) => u.role === role);
    if (target) {
      this.setCurrentUser(target);
    }
  }

  public getUsers(): User[] {
    return getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStorage(STORAGE_KEYS.USERS, users);
    this.notify();
  }

  public deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    setStorage(STORAGE_KEYS.USERS, users);
    this.notify();
  }

  // --- CENTRALIZED SERVER STUDENT OPERATIONS ---
  public async addStudentToCentral(payload: {
    username: string;
    initialPassword: string;
    name?: string;
    className?: string;
    nisn?: string;
    email?: string;
    phone?: string;
    createdBy?: string;
  }): Promise<{ message: string; student: User }> {
    const res = await apiClient.addStudent(payload);
    this.saveUser(res.student);
    return res;
  }

  public async updateStudentInCentral(
    id: string,
    payload: {
      username?: string;
      name?: string;
      nisn?: string;
      className?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<{ message: string; student: User }> {
    const res = await apiClient.updateStudent(id, payload);
    this.saveUser(res.student);
    return res;
  }

  public async setStudentStatusInCentral(id: string, status: 'active' | 'inactive'): Promise<{ message: string; status: string }> {
    const res = await apiClient.setStudentStatus(id, status);
    const users = this.getUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.status = status;
      this.saveUser(u);
    }
    return res;
  }

  public async resetPasswordInCentral(id: string, newPassword?: string): Promise<{ message: string; tempPassword?: string }> {
    return await apiClient.resetPassword(id, newPassword);
  }

  public async bulkImportStudentsToCentral(students: Array<{
    username?: string;
    password?: string;
    initialPassword?: string;
    name?: string;
    nisn?: string;
    className?: string;
    email?: string;
    phone?: string;
  }>) {
    const result = await apiClient.bulkImportStudents(students);
    if (result.imported && result.imported.length > 0) {
      const current = this.getUsers();
      for (const imp of result.imported) {
        const idx = current.findIndex((u) => u.id === imp.id);
        if (idx >= 0) current[idx] = imp;
        else current.push(imp);
      }
      setStorage(STORAGE_KEYS.USERS, current);
      this.notify();
    }
    return result;
  }

  // --- CLASSES & SUBJECTS ---
  public getClasses(): ClassRoom[] {
    return getStorage<ClassRoom[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  }

  public saveClass(cls: ClassRoom): void {
    const classes = this.getClasses();
    const idx = classes.findIndex((c) => c.id === cls.id);
    if (idx >= 0) classes[idx] = cls;
    else classes.push(cls);
    setStorage(STORAGE_KEYS.CLASSES, classes);
    this.notify();
  }

  public getSubjects(): Subject[] {
    return getStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  // --- MATERIALS ---
  public getMaterials(): Material[] {
    return getStorage<Material[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  }

  public getMaterialById(id: string): Material | undefined {
    return this.getMaterials().find((m) => m.id === id);
  }

  public saveMaterial(mat: Material): void {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === mat.id);
    if (idx >= 0) materials[idx] = mat;
    else materials.push(mat);
    setStorage(STORAGE_KEYS.MATERIALS, materials);
    this.notify();
  }

  public deleteMaterial(id: string): void {
    const materials = this.getMaterials().filter((m) => m.id !== id);
    setStorage(STORAGE_KEYS.MATERIALS, materials);
    this.notify();
  }

  public getMaterialProgress(materialId: string, studentId: string): MaterialProgress | null {
    const list = getStorage<MaterialProgress[]>(STORAGE_KEYS.MATERIAL_PROGRESS, []);
    return list.find((p) => p.materialId === materialId && p.studentId === studentId) || null;
  }

  public setMaterialProgress(
    materialId: string,
    studentId: string,
    status: 'BELUM_DIBACA' | 'SEDANG_DIPELAJARI' | 'SELESAI'
  ): void {
    const list = getStorage<MaterialProgress[]>(STORAGE_KEYS.MATERIAL_PROGRESS, []);
    const idx = list.findIndex((p) => p.materialId === materialId && p.studentId === studentId);
    const item: MaterialProgress = {
      materialId,
      studentId,
      status,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    setStorage(STORAGE_KEYS.MATERIAL_PROGRESS, list);
    this.notify();
  }

  // --- ASSIGNMENTS ---
  public getAssignments(): Assignment[] {
    return getStorage<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  }

  public getAssignmentById(id: string): Assignment | undefined {
    return this.getAssignments().find((a) => a.id === id);
  }

  public saveAssignment(asg: Assignment): void {
    const asgs = this.getAssignments();
    const idx = asgs.findIndex((a) => a.id === asg.id);
    if (idx >= 0) asgs[idx] = asg;
    else asgs.push(asg);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgs);
    this.notify();
  }

  public deleteAssignment(id: string): void {
    const asgs = this.getAssignments().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgs);
    this.notify();
  }

  public getSubmissions(assignmentId?: string): AssignmentSubmission[] {
    const subs = getStorage<AssignmentSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    return assignmentId ? subs.filter((s) => s.assignmentId === assignmentId) : subs;
  }

  public saveSubmission(sub: AssignmentSubmission): void {
    const subs = this.getSubmissions();
    const idx = subs.findIndex((s) => s.id === sub.id);
    if (idx >= 0) subs[idx] = sub;
    else subs.push(sub);
    setStorage(STORAGE_KEYS.SUBMISSIONS, subs);
    this.notify();
  }

  // --- QUIZZES ---
  public getQuizzes(): Quiz[] {
    return getStorage<Quiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.getQuizzes().find((q) => q.id === id);
  }

  public saveQuiz(quiz: Quiz): void {
    const quizzes = this.getQuizzes();
    const idx = quizzes.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) quizzes[idx] = quiz;
    else quizzes.push(quiz);
    setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.notify();
  }

  public deleteQuiz(id: string): void {
    const quizzes = this.getQuizzes().filter((q) => q.id !== id);
    setStorage(STORAGE_KEYS.QUIZZES, quizzes);
    this.notify();
  }

  // --- QUIZ ATTEMPTS & RESUME ---
  public getAttempts(quizId?: string): QuizAttempt[] {
    const attempts = getStorage<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
    return quizId ? attempts.filter((a) => a.quizId === quizId) : attempts;
  }

  public getStudentAttempt(quizId: string, studentId: string): QuizAttempt | undefined {
    return this.getAttempts(quizId).find((a) => a.studentId === studentId);
  }

  /**
   * Resumes existing attempt or initializes a fresh one without reshuffling in-progress.
   */
  public startOrResumeQuizAttempt(quiz: Quiz, student: User): QuizAttempt {
    const existing = this.getStudentAttempt(quiz.id, student.id);
    if (existing && existing.status !== 'NOT_STARTED') {
      // Record resume event
      this.logQuizActivity(quiz.id, student.id, student.name, 'QUESTION_VIEW', 0, {
        action: 'RESUME_ATTEMPT',
        currentIndex: existing.currentQuestionIndex,
      });
      return existing;
    }

    // Determine initial question order (respecting randomQuestion setting)
    let orderedQuestions = [...quiz.questions];
    if (quiz.randomQuestion) {
      // Deterministic pseudo-shuffle so it stays stable for this attempt
      orderedQuestions = orderedQuestions.sort(() => Math.random() - 0.5);
    }
    const questionOrder = orderedQuestions.map((q) => q.id);

    const newAttempt: QuizAttempt = {
      id: `att-${student.id}-${Date.now()}`,
      quizId: quiz.id,
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      className: student.className || 'XII IPA 1',
      startedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
      timeRemainingSeconds: quiz.durationMinutes * 60,
      answers: {},
      questionOrder,
    };

    const attempts = this.getAttempts();
    attempts.push(newAttempt);
    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    // Log QUIZ_START event
    this.logQuizActivity(quiz.id, student.id, student.name, 'QUIZ_START', 0, {
      totalQuestions: quiz.questions.length,
      durationMinutes: quiz.durationMinutes,
    });

    this.notify();
    return newAttempt;
  }

  public saveQuizAnswer(quizId: string, studentId: string, answer: QuizAnswer): void {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.quizId === quizId && a.studentId === studentId);
    if (!attempt) return;

    attempt.answers[answer.questionId] = {
      ...answer,
      savedAt: new Date().toISOString(),
      autoSaved: true,
    };

    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    // Log autosave event
    this.logQuizActivity(quizId, studentId, attempt.studentName, 'ANSWER_AUTOSAVE', 0, {
      questionId: answer.questionId,
    });
  }

  public updateAttemptProgress(
    quizId: string,
    studentId: string,
    currentQuestionIndex: number,
    timeRemainingSeconds: number
  ): void {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.quizId === quizId && a.studentId === studentId);
    if (!attempt || attempt.status === 'SUBMITTED' || attempt.status === 'QUIZ_TIMEOUT') return;

    attempt.currentQuestionIndex = currentQuestionIndex;
    attempt.timeRemainingSeconds = timeRemainingSeconds;
    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);
  }

  public submitQuizAttempt(quizId: string, studentId: string, isTimeout = false): QuizAttempt | undefined {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.quizId === quizId && a.studentId === studentId);
    const quiz = this.getQuizById(quizId);
    if (!attempt || !quiz) return undefined;

    attempt.status = isTimeout ? 'QUIZ_TIMEOUT' : 'SUBMITTED';
    attempt.submittedAt = new Date().toISOString();

    // Auto-calculate objective scores
    let totalScore = 0;
    let maxPossibleScore = 0;
    let hasOpenQuestions = false;

    quiz.questions.forEach((q) => {
      maxPossibleScore += q.maxScore;
      const ans = attempt.answers[q.id];

      if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const studentChoice = ans?.selectedOptions?.[0];
        if (studentChoice && studentChoice === q.correctAnswer) {
          totalScore += q.maxScore;
          if (ans) ans.finalScore = q.maxScore;
        } else if (ans) {
          ans.finalScore = 0;
        }
      } else if (q.type === 'MULTIPLE_CHOICE') {
        const studentChoices = (ans?.selectedOptions || []).sort();
        const correctChoices = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
        const isMatch =
          studentChoices.length === correctChoices.length &&
          studentChoices.every((val, idx) => val === correctChoices[idx]);
        if (isMatch) {
          totalScore += q.maxScore;
          if (ans) ans.finalScore = q.maxScore;
        } else if (ans) {
          ans.finalScore = 0;
        }
      } else if (q.type === 'SHORT_ANSWER') {
        const cleanAnswer = (ans?.textAnswer || '').trim().toLowerCase();
        const expected = String(q.correctAnswer || '').trim().toLowerCase();
        if (cleanAnswer && cleanAnswer === expected) {
          totalScore += q.maxScore;
          if (ans) ans.finalScore = q.maxScore;
        } else if (ans) {
          ans.finalScore = 0;
        }
      } else {
        // Essay / Photo / Text+Photo require grading
        hasOpenQuestions = true;
        if (ans?.finalScore) {
          totalScore += ans.finalScore;
        }
      }
    });

    attempt.totalScore = totalScore;
    attempt.maxPossibleScore = maxPossibleScore;
    attempt.percentageScore = Math.round((totalScore / (maxPossibleScore || 1)) * 100);
    attempt.isPassed = (attempt.percentageScore || 0) >= quiz.passingGrade;
    attempt.isGraded = !hasOpenQuestions;

    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);

    // Log submit event
    this.logQuizActivity(
      quizId,
      studentId,
      attempt.studentName,
      isTimeout ? 'QUIZ_TIMEOUT' : 'QUIZ_SUBMIT',
      0,
      {
        totalScore,
        maxPossibleScore,
        answeredCount: Object.keys(attempt.answers).length,
      }
    );

    // Add notification
    this.addNotification({
      id: `notif-${Date.now()}`,
      userId: studentId,
      title: isTimeout ? 'Waktu Quiz Habis' : 'Quiz Berhasil Dikumpulkan',
      message: `Jawaban untuk quiz "${quiz.title}" telah tersimpan secara aman.`,
      type: 'QUIZ',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: 'quiz',
    });

    this.notify();
    return attempt;
  }

  public updateTeacherQuizGrading(
    attemptId: string,
    questionId: string,
    score: number,
    feedback: string,
    isAiEvaluated = false,
    aiData?: { suggestedScore?: number; suggestedFeedback?: string; reasoning?: string }
  ): void {
    const attempts = this.getAttempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) return;

    if (!attempt.answers[questionId]) {
      attempt.answers[questionId] = {
        questionId,
        savedAt: new Date().toISOString(),
        autoSaved: false,
      };
    }

    const ans = attempt.answers[questionId];
    ans.finalScore = score;
    ans.teacherFeedback = feedback;
    if (isAiEvaluated && aiData) {
      ans.isAiEvaluated = true;
      ans.aiSuggestedScore = aiData.suggestedScore;
      ans.aiFeedback = aiData.suggestedFeedback;
      ans.aiReasoning = aiData.reasoning;
    }

    // Recompute total score
    const quiz = this.getQuizById(attempt.quizId);
    if (quiz) {
      let total = 0;
      quiz.questions.forEach((q) => {
        total += attempt.answers[q.id]?.finalScore || 0;
      });
      attempt.totalScore = total;
      attempt.percentageScore = Math.round((total / (attempt.maxPossibleScore || 100)) * 100);
      attempt.isPassed = (attempt.percentageScore || 0) >= quiz.passingGrade;
      attempt.isGraded = true;
    }

    setStorage(STORAGE_KEYS.ATTEMPTS, attempts);
    this.notify();
  }

  // --- QUIZ ACTIVITY LOGGING & MONITORING ---
  public getActivityLogs(quizId?: string): QuizActivityLog[] {
    const logs = getStorage<QuizActivityLog[]>(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    return quizId ? logs.filter((l) => l.quizId === quizId) : logs;
  }

  public logQuizActivity(
    quizId: string,
    studentId: string,
    studentName: string,
    eventType: QuizEventType,
    durationSeconds = 0,
    metadata: Record<string, any> = {}
  ): void {
    const logs = this.getActivityLogs();
    const newLog: QuizActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quizId,
      studentId,
      studentName,
      eventType,
      timestamp: new Date().toISOString(),
      durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
      metadata,
    };
    logs.push(newLog);
    setStorage(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    this.notify();
  }

  public getThresholds(): QuizMonitorThreshold {
    return getStorage<QuizMonitorThreshold>(STORAGE_KEYS.THRESHOLDS, DEFAULT_THRESHOLDS);
  }

  public saveThresholds(thresholds: QuizMonitorThreshold): void {
    setStorage(STORAGE_KEYS.THRESHOLDS, thresholds);
    this.notify();
  }

  // --- ATTENDANCE ---
  public getAttendanceSessions(): AttendanceSession[] {
    return getStorage<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public saveAttendanceSession(session: AttendanceSession): void {
    const sessions = this.getAttendanceSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.push(session);
    setStorage(STORAGE_KEYS.ATTENDANCE, sessions);
    this.notify();
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(): Announcement[] {
    return getStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  public saveAnnouncement(ann: Announcement): void {
    const anns = this.getAnnouncements();
    const idx = anns.findIndex((a) => a.id === ann.id);
    if (idx >= 0) anns[idx] = ann;
    else anns.unshift(ann);
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, anns);
    this.notify();
  }

  public deleteAnnouncement(id: string): void {
    const anns = this.getAnnouncements().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, anns);
    this.notify();
  }

  // --- CALENDAR ---
  public getCalendarEvents(): CalendarEvent[] {
    return getStorage<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_CALENDAR_EVENTS);
  }

  public saveCalendarEvent(event: CalendarEvent): void {
    const events = this.getCalendarEvents();
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) events[idx] = event;
    else events.push(event);
    setStorage(STORAGE_KEYS.CALENDAR, events);
    this.notify();
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId?: string): AppNotification[] {
    const notifs = getStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return userId ? notifs.filter((n) => n.userId === userId) : notifs;
  }

  public addNotification(notif: AppNotification): void {
    const notifs = this.getNotifications();
    notifs.unshift(notif);
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.notify();
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const item = notifs.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notify();
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    setStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.notify();
  }

  // --- GRADE CONFIGURATION & RECAP ---
  public getClassGradeConfigs(): ClassGradeConfig[] {
    return getStorage<ClassGradeConfig[]>(STORAGE_KEYS.GRADE_CONFIGS, DEFAULT_GRADE_CONFIGS);
  }

  public getClassGradeConfig(className: string, subjectId: string): ClassGradeConfig {
    const configs = this.getClassGradeConfigs();
    const found = configs.find((c) => c.className === className && c.subjectId === subjectId);
    if (found) return found;

    const defaultConfig: ClassGradeConfig = {
      id: `cfg-${className.toLowerCase().replace(/\s+/g, '-')}-${subjectId}`,
      className,
      subjectId,
      academicYear: '2026/2027',
      semester: 'Ganjil',
      kkm: 75,
      categories: [
        { id: 'cat-tugas', name: 'Tugas Harian & Proyek', code: 'TUGAS', weight: 30, isActive: true, includeInFinalScore: true },
        { id: 'cat-quiz', name: 'Quiz & Formatif', code: 'QUIZ', weight: 25, isActive: true, includeInFinalScore: true },
        { id: 'cat-uts', name: 'PTS (Sumatif Tengah Semester)', code: 'UTS', weight: 20, isActive: true, includeInFinalScore: true },
        { id: 'cat-uas', name: 'PAS (Sumatif Akhir Semester)', code: 'UAS', weight: 25, isActive: true, includeInFinalScore: true },
      ],
    };
    return defaultConfig;
  }

  public saveClassGradeConfig(config: ClassGradeConfig): void {
    const configs = this.getClassGradeConfigs();
    const idx = configs.findIndex((c) => c.className === config.className && c.subjectId === config.subjectId);
    if (idx >= 0) configs[idx] = config;
    else configs.push(config);
    setStorage(STORAGE_KEYS.GRADE_CONFIGS, configs);
    this.notify();
  }

  public getExamScores(): Record<string, { uts?: number; uas?: number }> {
    return getStorage<Record<string, { uts?: number; uas?: number }>>(STORAGE_KEYS.EXAM_SCORES, INITIAL_EXAM_SCORES);
  }

  public saveStudentExamScore(studentId: string, subjectId: string, examType: 'uts' | 'uas', score: number): void {
    const scores = this.getExamScores();
    const key = `${studentId}_${subjectId}`;
    if (!scores[key]) scores[key] = {};
    scores[key][examType] = score;
    setStorage(STORAGE_KEYS.EXAM_SCORES, scores);
    this.notify();
  }

  public updateStudentSubmissionScore(submissionId: string, score: number, feedback?: string): void {
    const subs = this.getSubmissions();
    const sub = subs.find((s) => s.id === submissionId);
    if (sub) {
      sub.score = score;
      if (feedback !== undefined) sub.feedback = feedback;
      sub.status = 'DINILAI';
      sub.gradedAt = new Date().toISOString();
      setStorage(STORAGE_KEYS.SUBMISSIONS, subs);
      this.notify();
    }
  }
}

export const store = new SchoolDataStore();
