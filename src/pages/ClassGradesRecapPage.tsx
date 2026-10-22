import React, { useState, useMemo, useRef } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Sliders,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  ChevronDown,
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  User as UserIcon,
  Eye,
  FileText,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, ClassGradeConfig, GradeCategory, AssignmentSubmission, QuizAttempt } from '../types';
import { store } from '../services/store';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

interface ClassGradesRecapPageProps {
  currentUser: User;
  onNavigate: (page: string, params?: any) => void;
}

export const ClassGradesRecapPage: React.FC<ClassGradesRecapPageProps> = ({
  currentUser,
  onNavigate,
}) => {
  const classes = store.getClasses();
  const allSubjects = store.getSubjects();

  // If teacher, only allow subjects they teach
  const teacherSubjects = useMemo(() => {
    if (currentUser.role === 'guru') {
      const allowed = allSubjects.filter((s) => s.teacherId === currentUser.id);
      return allowed.length > 0 ? allowed : allSubjects; // fallback if unassigned
    }
    return allSubjects;
  }, [allSubjects, currentUser]);

  // Filter states
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026/2027');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedClass, setSelectedClass] = useState<string>('XII IPA 1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    teacherSubjects[0]?.id || 'subj-math'
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL'); // ALL, HARIAN, PTS, PAS

  // Search & Sorting & View Options
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'finalScore' | 'rank'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showRankColumn, setShowRankColumn] = useState(true);

  // Modals & Drawers
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<User | null>(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editingStudentScore, setEditingStudentScore] = useState<{
    student: User;
    type: 'assignment' | 'uts' | 'uas';
    itemId?: string;
    itemName: string;
    currentScore: number;
  } | null>(null);
  const [quickScoreInput, setQuickScoreInput] = useState<number>(85);
  const [quickFeedbackInput, setQuickFeedbackInput] = useState<string>('');

  // Active Grade Configuration for this Class & Subject
  const gradeConfig: ClassGradeConfig = useMemo(() => {
    return store.getClassGradeConfig(selectedClass, selectedSubjectId);
  }, [selectedClass, selectedSubjectId]);

  // Editing Weight Config State
  const [tempConfig, setTempConfig] = useState<ClassGradeConfig>(gradeConfig);

  // Load related data from store
  const allUsers = store.getUsers();
  const studentsInClass = useMemo(() => {
    return allUsers.filter((u) => u.role === 'siswa' && u.className === selectedClass);
  }, [allUsers, selectedClass]);

  const assignmentsInSubject = useMemo(() => {
    return store
      .getAssignments()
      .filter((a) => a.className === selectedClass && a.subjectId === selectedSubjectId);
  }, [selectedClass, selectedSubjectId]);

  const quizzesInSubject = useMemo(() => {
    return store
      .getQuizzes()
      .filter((q) => q.className === selectedClass && q.subjectId === selectedSubjectId);
  }, [selectedClass, selectedSubjectId]);

  const submissions = store.getSubmissions();
  const attempts = store.getAttempts();
  const examScores = store.getExamScores();

  const selectedSubject = allSubjects.find((s) => s.id === selectedSubjectId);

  // --- CALCULATION ENGINE ---
  // Compute recapitulation rows with clean non-destructive averaging
  const recapData = useMemo(() => {
    const rawRows = studentsInClass.map((student) => {
      // 1. Assignments scores
      const taskScores: Record<
        string,
        { score?: number; status: 'DINILAI' | 'BELUM_DINILAI' | 'BELUM_KUMPUL' }
      > = {};
      let totalTaskScore = 0;
      let gradedTaskCount = 0;
      let submittedTaskCount = 0;

      assignmentsInSubject.forEach((asg) => {
        const sub = submissions.find(
          (s) => s.assignmentId === asg.id && s.studentId === student.id
        );
        if (sub) {
          submittedTaskCount++;
          if (sub.status === 'DINILAI' && typeof sub.score === 'number') {
            taskScores[asg.id] = { score: sub.score, status: 'DINILAI' };
            totalTaskScore += sub.score;
            gradedTaskCount++;
          } else {
            taskScores[asg.id] = { status: 'BELUM_DINILAI' };
          }
        } else {
          taskScores[asg.id] = { status: 'BELUM_KUMPUL' };
        }
      });

      const avgTask = gradedTaskCount > 0 ? Math.round(totalTaskScore / gradedTaskCount) : null;

      // 2. Quiz scores
      const quizScores: Record<
        string,
        { score?: number; percentageScore?: number; status: 'SELESAI' | 'BELUM_IKUT' }
      > = {};
      let totalQuizPercentage = 0;
      let completedQuizCount = 0;

      quizzesInSubject.forEach((qz) => {
        const att = attempts.find((a) => a.quizId === qz.id && a.studentId === student.id);
        if (
          att &&
          (att.status === 'SUBMITTED' || att.status === 'QUIZ_TIMEOUT') &&
          typeof att.percentageScore === 'number'
        ) {
          quizScores[qz.id] = {
            score: att.totalScore,
            percentageScore: att.percentageScore,
            status: 'SELESAI',
          };
          totalQuizPercentage += att.percentageScore;
          completedQuizCount++;
        } else {
          quizScores[qz.id] = { status: 'BELUM_IKUT' };
        }
      });

      const avgQuiz =
        completedQuizCount > 0 ? Math.round(totalQuizPercentage / completedQuizCount) : null;

      // 3. Exam scores (UTS & UAS)
      const examKey = `${student.id}_${selectedSubjectId}`;
      const examRec = examScores[examKey] || {};
      const utsVal = typeof examRec.uts === 'number' ? examRec.uts : null;
      const uasVal = typeof examRec.uas === 'number' ? examRec.uas : null;

      // 4. Calculate Final Weighted Score based on Active Categories
      // Formula: Sum(Category Avg * Weight Decimal)
      let weightedSum = 0;
      let activeWeightUsed = 0;
      let hasAnyGrade = false;
      let hasMissingActiveCategory = false;

      gradeConfig.categories
        .filter((c) => c.isActive && c.includeInFinalScore)
        .forEach((cat) => {
          const weightDecimal = cat.weight / 100;

          if (cat.code === 'TUGAS') {
            if (avgTask !== null) {
              weightedSum += avgTask * weightDecimal;
              activeWeightUsed += weightDecimal;
              hasAnyGrade = true;
            } else if (assignmentsInSubject.length > 0) {
              hasMissingActiveCategory = true;
            }
          } else if (cat.code === 'QUIZ') {
            if (avgQuiz !== null) {
              weightedSum += avgQuiz * weightDecimal;
              activeWeightUsed += weightDecimal;
              hasAnyGrade = true;
            } else if (quizzesInSubject.length > 0) {
              hasMissingActiveCategory = true;
            }
          } else if (cat.code === 'UTS') {
            if (utsVal !== null) {
              weightedSum += utsVal * weightDecimal;
              activeWeightUsed += weightDecimal;
              hasAnyGrade = true;
            } else {
              hasMissingActiveCategory = true;
            }
          } else if (cat.code === 'UAS') {
            if (uasVal !== null) {
              weightedSum += uasVal * weightDecimal;
              activeWeightUsed += weightDecimal;
              hasAnyGrade = true;
            } else {
              hasMissingActiveCategory = true;
            }
          }
        });

      // Normalize if some categories have not happened yet, or keep weighted sum
      let finalScore: number | null = null;
      if (hasAnyGrade) {
        finalScore = Math.round(weightedSum);
      }

      // Predicate determination
      let predicate: 'A' | 'B' | 'C' | 'D' | '-' = '-';
      if (finalScore !== null) {
        if (finalScore >= 90) predicate = 'A';
        else if (finalScore >= 80) predicate = 'B';
        else if (finalScore >= 70) predicate = 'C';
        else predicate = 'D';
      }

      const isPassed = finalScore !== null ? finalScore >= gradeConfig.kkm : null;
      const isComplete = !hasMissingActiveCategory && hasAnyGrade;

      return {
        student,
        taskScores,
        avgTask,
        quizScores,
        avgQuiz,
        uts: utsVal,
        uas: uasVal,
        finalScore,
        predicate,
        isPassed,
        isComplete,
      };
    });

    // 5. Compute Competition Ranking (1, 2, 2, 4) among students with valid finalScore
    const scoredStudents = rawRows
      .filter((r) => r.finalScore !== null)
      .sort((a, b) => (b.finalScore as number) - (a.finalScore as number));

    const rankMap = new Map<string, number>();
    let currentRank = 1;
    for (let i = 0; i < scoredStudents.length; i++) {
      if (i > 0 && scoredStudents[i].finalScore === scoredStudents[i - 1].finalScore) {
        // Same score gets same rank
        rankMap.set(scoredStudents[i].student.id, rankMap.get(scoredStudents[i - 1].student.id)!);
      } else {
        currentRank = i + 1;
        rankMap.set(scoredStudents[i].student.id, currentRank);
      }
    }

    return rawRows.map((row) => ({
      ...row,
      rank: row.finalScore !== null ? rankMap.get(row.student.id) || '-' : '-',
    }));
  }, [
    studentsInClass,
    assignmentsInSubject,
    quizzesInSubject,
    submissions,
    attempts,
    examScores,
    gradeConfig,
    selectedSubjectId,
  ]);

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let result = recapData.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchName = r.student.name.toLowerCase().includes(q);
      const matchNis = (r.student.nisn || '').includes(q);
      return matchName || matchNis;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.student.name.localeCompare(b.student.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'finalScore') {
        const scoreA = a.finalScore ?? -999;
        const scoreB = b.finalScore ?? -999;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      if (sortBy === 'rank') {
        const rankA = typeof a.rank === 'number' ? a.rank : 9999;
        const rankB = typeof b.rank === 'number' ? b.rank : 9999;
        return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
      }
      return 0;
    });

    return result;
  }, [recapData, searchQuery, sortBy, sortOrder]);

  // --- CLASS STATS ---
  const stats = useMemo(() => {
    const totalStudents = studentsInClass.length;
    const scoredList = recapData.filter((r) => r.finalScore !== null);
    const scoredCount = scoredList.length;

    const scores = scoredList.map((r) => r.finalScore as number);
    const classAvg =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const highest = scores.length > 0 ? Math.max(...scores) : null;
    const lowest = scores.length > 0 ? Math.min(...scores) : null;

    const passedCount = scoredList.filter((r) => r.isPassed === true).length;
    const failedCount = scoredList.filter((r) => r.isPassed === false).length;
    const incompleteCount = recapData.filter((r) => !r.isComplete).length;

    // Distribution ranges: 0-59, 60-69, 70-79, 80-89, 90-100
    const distribution = {
      under60: scores.filter((s) => s < 60).length,
      r60to69: scores.filter((s) => s >= 60 && s <= 69).length,
      r70to79: scores.filter((s) => s >= 70 && s <= 79).length,
      r80to89: scores.filter((s) => s >= 80 && s <= 89).length,
      r90to100: scores.filter((s) => s >= 90).length,
    };

    // Component Averages across class
    const taskAvgs = recapData.map((r) => r.avgTask).filter((v): v is number => v !== null);
    const quizAvgs = recapData.map((r) => r.avgQuiz).filter((v): v is number => v !== null);
    const utsAvgs = recapData.map((r) => r.uts).filter((v): v is number => v !== null);
    const uasAvgs = recapData.map((r) => r.uas).filter((v): v is number => v !== null);

    const compAvgTask =
      taskAvgs.length > 0 ? Math.round(taskAvgs.reduce((a, b) => a + b, 0) / taskAvgs.length) : null;
    const compAvgQuiz =
      quizAvgs.length > 0 ? Math.round(quizAvgs.reduce((a, b) => a + b, 0) / quizAvgs.length) : null;
    const compAvgUts =
      utsAvgs.length > 0 ? Math.round(utsAvgs.reduce((a, b) => a + b, 0) / utsAvgs.length) : null;
    const compAvgUas =
      uasAvgs.length > 0 ? Math.round(uasAvgs.reduce((a, b) => a + b, 0) / uasAvgs.length) : null;

    return {
      totalStudents,
      scoredCount,
      classAvg,
      highest,
      lowest,
      passedCount,
      failedCount,
      incompleteCount,
      distribution,
      compAvgTask,
      compAvgQuiz,
      compAvgUts,
      compAvgUas,
    };
  }, [studentsInClass, recapData]);

  // --- EXPORT TO EXCEL (.xlsx) ---
  const handleExportExcel = () => {
    try {
      const subjectName = selectedSubject?.name || 'Mata Pelajaran';

      // 1. Prepare Header Information
      const metaInfo = [
        ['E-LEARNING SCHOOL — REKAPITULASI NILAI KELAS'],
        ['Sekolah', 'SMA Negeri Unggulan 1'],
        ['Tahun Ajaran', selectedAcademicYear, 'Semester', selectedSemester],
        ['Kelas', selectedClass, 'Mata Pelajaran', subjectName],
        ['Guru Pengampu', currentUser.name, 'Tanggal Unduh', new Date().toLocaleDateString('id-ID')],
        ['Kriteria Ketuntasan Minimal (KKM)', `${gradeConfig.kkm}`],
        [], // empty row
      ];

      // 2. Prepare Table Columns
      const headers = [
        'No',
        'Nama Siswa',
        'NISN',
        ...assignmentsInSubject.map((a, idx) => `Tugas ${idx + 1}`),
        'Rata-rata Tugas',
        ...quizzesInSubject.map((q, idx) => `Quiz ${idx + 1}`),
        'Rata-rata Quiz',
        'PTS (UTS)',
        'PAS (UAS)',
        'Nilai Akhir',
        'Predikat',
        'Ketuntasan',
        'Peringkat',
      ];

      // 3. Prepare Rows
      const rows = processedRows.map((r, i) => {
        const taskCols = assignmentsInSubject.map((asg) => {
          const t = r.taskScores[asg.id];
          if (!t || t.status === 'BELUM_KUMPUL') return 'Belum Kumpul';
          if (t.status === 'BELUM_DINILAI') return 'Belum Dinilai';
          return t.score ?? '-';
        });

        const quizCols = quizzesInSubject.map((qz) => {
          const q = r.quizScores[qz.id];
          if (!q || q.status === 'BELUM_IKUT') return 'Belum Ikut';
          return q.percentageScore ?? '-';
        });

        return [
          i + 1,
          r.student.name,
          r.student.nisn || '-',
          ...taskCols,
          r.avgTask ?? '-',
          ...quizCols,
          r.avgQuiz ?? '-',
          r.uts ?? '-',
          r.uas ?? '-',
          r.finalScore ?? '-',
          r.predicate,
          r.isPassed === true ? 'Tuntas' : r.isPassed === false ? 'Remedial' : 'Belum Lengkap',
          r.rank,
        ];
      });

      // 4. Build Worksheet
      const worksheetData = [...metaInfo, headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 28 },
        { wch: 15 },
        ...assignmentsInSubject.map(() => ({ wch: 12 })),
        { wch: 16 },
        ...quizzesInSubject.map(() => ({ wch: 12 })),
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 14 },
        { wch: 10 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_${selectedClass}`);

      // Export file
      const fileName = `Rekap_Nilai_${selectedClass.replace(/\s+/g, '_')}_${subjectName.replace(
        /\s+/g,
        '_'
      )}_${selectedSemester}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Gagal menghasilkan file Excel.');
    }
  };

  // --- EXPORT / PRINT PDF REPORT ---
  const handlePrintPDF = () => {
    window.print();
  };

  // --- SAVE WEIGHT & CATEGORY CONFIG ---
  const handleSaveWeightConfig = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate active categories weight sum == 100%
    const totalActiveWeight = tempConfig.categories
      .filter((c) => c.isActive && c.includeInFinalScore)
      .reduce((sum, c) => sum + Number(c.weight || 0), 0);

    if (totalActiveWeight !== 100) {
      alert(
        `Total bobot kategori yang aktif dan masuk perhitungan harus tepat 100% (Total saat ini: ${totalActiveWeight}%). Silakan sesuaikan kembali.`
      );
      return;
    }

    store.saveClassGradeConfig(tempConfig);
    setIsWeightModalOpen(false);
  };

  // --- QUICK SCORE EDIT BY TEACHER ---
  const handleSaveQuickScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentScore) return;

    if (editingStudentScore.type === 'assignment' && editingStudentScore.itemId) {
      // Find submission or create one if not yet submitted
      const existingSub = submissions.find(
        (s) =>
          s.assignmentId === editingStudentScore.itemId &&
          s.studentId === editingStudentScore.student.id
      );

      if (existingSub) {
        store.updateStudentSubmissionScore(
          existingSub.id,
          quickScoreInput,
          quickFeedbackInput || undefined
        );
      } else {
        const newSub: AssignmentSubmission = {
          id: `sub-${Date.now()}`,
          assignmentId: editingStudentScore.itemId,
          studentId: editingStudentScore.student.id,
          studentName: editingStudentScore.student.name,
          studentAvatar: editingStudentScore.student.avatar,
          className: selectedClass,
          submittedAt: new Date().toISOString(),
          textAnswer: '(Penilaian Langsung oleh Guru)',
          status: 'DINILAI',
          score: quickScoreInput,
          feedback: quickFeedbackInput,
          gradedAt: new Date().toISOString(),
          gradedBy: currentUser.name,
        };
        store.saveSubmission(newSub);
      }
    } else if (
      editingStudentScore.type === 'uts' ||
      editingStudentScore.type === 'uas'
    ) {
      store.saveStudentExamScore(
        editingStudentScore.student.id,
        selectedSubjectId,
        editingStudentScore.type,
        quickScoreInput
      );
    }

    setIsQuickEditOpen(false);
    setEditingStudentScore(null);
  };

  // Toggle sort helper
  const handleSortToggle = (field: 'name' | 'finalScore' | 'rank') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:m-0">
      {/* Page Header (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Rekap Nilai Keseluruhan Siswa per Kelas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Buku nilai digital terpadu: integrasi nilai tugas, quiz, UTS/UAS, pembobotan otomatis, dan ekspor dokumen resmi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setTempConfig(gradeConfig);
              setIsWeightModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Atur Bobot & Kategori
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            Cetak / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Header (Visible only in Print/PDF) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-slate-900">
        <div className="text-center">
          <h2 className="text-lg font-black uppercase tracking-wider">
            PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA
          </h2>
          <h1 className="text-xl font-extrabold uppercase">
            SMA NEGERI UNGGULAN 1 — BUKU REKAPITULASI NILAI KELAS
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Jl. Pendidikan Karakter No. 1 • Telp (021) 7891234 • Email: kurikulum@sekolah.sch.id
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
          <div>
            Kelas: <strong className="font-bold">{selectedClass}</strong> • Mata Pelajaran:{' '}
            <strong className="font-bold">{selectedSubject?.name}</strong>
          </div>
          <div className="text-right">
            Tahun Ajaran: {selectedAcademicYear} ({selectedSemester}) • KKM: {gradeConfig.kkm}
          </div>
          <div>Guru Pengampu: {currentUser.name}</div>
          <div className="text-right">
            Tanggal Cetak:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* FILTER BAR (Hidden when printing) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tahun Ajaran */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tahun Ajaran
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e: any) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          {/* Kelas */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran (Restricted by Teacher Scope) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Mata Pelajaran (Kewenangan)
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {teacherSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Periode Penilaian */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Periode Penilaian
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Komponen (Lengkap)</option>
              <option value="HARIAN">Penilaian Harian (Tugas & Kuis)</option>
              <option value="PTS">Sumatif Tengah Semester (PTS)</option>
              <option value="PAS">Sumatif Akhir Semester (PAS)</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={() => {
            setSelectedClass('XII IPA 1');
            setSelectedSubjectId(teacherSubjects[0]?.id || 'subj-math');
            setSelectedPeriod('ALL');
            setSearchQuery('');
          }}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1 self-end pb-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filter
        </button>
      </div>

      {/* STATISTIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 print:grid-cols-4">
        {/* Total Siswa */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Siswa
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {stats.totalStudents}
          </div>
          <span className="text-[10px] text-slate-400">Rombel Aktif</span>
        </div>

        {/* Sudah Dinilai */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ada Nilai
          </span>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {stats.scoredCount}
          </div>
          <span className="text-[10px] text-slate-400">Siswa Terekam</span>
        </div>

        {/* Rata-rata Kelas */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Kelas
          </span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {stats.classAvg ?? '-'}
          </div>
          <span className="text-[10px] text-slate-400">Skala 0-100</span>
        </div>

        {/* Nilai Tertinggi */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Tertinggi
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.highest ?? '-'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Skor Puncak</span>
        </div>

        {/* Nilai Terendah */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Terendah
          </span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.lowest ?? '-'}
          </div>
          <span className="text-[10px] text-slate-400">Skor Minimum</span>
        </div>

        {/* Capai KKM */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-xs text-center">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Tuntas KKM
          </span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.passedCount}
          </div>
          <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400 font-medium">
            ≥ {gradeConfig.kkm} Poin
          </span>
        </div>

        {/* Belum KKM */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs text-center">
          <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
            Belum KKM
          </span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {stats.failedCount}
          </div>
          <span className="text-[10px] text-rose-700/70 dark:text-rose-400 font-medium">
            Perlu Remedial
          </span>
        </div>

        {/* Belum Lengkap */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Belum Lengkap
          </span>
          <div className="text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
            {stats.incompleteCount}
          </div>
          <span className="text-[10px] text-slate-400">Ada Komponen Kosong</span>
        </div>
      </div>

      {/* VISUAL CHARTS & ANALYSIS (Hidden when printing if preferred, or visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        {/* Chart A: Distribusi Nilai */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Distribusi Rentang Nilai Akhir
            </h3>
            <span className="text-[10px] text-slate-400">{stats.scoredCount} Siswa</span>
          </div>

          <div className="space-y-2.5">
            {[
              { label: '90 - 100 (Amat Baik)', count: stats.distribution.r90to100, color: 'bg-emerald-500' },
              { label: '80 - 89 (Baik)', count: stats.distribution.r80to89, color: 'bg-blue-500' },
              { label: '70 - 79 (Cukup)', count: stats.distribution.r70to79, color: 'bg-indigo-500' },
              { label: '60 - 69 (Kurang)', count: stats.distribution.r60to69, color: 'bg-amber-500' },
              { label: '0 - 59 (Sangat Kurang)', count: stats.distribution.under60, color: 'bg-rose-500' },
            ].map((d, i) => {
              const pct = stats.scoredCount > 0 ? Math.round((d.count / stats.scoredCount) * 100) : 0;
              return (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{d.label}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {d.count} Siswa ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart B: Perbandingan Rata-rata Komponen */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4 text-purple-600" />
              Rata-rata Komponen Penilaian
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Skala 100</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Rata-rata Tugas', val: stats.compAvgTask, color: 'bg-indigo-500' },
              { name: 'Rata-rata Quiz', val: stats.compAvgQuiz, color: 'bg-purple-500' },
              { name: 'PTS (Sumatif Tengah)', val: stats.compAvgUts, color: 'bg-blue-500' },
              { name: 'PAS (Sumatif Akhir)', val: stats.compAvgUas, color: 'bg-teal-500' },
              { name: 'Nilai Akhir Kelas', val: stats.classAvg, color: 'bg-emerald-600', isFinal: true },
            ].map((c, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className={`font-semibold ${c.isFinal ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                    {c.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {c.val !== null ? `${c.val}` : '-'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${c.color} rounded-full transition-all duration-500`}
                    style={{ width: `${c.val || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart C: Ringkasan Ketuntasan KKM */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ketuntasan Belajar Siswa
              </h3>
              <Badge variant="primary" size="sm">
                KKM: {gradeConfig.kkm}
              </Badge>
            </div>

            <div className="my-4 text-center">
              <div className="text-3xl font-black text-emerald-600">
                {stats.scoredCount > 0 ? Math.round((stats.passedCount / stats.scoredCount) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Siswa yang telah memenuhi batas ketuntasan belajar minimal (KKM).
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tuntas (Lulus KKM):
                </span>
                <span className="font-bold text-emerald-600">{stats.passedCount} Siswa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Perlu Remedial (&lt; KKM):
                </span>
                <span className="font-bold text-rose-600">{stats.failedCount} Siswa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Penilaian Belum Lengkap:
                </span>
                <span className="font-bold text-amber-600">{stats.incompleteCount} Siswa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SEARCH, SORTING, & CONTROLS (Hidden when printing) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa berdasarkan nama atau NISN..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Rank Column Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRankColumn}
              onChange={(e) => setShowRankColumn(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Tampilkan Peringkat</span>
          </label>

          <span className="text-slate-300 dark:text-slate-700 hidden md:inline">|</span>

          {/* Quick Sort Buttons */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1 text-[11px]">Urutkan:</span>
            <button
              onClick={() => handleSortToggle('rank')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                sortBy === 'rank'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              Peringkat {sortBy === 'rank' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortToggle('name')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                sortBy === 'name'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              Nama {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortToggle('finalScore')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                sortBy === 'finalScore'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              Nilai Akhir {sortBy === 'finalScore' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* RECAPITULATION TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5 text-center w-12 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">
                  No
                </th>
                <th className="px-4 py-3.5 min-w-[200px] sticky left-12 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">
                  Nama Siswa / NISN
                </th>

                {/* Assignment Columns */}
                {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') &&
                  assignmentsInSubject.map((asg, idx) => (
                    <th key={asg.id} className="px-3 py-3.5 text-center min-w-[90px]">
                      <div className="text-[10px] truncate max-w-[100px]" title={asg.title}>
                        Tugas {idx + 1}
                      </div>
                      <span className="text-[9px] text-slate-400 font-normal">Maks 100</span>
                    </th>
                  ))}

                {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') && (
                  <th className="px-3 py-3.5 text-center min-w-[95px] bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-r border-slate-200 dark:border-slate-700">
                    <div>Rata Tugas</div>
                    <span className="text-[9px] text-indigo-500 font-normal">
                      (Bobot {gradeConfig.categories.find((c) => c.code === 'TUGAS')?.weight}%)
                    </span>
                  </th>
                )}

                {/* Quiz Columns */}
                {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') &&
                  quizzesInSubject.map((qz, idx) => (
                    <th key={qz.id} className="px-3 py-3.5 text-center min-w-[90px]">
                      <div className="text-[10px] truncate max-w-[100px]" title={qz.title}>
                        Quiz {idx + 1}
                      </div>
                      <span className="text-[9px] text-slate-400 font-normal">Skala 100</span>
                    </th>
                  ))}

                {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') && (
                  <th className="px-3 py-3.5 text-center min-w-[95px] bg-purple-50/40 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-r border-slate-200 dark:border-slate-700">
                    <div>Rata Quiz</div>
                    <span className="text-[9px] text-purple-500 font-normal">
                      (Bobot {gradeConfig.categories.find((c) => c.code === 'QUIZ')?.weight}%)
                    </span>
                  </th>
                )}

                {/* UTS / PTS */}
                {(selectedPeriod === 'ALL' || selectedPeriod === 'PTS') && (
                  <th className="px-3 py-3.5 text-center min-w-[90px] bg-blue-50/30 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-700">
                    <div>PTS / UTS</div>
                    <span className="text-[9px] text-blue-500 font-normal">
                      (Bobot {gradeConfig.categories.find((c) => c.code === 'UTS')?.weight}%)
                    </span>
                  </th>
                )}

                {/* UAS / PAS */}
                {(selectedPeriod === 'ALL' || selectedPeriod === 'PAS') && (
                  <th className="px-3 py-3.5 text-center min-w-[90px] bg-teal-50/30 dark:bg-teal-950/20 border-r border-slate-200 dark:border-slate-700">
                    <div>PAS / UAS</div>
                    <span className="text-[9px] text-teal-500 font-normal">
                      (Bobot {gradeConfig.categories.find((c) => c.code === 'UAS')?.weight}%)
                    </span>
                  </th>
                )}

                {/* Final Weighted Score */}
                <th className="px-4 py-3.5 text-center min-w-[100px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border-r border-slate-200 dark:border-slate-700">
                  Nilai Akhir
                </th>

                {/* Predicate */}
                <th className="px-3 py-3.5 text-center min-w-[70px]">Predikat</th>

                {/* Ketuntasan */}
                <th className="px-3 py-3.5 text-center min-w-[90px]">Ketuntasan</th>

                {/* Peringkat */}
                {showRankColumn && (
                  <th className="px-3 py-3.5 text-center min-w-[70px]">Peringkat</th>
                )}

                {/* Action button */}
                <th className="px-4 py-3.5 text-right min-w-[80px] print:hidden">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa untuk kelas atau kriteria filter yang dipilih.
                  </td>
                </tr>
              ) : (
                processedRows.map((row, idx) => {
                  const student = row.student;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentDetail(student)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      {/* No */}
                      <td className="px-4 py-3 text-center text-slate-400 font-mono sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 z-10">
                        {idx + 1}
                      </td>

                      {/* Name & NISN */}
                      <td className="px-4 py-3 sticky left-12 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 z-10 border-r border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 transition truncate max-w-[170px]">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {student.nisn ? `NISN: ${student.nisn}` : student.username ? `@${student.username}` : '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assignment Scores */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') &&
                        assignmentsInSubject.map((asg) => {
                          const item = row.taskScores[asg.id];

                          return (
                            <td key={asg.id} className="px-3 py-3 text-center font-mono">
                              {item?.status === 'DINILAI' ? (
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.score}
                                </span>
                              ) : item?.status === 'BELUM_DINILAI' ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold" title="Sudah dikumpulkan siswa, menunggu koreksi guru">
                                  Koreksi
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-normal">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                      {/* Assignment Average */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') && (
                        <td className="px-3 py-3 text-center font-mono font-bold bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-300 border-r border-slate-100 dark:border-slate-800">
                          {row.avgTask !== null ? row.avgTask : '-'}
                        </td>
                      )}

                      {/* Quiz Scores */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') &&
                        quizzesInSubject.map((qz) => {
                          const item = row.quizScores[qz.id];

                          return (
                            <td key={qz.id} className="px-3 py-3 text-center font-mono">
                              {item?.status === 'SELESAI' ? (
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.percentageScore}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-normal">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}

                      {/* Quiz Average */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'HARIAN') && (
                        <td className="px-3 py-3 text-center font-mono font-bold bg-purple-50/20 dark:bg-purple-950/10 text-purple-700 dark:text-purple-300 border-r border-slate-100 dark:border-slate-800">
                          {row.avgQuiz !== null ? row.avgQuiz : '-'}
                        </td>
                      )}

                      {/* PTS / UTS */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'PTS') && (
                        <td className="px-3 py-3 text-center font-mono border-r border-slate-100 dark:border-slate-800">
                          {row.uts !== null ? (
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {row.uts}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                      )}

                      {/* PAS / UAS */}
                      {(selectedPeriod === 'ALL' || selectedPeriod === 'PAS') && (
                        <td className="px-3 py-3 text-center font-mono border-r border-slate-100 dark:border-slate-800">
                          {row.uas !== null ? (
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {row.uas}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 dark:text-slate-600">-</span>
                          )}
                        </td>
                      )}

                      {/* Final Weighted Score */}
                      <td className="px-4 py-3 text-center font-mono font-black text-sm bg-slate-50/50 dark:bg-slate-800/40 border-r border-slate-100 dark:border-slate-800">
                        {row.finalScore !== null ? (
                          <span
                            className={
                              row.isPassed === true
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {row.finalScore}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">Belum Ada</span>
                        )}
                      </td>

                      {/* Predicate */}
                      <td className="px-3 py-3 text-center font-bold">
                        {row.predicate !== '-' ? (
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                              row.predicate === 'A'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : row.predicate === 'B'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : row.predicate === 'C'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {row.predicate}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status Ketuntasan KKM */}
                      <td className="px-3 py-3 text-center">
                        {row.isPassed === true ? (
                          <Badge variant="success" size="sm">
                            Tuntas
                          </Badge>
                        ) : row.isPassed === false ? (
                          <Badge variant="danger" size="sm">
                            Remedial
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Sementara
                          </Badge>
                        )}
                      </td>

                      {/* Peringkat */}
                      {showRankColumn && (
                        <td className="px-3 py-3 text-center font-bold font-mono">
                          {typeof row.rank === 'number' ? (
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                row.rank === 1
                                  ? 'bg-amber-100 text-amber-900 font-black'
                                  : row.rank <= 3
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'text-slate-600'
                              }`}
                            >
                              #{row.rank}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )}

                      {/* Aksi Button */}
                      <td className="px-4 py-3 text-right print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentDetail(student);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Signature Section (Visible only when printed/PDF) */}
      <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-xs text-slate-800">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold">Kepala SMA Negeri Unggulan 1</p>
          <div className="h-20" />
          <p className="font-bold underline">Drs. H. Mulyadi, M.Pd</p>
          <p className="text-[10px]">NIP. 19680712 199403 1 003</p>
        </div>
        <div className="text-right">
          <p>Jakarta, {new Date().toLocaleDateString('id-ID')}</p>
          <p className="font-bold">Guru Mata Pelajaran</p>
          <div className="h-20" />
          <p className="font-bold underline">{currentUser.name}</p>
          <p className="text-[10px]">NIP. {currentUser.nip || '-'}</p>
        </div>
      </div>

      {/* MODAL 1: STUDENT DETAIL BREAKDOWN DRAWER/MODAL */}
      {selectedStudentDetail && (() => {
        const studentRow = recapData.find((r) => r.student.id === selectedStudentDetail.id);
        if (!studentRow) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:hidden">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudentDetail.avatar}
                    alt={selectedStudentDetail.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedStudentDetail.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedClass} • NISN: {selectedStudentDetail.nisn || '-'} • Mapel:{' '}
                      {selectedSubject?.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                {/* Final Score Card & Formula Summary */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                      Nilai Akhir Terhitung
                    </span>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      {studentRow.finalScore ?? '-'}
                      <span className="text-xs font-normal text-slate-400 ml-1">/ 100</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={studentRow.isPassed ? 'success' : 'danger'}>
                        {studentRow.isPassed ? 'Tuntas KKM' : 'Belum Mencapai KKM'}
                      </Badge>
                      <span className="text-slate-500">• Predikat {studentRow.predicate}</span>
                      {typeof studentRow.rank === 'number' && (
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          • Peringkat #{studentRow.rank}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formula Breakdown Badge */}
                  <div className="text-right max-w-xs font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Kalkulasi Bobot:
                    </span>
                    <div>Tugas: ({studentRow.avgTask ?? 0} × 30%)</div>
                    <div>Quiz: ({studentRow.avgQuiz ?? 0} × 25%)</div>
                    <div>PTS: ({studentRow.uts ?? 0} × 20%)</div>
                    <div>PAS: ({studentRow.uas ?? 0} × 25%)</div>
                  </div>
                </div>

                {/* Assignment Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Rincian Penugasan ({assignmentsInSubject.length} Tugas)
                    </h4>
                    <span className="font-bold text-indigo-600">
                      Rata-rata Tugas: {studentRow.avgTask ?? '-'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {assignmentsInSubject.map((asg, idx) => {
                      const item = studentRow.taskScores[asg.id];
                      const sub = submissions.find(
                        (s) => s.assignmentId === asg.id && s.studentId === selectedStudentDetail.id
                      );

                      return (
                        <div
                          key={asg.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              TUGAS {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {asg.title}
                            </span>
                            {sub?.feedback && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                "{sub.feedback}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {item?.status === 'DINILAI' ? (
                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                  {item.score}/100
                                </span>
                              ) : item?.status === 'BELUM_DINILAI' ? (
                                <Badge variant="warning">Menunggu Koreksi</Badge>
                              ) : (
                                <Badge variant="neutral">Belum Kumpul</Badge>
                              )}
                            </div>

                            {/* Quick score edit trigger */}
                            <button
                              onClick={() => {
                                setEditingStudentScore({
                                  student: selectedStudentDetail,
                                  type: 'assignment',
                                  itemId: asg.id,
                                  itemName: asg.title,
                                  currentScore: item?.score || 85,
                                });
                                setQuickScoreInput(item?.score || 85);
                                setQuickFeedbackInput(sub?.feedback || '');
                                setIsQuickEditOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                              title="Ubah / Beri Nilai Tugas"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quiz Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                      Rincian Kuis & Evaluasi ({quizzesInSubject.length} Quiz)
                    </h4>
                    <span className="font-bold text-purple-600">
                      Rata-rata Quiz: {studentRow.avgQuiz ?? '-'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {quizzesInSubject.map((qz, idx) => {
                      const item = studentRow.quizScores[qz.id];

                      return (
                        <div
                          key={qz.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              QUIZ {idx + 1}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {qz.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {item?.status === 'SELESAI' ? (
                              <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                                {item.percentageScore}%
                              </span>
                            ) : (
                              <Badge variant="neutral">Belum Mengikuti</Badge>
                            )}

                            <button
                              onClick={() => {
                                onNavigate('grades');
                                setSelectedStudentDetail(null);
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:underline"
                            >
                              Buka Lembar Jawaban
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Exam Breakdown (PTS / PAS) */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Ujian Sumatif (PTS & PAS)
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">PTS / UTS</span>
                        <span className="text-base font-black text-blue-600 font-mono">
                          {studentRow.uts !== null ? `${studentRow.uts}` : '-'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStudentScore({
                            student: selectedStudentDetail,
                            type: 'uts',
                            itemName: 'Penilaian Tengah Semester (PTS)',
                            currentScore: studentRow.uts || 85,
                          });
                          setQuickScoreInput(studentRow.uts || 85);
                          setQuickFeedbackInput('');
                          setIsQuickEditOpen(true);
                        }}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">PAS / UAS</span>
                        <span className="text-base font-black text-teal-600 font-mono">
                          {studentRow.uas !== null ? `${studentRow.uas}` : '-'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingStudentScore({
                            student: selectedStudentDetail,
                            type: 'uas',
                            itemName: 'Penilaian Akhir Semester (PAS)',
                            currentScore: studentRow.uas || 85,
                          });
                          setQuickScoreInput(studentRow.uas || 85);
                          setQuickFeedbackInput('');
                          setIsQuickEditOpen(true);
                        }}
                        className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-100"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-300 transition"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: WEIGHT & CATEGORY CONFIGURATION MODAL */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pengaturan Bobot & Kategori Nilai
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedClass} • {selectedSubject?.name}
                </p>
              </div>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeightConfig} className="space-y-4 text-xs">
              {/* KKM Input */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Kriteria Ketuntasan Minimal (KKM Kelas)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={tempConfig.kkm}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, kkm: Number(e.target.value) })
                    }
                    className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-sm"
                  />
                  <span className="text-xs text-slate-500">
                    Siswa dengan nilai &lt; {tempConfig.kkm} wajib mengikuti remedial.
                  </span>
                </div>
              </div>

              {/* Categories & Weights List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Kategori Penilaian & Bobot (%)
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      tempConfig.categories
                        .filter((c) => c.isActive && c.includeInFinalScore)
                        .reduce((sum, c) => sum + Number(c.weight || 0), 0) === 100
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    Total:{' '}
                    {tempConfig.categories
                      .filter((c) => c.isActive && c.includeInFinalScore)
                      .reduce((sum, c) => sum + Number(c.weight || 0), 0)}
                    % / 100%
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tempConfig.categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={cat.isActive}
                          onChange={(e) => {
                            const updated = [...tempConfig.categories];
                            updated[idx].isActive = e.target.checked;
                            setTempConfig({ ...tempConfig, categories: updated });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const updated = [...tempConfig.categories];
                            updated[idx].name = e.target.value;
                            setTempConfig({ ...tempConfig, categories: updated });
                          }}
                          className="font-semibold text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 w-full"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={!cat.isActive}
                          value={cat.weight}
                          onChange={(e) => {
                            const updated = [...tempConfig.categories];
                            updated[idx].weight = Number(e.target.value);
                            setTempConfig({ ...tempConfig, categories: updated });
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-center disabled:opacity-40"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Category */}
              <button
                type="button"
                onClick={() => {
                  const newCat: GradeCategory = {
                    id: `cat-${Date.now()}`,
                    name: 'Praktikum Mandiri',
                    code: 'PRAKTIK',
                    weight: 10,
                    isActive: true,
                    includeInFinalScore: true,
                  };
                  setTempConfig({
                    ...tempConfig,
                    categories: [...tempConfig.categories, newCat],
                  });
                }}
                className="w-full py-2 border border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Kategori Penilaian Baru
              </button>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                  Simpan Konfigurasi Bobot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK SCORE CORRECTION FOR GURU */}
      {isQuickEditOpen && editingStudentScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Koreksi Nilai: {editingStudentScore.student.name}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  {editingStudentScore.itemName}
                </p>
              </div>
              <button
                onClick={() => setIsQuickEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickScore} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nilai Angka (0 - 100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={quickScoreInput}
                  onChange={(e) => setQuickScoreInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base"
                />
              </div>

              {editingStudentScore.type === 'assignment' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Evaluasi / Feedback Guru
                  </label>
                  <textarea
                    rows={3}
                    value={quickFeedbackInput}
                    onChange={(e) => setQuickFeedbackInput(e.target.value)}
                    placeholder="Tuliskan catatan perbaikan untuk siswa..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
