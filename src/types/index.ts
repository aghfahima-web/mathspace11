export type Role = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  name: string;
  username?: string; // Username unik untuk login siswa & pengguna
  email: string;
  role: Role;
  avatar: string;
  className?: string; // for siswa
  nisn?: string; // Nomor Induk Siswa Nasional (Opsional)
  nip?: string; // Nomor Induk Pegawai
  phone?: string;
  status: 'active' | 'inactive';
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  totalStudents: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  teacherId: string;
  teacherName: string;
}

export interface MaterialFile {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  className: string;
  chapter: string;
  content: string;
  files: MaterialFile[];
  videoUrl?: string;
  status: 'published' | 'draft';
  publishedAt: string;
  readTimeEstimate: string;
}

export interface MaterialProgress {
  materialId: string;
  studentId: string;
  status: 'BELUM_DIBACA' | 'SEDANG_DIPELAJARI' | 'SELESAI';
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  className: string;
  deadline: string;
  instructions: string;
  attachments: MaterialFile[];
  maxScore: number;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  className: string;
  submittedAt: string;
  textAnswer: string;
  fileAttachment?: MaterialFile;
  status: 'BELUM_DIKERJAKAN' | 'SEDANG_DIKERJAKAN' | 'SUDAH_DIKUMPULKAN' | 'TERLAMBAT' | 'DINILAI';
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'PHOTO'
  | 'TEXT_AND_PHOTO';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options?: QuizOption[];
  correctAnswer?: string | string[]; // Option ID or correct text / true-false
  rubric?: string;
  maxScore: number;
  hint?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  className: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  passingGrade: number;
  randomQuestion: boolean;
  randomOption: boolean;
  attemptLimit: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  questions: QuizQuestion[];
  createdAt: string;
}

export type QuizStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'QUIZ_TIMEOUT'
  | 'INTERRUPTED'
  | 'RESUMED';

export interface QuizAnswer {
  questionId: string;
  textAnswer?: string;
  selectedOptions?: string[]; // IDs
  photoUrl?: string;
  photoCapturedAt?: string;
  savedAt: string;
  autoSaved: boolean;
  isAiEvaluated?: boolean;
  aiSuggestedScore?: number;
  aiFeedback?: string;
  aiDetectedAnswer?: string;
  aiReasoning?: string;
  finalScore?: number;
  teacherFeedback?: string;
}

export type QuizEventType =
  | 'QUIZ_START'
  | 'QUIZ_EXIT'
  | 'QUIZ_RETURN'
  | 'QUESTION_VIEW'
  | 'QUESTION_ANSWER'
  | 'ANSWER_AUTOSAVE'
  | 'CAMERA_OPEN'
  | 'CAMERA_CAPTURE'
  | 'CAMERA_CONFIRM'
  | 'CAMERA_CANCEL'
  | 'QUIZ_SUBMIT'
  | 'QUIZ_TIMEOUT'
  | 'CONNECTION_LOST'
  | 'CONNECTION_RESTORED';

export interface QuizActivityLog {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  eventType: QuizEventType;
  timestamp: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  className: string;
  startedAt: string;
  submittedAt?: string;
  status: QuizStatus;
  answers: Record<string, QuizAnswer>;
  currentQuestionIndex: number;
  totalScore?: number;
  maxPossibleScore?: number;
  percentageScore?: number;
  isPassed?: boolean;
  isGraded?: boolean;
  timeRemainingSeconds: number;
  questionOrder: string[]; // Fixed question ordering for resume consistency
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
  note?: string;
}

export interface AttendanceSession {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  className: string;
  date: string;
  teacherName: string;
  records: AttendanceRecord[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  targetClass: string;
  targetSubject?: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'ANNOUNCEMENT' | 'ACADEMIC';
  description: string;
  className: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'QUIZ' | 'GRADE' | 'ANNOUNCEMENT' | 'SYSTEM' | 'SECURITY';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface QuizMonitorThreshold {
  maxExits: number;
  maxTotalExitSeconds: number;
  maxSingleExitSeconds: number;
}

export interface GradeCategory {
  id: string;
  name: string;
  code: string; // 'TUGAS' | 'QUIZ' | 'UTS' | 'UAS' | 'PRAKTIK' | 'PROYEK'
  weight: number; // percentage, e.g. 30
  isActive: boolean;
  includeInFinalScore: boolean;
}

export interface ClassGradeConfig {
  id: string;
  className: string;
  subjectId: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  kkm: number; // Passing grade threshold, e.g. 75
  categories: GradeCategory[];
}
