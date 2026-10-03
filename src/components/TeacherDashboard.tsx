import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Settings, Wand2, ShieldCheck, 
  ShieldAlert, Users, FileSpreadsheet, Download, Printer, 
  Eye, Play, CheckCircle2, AlertTriangle, Search, Filter, 
  Sparkles, Clock, ArrowRight, Shuffle, Code, FileText, 
  Lock, Maximize2, AlertCircle, RefreshCw, X, ChevronRight,
  Award, HelpCircle, GraduationCap, FolderTree, Layers,
  Send, Plus, Check, Share2, Tag, Calendar, ExternalLink,
  BookmarkCheck, Trash2, Edit3, Home, FileEdit, BarChart3,
  UploadCloud, FileUp, Loader2, ArrowLeft
} from 'lucide-react';
import { 
  Exam, Question, ExamVariantBundle, AntiCheatConfig, 
  StudentSubmission, PhysicsTopic 
} from '../types/exam';
import { 
  CurriculumChapter, CurriculumLesson, ExamPackage, 
  GradeLevel, ExamCategory, ExamAssignmentInfo 
} from '../types/curriculum';
import { CURRICULUM_CHAPTERS, MILESTONES, getSavedExamPackages, saveExamPackagesToStorage } from '../data/curriculumData';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { AIGeneratorTab } from './AIGeneratorTab';
import { ShufflingTab } from './ShufflingTab';
import { AntiCheatConfigTab } from './AntiCheatConfigTab';
import { AssignExamModal } from './AssignExamModal';
import { UploadLessonExamModal } from './UploadLessonExamModal';
import { CurriculumExamBank } from './CurriculumExamBank';
import { SaveExamToBankModal } from './SaveExamToBankModal';
import { TeacherEditor } from './TeacherEditor';
import { parseWordPhysicsExam, WordExamParseResult } from '../utils/wordExamParser';
import { exportScoreReportToCSV, exportAllSubmissionsToCSV, exportGradebookToExcel } from '../utils/exportCsv';
import { saveAntiCheatConfig } from '../utils/antiCheat';
import { resolveQuestionDiagram, FIGURE_MENTION_REGEX } from '../utils/diagramResolver';
import { updateQuestionDiagramInExam } from '../utils/examStorage';
import { UserAdminPanel } from './UserAdminPanel';
import { 
  getQuestionCognitiveLevel, 
  getStatementCognitiveLevel, 
  CognitiveLevelBadge, 
  stripCognitiveLevelPrefix,
  CognitiveLevel,
  COGNITIVE_LEVELS_CONFIG
} from '../utils/cognitiveLevel';

export type DashboardPanel = 'panel1' | 'panel2' | 'panel3' | 'panel4' | 'panel5' | 'panel6' | 'overview' | 'config' | 'ai_tools' | 'monitoring' | 'admin';

interface TeacherDashboardProps {
  exam: Exam;
  onUpdateExam: (updatedExam: Exam) => void;
  onPreviewAsStudent: () => void;
  bundle: ExamVariantBundle | null;
  onApplyBundle: (newBundle: ExamVariantBundle) => void;
  onOpenPrint: (mode: 'exam_only' | 'exam_with_solutions') => void;
  onOpenPrintMatrix?: (bundle: ExamVariantBundle) => void;
  onOpenTeacherJsonModal: () => void;
  antiCheatConfig: AntiCheatConfig;
  onChangeAntiCheatConfig: (newConfig: AntiCheatConfig) => void;
  submissions: StudentSubmission[];
  onAddSampleSubmission?: () => void;
  onClearSubmissions?: () => void;
  availableCodes?: string[];
  activeCode: string;
  onSelectExamCode: (code: string) => void;
  examPackages?: ExamPackage[];
  onSaveExamPackage?: (pkg: ExamPackage) => void;
  onDeleteExamPackage?: (pkgId: string) => void;
  onOpenSaveToBank?: () => void;
  assignments?: ExamAssignmentInfo[];
  onAssignExam?: (pkg: ExamPackage, assignment: ExamAssignmentInfo, switchToStudent: boolean) => void;
  onSelectExamPackage?: (pkg: ExamPackage) => void;
  onDeleteAssignment?: (id: string) => void;
  initialPanel?: DashboardPanel;
  initialSubtabIndex?: number;
  onNavigateHome?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  exam,
  onUpdateExam,
  onPreviewAsStudent,
  bundle,
  onApplyBundle,
  onOpenPrint,
  onOpenPrintMatrix,
  onOpenTeacherJsonModal,
  antiCheatConfig,
  onChangeAntiCheatConfig,
  submissions,
  onAddSampleSubmission,
  onClearSubmissions,
  availableCodes,
  activeCode,
  onSelectExamCode,
  examPackages: externalPackages,
  onSaveExamPackage,
  onDeleteExamPackage,
  onOpenSaveToBank,
  assignments: externalAssignments,
  onAssignExam,
  onSelectExamPackage,
  onDeleteAssignment,
  initialPanel,
  initialSubtabIndex,
  onNavigateHome,
}) => {
  // Panel hiện tại của Dashboard (hỗ trợ cả panel1..5 và legacy names)
  const resolvePanel = (p?: DashboardPanel): DashboardPanel => {
    if (!p) return 'panel1';
    if (p === 'overview') return 'panel1';
    if (p === 'ai_tools') return 'panel2';
    if (p === 'config') return 'panel3';
    if (p === 'monitoring') return 'panel4';
    return p;
  };

  const [activePanel, setActivePanel] = useState<DashboardPanel>(() => resolvePanel(initialPanel));

  // Trạng thái Subtab cho từng Panel
  const [panel2Tab, setPanel2Tab] = useState<'word_import' | 'visual_editor' | 'ai_scan'>('word_import');
  const [panel3Tab, setPanel3Tab] = useState<'shuffling' | 'anticheat' | 'settings'>('shuffling');
  const [panel4Tab, setPanel4Tab] = useState<'submissions' | 'distribution' | 'export_report'>('submissions');
  const [panel5Tab, setPanel5Tab] = useState<'print_student' | 'print_teacher'>('print_student');
  const [panel6Tab, setPanel6Tab] = useState<'teachers' | 'students' | 'rbac'>('teachers');

  // Quản lý tệp Word để bóc tách ở Panel 2 (Tab 2.1)
  const wordFileInputRef = useRef<HTMLInputElement>(null);
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isParsingWord, setIsParsingWord] = useState<boolean>(false);
  const [wordParseResult, setWordParseResult] = useState<WordExamParseResult | null>(null);
  const [wordParseError, setWordParseError] = useState<string | null>(null);

  // Đồng bộ khi initialPanel hoặc initialSubtabIndex thay đổi từ bên ngoài
  useEffect(() => {
    if (initialPanel) {
      const resolved = resolvePanel(initialPanel);
      setActivePanel(resolved);
      if (resolved === 'panel2' && initialSubtabIndex !== undefined) {
        const tabs: Array<'word_import' | 'visual_editor' | 'ai_scan'> = ['word_import', 'visual_editor', 'ai_scan'];
        if (tabs[initialSubtabIndex]) setPanel2Tab(tabs[initialSubtabIndex]);
      } else if (resolved === 'panel3' && initialSubtabIndex !== undefined) {
        const tabs: Array<'shuffling' | 'anticheat' | 'settings'> = ['shuffling', 'anticheat', 'settings'];
        if (tabs[initialSubtabIndex]) setPanel3Tab(tabs[initialSubtabIndex]);
      } else if (resolved === 'panel4' && initialSubtabIndex !== undefined) {
        const tabs: Array<'submissions' | 'distribution' | 'export_report'> = ['submissions', 'distribution', 'export_report'];
        if (tabs[initialSubtabIndex]) setPanel4Tab(tabs[initialSubtabIndex]);
      } else if (resolved === 'panel5' && initialSubtabIndex !== undefined) {
        const tabs: Array<'print_student' | 'print_teacher'> = ['print_student', 'print_teacher'];
        if (tabs[initialSubtabIndex]) setPanel5Tab(tabs[initialSubtabIndex]);
      } else if ((resolved === 'panel6' || resolved === 'admin') && initialSubtabIndex !== undefined) {
        const tabs: Array<'teachers' | 'students' | 'rbac'> = ['teachers', 'students', 'rbac'];
        if (tabs[initialSubtabIndex]) setPanel6Tab(tabs[initialSubtabIndex]);
      }
    }
  }, [initialPanel, initialSubtabIndex]);

  // Trạng thái mở modal Lưu đề thi vào Ngân hàng
  const [isSaveExamModalOpen, setIsSaveExamModalOpen] = useState<boolean>(false);

  // Quản lý gói đề thi trong state & localStorage
  const [localPackages, setLocalPackages] = useState<ExamPackage[]>(() => getSavedExamPackages());
  const allPackages = externalPackages && externalPackages.length > 0 ? externalPackages : localPackages;

  // Quản lý danh sách bài thi đã giao
  const [localAssignments, setLocalAssignments] = useState<ExamAssignmentInfo[]>(() => {
    try {
      const raw = localStorage.getItem('physixam_assignments');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const allAssignments = externalAssignments || localAssignments;

  // Chế độ xem trong Panel 1: Ngân hàng đề thi | Chi tiết câu hỏi | Bài đã giao
  const [panel1ViewMode, setPanel1ViewMode] = useState<'curriculum_bank' | 'current_exam_questions' | 'assigned_management'>('curriculum_bank');

  // BỘ LỌC ĐA TẦNG CHO NGÂN HÀNG ĐỀ THI
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ExamCategory | 'all'>('all');
  const [filterChapterId, setFilterChapterId] = useState<string>('all');
  const [filterLessonId, setFilterLessonId] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Hộp thoại Giao đề thi & Tải lên đề mới theo bài
  const [assigningPackage, setAssigningPackage] = useState<ExamPackage | null>(null);
  const [uploadAnchor, setUploadAnchor] = useState<{
    grade: GradeLevel;
    chapter: CurriculumChapter | null;
    lesson: CurriculumLesson | null;
  } | null>(null);

  // Lọc và tìm kiếm câu hỏi ở Tab "Chi tiết câu hỏi đề đang chọn"
  const [selectedPartFilter, setSelectedPartFilter] = useState<'all' | 'Phần I' | 'Phần II' | 'Phần III'>('all');
  const [selectedCognitiveLevelFilter, setSelectedCognitiveLevelFilter] = useState<'all' | 'NB' | 'TH' | 'VD' | 'VDC'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [selectedDiagramSourceId, setSelectedDiagramSourceId] = useState<string | null>(null);

  // Xem chi tiết bài nộp của học sinh ở Panel 4
  const [inspectingSubmission, setInspectingSubmission] = useState<StudentSubmission | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'submitted' | 'violated'>('all');
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Thông báo nhanh
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Thống kê tổng quan ngân hàng đề thi GDPT 2018
  const curriculumStats = useMemo(() => {
    const total = allPackages.length;
    const g10 = allPackages.filter((p) => p.grade === 10).length;
    const g11 = allPackages.filter((p) => p.grade === 11).length;
    const g12 = allPackages.filter((p) => p.grade === 12).length;
    const withSvg = allPackages.filter((p) => p.svgCount > 0).length;
    const assignedCount = allAssignments.length;
    return { total, g10, g11, g12, withSvg, assignedCount };
  }, [allPackages, allAssignments]);

  // Danh sách Chương khả dụng theo Khối lớp đang chọn
  const availableChapters = useMemo(() => {
    if (filterGrade === 'all') return CURRICULUM_CHAPTERS;
    return CURRICULUM_CHAPTERS.filter((c) => c.grade === filterGrade);
  }, [filterGrade]);

  // Danh sách Bài học khả dụng theo Chương đang chọn
  const availableLessons = useMemo(() => {
    if (filterChapterId === 'all') {
      return availableChapters.flatMap((c) => c.lessons);
    }
    const currentChap = availableChapters.find((c) => c.id === filterChapterId);
    return currentChap ? currentChap.lessons : [];
  }, [availableChapters, filterChapterId]);

  // Danh sách Gói đề thi sau khi áp dụng bộ lọc đa tầng
  const filteredExamPackages = useMemo(() => {
    return allPackages.filter((pkg) => {
      // Lọc khối lớp
      if (filterGrade !== 'all' && pkg.grade !== filterGrade) {
        return false;
      }
      // Lọc loại đề thi
      if (filterCategory !== 'all' && pkg.category !== filterCategory) {
        return false;
      }
      // Lọc theo Chương
      if (filterChapterId !== 'all' && pkg.chapterId !== filterChapterId) {
        return false;
      }
      // Lọc theo Bài học
      if (filterLessonId !== 'all' && pkg.lessonId !== filterLessonId) {
        return false;
      }
      // Tìm kiếm từ khóa
      if (filterSearch.trim().length > 0) {
        const q = filterSearch.toLowerCase().trim();
        const matchTitle = pkg.title.toLowerCase().includes(q);
        const matchSubtitle = pkg.subtitle?.toLowerCase().includes(q);
        const matchCode = pkg.code.toLowerCase().includes(q);
        const matchChap = pkg.chapterTitle.toLowerCase().includes(q);
        const matchLesson = (pkg.lessonTitle || '').toLowerCase().includes(q);
        const matchTags = pkg.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSubtitle && !matchCode && !matchChap && !matchLesson && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [allPackages, filterGrade, filterCategory, filterChapterId, filterLessonId, filterSearch]);

  // Lưu gói đề thi mới hoặc cập nhật
  const handleSavePackage = (newPkg: ExamPackage) => {
    if (onSaveExamPackage) {
      onSaveExamPackage(newPkg);
    } else {
      setLocalPackages((prev) => {
        const idx = prev.findIndex((p) => p.id === newPkg.id);
        let updated: ExamPackage[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = newPkg;
        } else {
          updated = [newPkg, ...prev];
        }
        saveExamPackagesToStorage(updated);
        return updated;
      });
    }
    showToast(`Đã lưu thành công đề thi '${newPkg.title}' vào Ngân hàng đề (Khối ${newPkg.grade})!`);
  };

  // Xóa gói đề thi khỏi Ngân hàng đề thi GDPT 2018
  const handleDeleteExamPackage = (pkgId: string) => {
    if (onDeleteExamPackage) {
      onDeleteExamPackage(pkgId);
    } else {
      setLocalPackages((prev) => {
        const updated = prev.filter((p) => p.id !== pkgId);
        saveExamPackagesToStorage(updated);
        return updated;
      });
    }
    showToast('Đã xóa đề thi khỏi Ngân hàng đề thành công!');
  };

  // Mở gói đề thi trong bộ soạn thảo JSON & Builder
  const handleOpenInEditor = (pkg: ExamPackage) => {
    handleSelectPackageAsActive(pkg);
    onOpenTeacherJsonModal();
  };

  // Kích hoạt nạp đề thi vào hệ thống hiện hành
  const handleSelectPackageAsActive = (pkg: ExamPackage) => {
    if (onSelectExamPackage) {
      onSelectExamPackage(pkg);
    } else {
      onUpdateExam(pkg.examData);
    }
    showToast(`Đã nạp đề thi [Mã: ${pkg.code}] "${pkg.title}" vào hệ thống khảo thí!`);
  };

  // Xác nhận giao đề thi cho lớp học (từ Ngân hàng đề thi)
  const handleBankAssignExam = (pkg: ExamPackage, assignment: ExamAssignmentInfo, switchToStudent: boolean) => {
    if (onAssignExam) {
      onAssignExam(pkg, assignment, switchToStudent);
    } else {
      setLocalAssignments((prev) => [assignment, ...prev.filter((a) => a.id !== assignment.id)]);
      try {
        localStorage.setItem('physixam_assignments', JSON.stringify([assignment, ...localAssignments.filter((a) => a.id !== assignment.id)]));
      } catch {}
      onUpdateExam(pkg.examData);
    }

    setAssigningPackage(null);
    showToast(`Đã giao thành công bài thi cho Lớp ${assignment.className}! Mã thi: ${assignment.accessCode}`);

    if (switchToStudent) {
      onPreviewAsStudent();
    }
  };

  const handleConfirmAssignment = (assignment: ExamAssignmentInfo, switchToStudent: boolean) => {
    if (assigningPackage) {
      handleBankAssignExam(assigningPackage, assignment, switchToStudent);
    }
  };

  // Xóa bài thi đã giao
  const handleDeleteAssignment = (assignId: string) => {
    if (onDeleteAssignment) {
      onDeleteAssignment(assignId);
    } else {
      const updated = localAssignments.filter((a) => a.id !== assignId);
      setLocalAssignments(updated);
      try {
        localStorage.setItem('physixam_assignments', JSON.stringify(updated));
      } catch {}
    }
    showToast('Đã xóa lượt giao bài thi thành công!');
  };

  // Thống kê câu hỏi
  const partStats = useMemo(() => {
    const part1 = exam.questions.filter((q) => q.part === 'Phần I').length;
    const part2 = exam.questions.filter((q) => q.part === 'Phần II').length;
    const part3 = exam.questions.filter((q) => q.part === 'Phần III').length;
    return { part1, part2, part3, total: exam.questions.length };
  }, [exam.questions]);

  // Thống kê Mức độ nhận thức cho đề đang nạp
  const cognitiveStats = useMemo(() => {
    let nb = 0;
    let th = 0;
    let vd = 0;
    let vdc = 0;
    exam.questions.forEach((q) => {
      const lvl = getQuestionCognitiveLevel(q);
      if (lvl === 'NB') nb++;
      else if (lvl === 'TH') th++;
      else if (lvl === 'VD') vd++;
      else if (lvl === 'VDC') vdc++;
    });
    return { nb, th, vd, vdc, total: exam.questions.length };
  }, [exam.questions]);

  // Danh sách câu hỏi đã lọc
  const filteredQuestions = useMemo(() => {
    return exam.questions.filter((q) => {
      if (selectedPartFilter !== 'all' && q.part !== selectedPartFilter) {
        return false;
      }
      if (selectedCognitiveLevelFilter !== 'all') {
        const qLevel = getQuestionCognitiveLevel(q);
        if (q.type === 'true_false_cluster') {
          const hasMatchingStatement = q.items.some((item, idx) => getStatementCognitiveLevel(item, idx) === selectedCognitiveLevelFilter);
          if (qLevel !== selectedCognitiveLevelFilter && !hasMatchingStatement) {
            return false;
          }
        } else if (qLevel !== selectedCognitiveLevelFilter) {
          return false;
        }
      }
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchStem = q.stem.toLowerCase().includes(query);
        const matchTopic = q.topic.toLowerCase().includes(query);
        if (!matchTitle && !matchStem && !matchTopic) {
          return false;
        }
      }
      return true;
    });
  }, [exam.questions, selectedPartFilter, selectedCognitiveLevelFilter, searchQuery]);

  // Thống kê bài thi học sinh
  const submissionStats = useMemo(() => {
    const total = submissions.length;
    if (total === 0) return { total: 0, avgScore: 0, passRate: 0, violatedCount: 0 };
    const totalScore = submissions.reduce((acc, s) => acc + s.totalScore, 0);
    const avgScore = totalScore / total;
    const passCount = submissions.filter((s) => s.totalScore >= 5.0).length;
    const passRate = Math.round((passCount / total) * 100);
    const violatedCount = submissions.filter(
      (s) => s.violationCount > 0 || s.submissionReason === 'violation_limit_exceeded'
    ).length;
    return { total, avgScore: Number(avgScore.toFixed(2)), passRate, violatedCount };
  }, [submissions]);

  // Danh sách bài nộp đã lọc
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (submissionFilter === 'submitted' && sub.submissionReason === 'violation_limit_exceeded') {
        return false;
      }
      if (submissionFilter === 'violated' && sub.submissionReason !== 'violation_limit_exceeded' && sub.violationCount === 0) {
        return false;
      }
      if (studentSearch.trim().length > 0) {
        const q = studentSearch.toLowerCase();
        const matchName = sub.studentName.toLowerCase().includes(q);
        const matchClass = sub.studentClass.toLowerCase().includes(q);
        const matchSbd = sub.candidateNumber.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchSbd) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, submissionFilter, studentSearch]);

  // THỐNG KÊ PHỔ ĐIỂM THI (SCORE DISTRIBUTION)
  const scoreDistributionData = useMemo(() => {
    const scores = submissions.map((s) => s.totalScore);
    const total = scores.length;
    if (total === 0) {
      return {
        maxScore: 0,
        minScore: 0,
        avgScore: 0,
        medianScore: 0,
        passRate: 0,
        total: 0,
        bands: [
          { label: '[0 - 2)', name: 'Kém', count: 0, percentage: 0, color: 'bg-rose-500' },
          { label: '[2 - 4)', name: 'Yếu', count: 0, percentage: 0, color: 'bg-orange-500' },
          { label: '[4 - 5)', name: 'Dưới TB', count: 0, percentage: 0, color: 'bg-amber-500' },
          { label: '[5 - 6.5)', name: 'Trung bình', count: 0, percentage: 0, color: 'bg-sky-500' },
          { label: '[6.5 - 8)', name: 'Khá', count: 0, percentage: 0, color: 'bg-blue-600' },
          { label: '[8 - 9)', name: 'Giỏi', count: 0, percentage: 0, color: 'bg-indigo-600' },
          { label: '[9 - 10]', name: 'Xuất sắc', count: 0, percentage: 0, color: 'bg-emerald-600' },
        ],
      };
    }

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const totalScore = scores.reduce((acc, s) => acc + s, 0);
    const avgScore = Number((totalScore / total).toFixed(2));

    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianScore = sorted.length % 2 !== 0 
      ? sorted[mid] 
      : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

    const passCount = scores.filter((s) => s >= 5.0).length;
    const passRate = Number(((passCount / total) * 100).toFixed(1));

    const bandCounts = [0, 0, 0, 0, 0, 0, 0];
    scores.forEach((s) => {
      if (s < 2) bandCounts[0]++;
      else if (s < 4) bandCounts[1]++;
      else if (s < 5) bandCounts[2]++;
      else if (s < 6.5) bandCounts[3]++;
      else if (s < 8) bandCounts[4]++;
      else if (s < 9) bandCounts[5]++;
      else bandCounts[6]++;
    });

    const bandDefs = [
      { label: '[0 - 2)', name: 'Kém', color: 'bg-rose-500' },
      { label: '[2 - 4)', name: 'Yếu', color: 'bg-orange-500' },
      { label: '[4 - 5)', name: 'Dưới TB', color: 'bg-amber-500' },
      { label: '[5 - 6.5)', name: 'Trung bình', color: 'bg-sky-500' },
      { label: '[6.5 - 8)', name: 'Khá', color: 'bg-blue-600' },
      { label: '[8 - 9)', name: 'Giỏi', color: 'bg-indigo-600' },
      { label: '[9 - 10]', name: 'Xuất sắc', color: 'bg-emerald-600' },
    ];

    const bands = bandDefs.map((def, idx) => ({
      ...def,
      count: bandCounts[idx],
      percentage: Number(((bandCounts[idx] / total) * 100).toFixed(1)),
    }));

    return { maxScore, minScore, avgScore, medianScore, passRate, total, bands };
  }, [submissions]);

  // PHÂN TÍCH CÂU SAI & MA TRẬN ĐỘ KHÓ THỰC TẾ (ITEM MISTAKE ANALYTICS)
  const questionMistakeAnalytics = useMemo(() => {
    const totalSubs = submissions.length;
    return exam.questions.map((q, idx) => {
      const qNum = idx + 1;
      let correctCount = 0;
      const wrongChoiceCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      let wrongOtherCount = 0;

      submissions.forEach((sub) => {
        const res = sub.evaluation?.results?.[q.id];
        if (res?.isCorrect) {
          correctCount++;
        } else {
          const userAns = sub.answers?.[q.id];
          if (typeof userAns === 'string' && ['A', 'B', 'C', 'D'].includes(userAns.toUpperCase())) {
            const letter = userAns.toUpperCase();
            wrongChoiceCounts[letter] = (wrongChoiceCounts[letter] || 0) + 1;
          } else {
            wrongOtherCount++;
          }
        }
      });

      const correctRate = totalSubs > 0 ? Number(((correctCount / totalSubs) * 100).toFixed(1)) : 0;
      const errorRate = Number((100 - correctRate).toFixed(1));
      const isHighError = errorRate > 50;

      let wrongSummary = '';
      if (q.part === 'Phần I') {
        const wrongList = Object.entries(wrongChoiceCounts)
          .filter(([_, cnt]) => cnt > 0)
          .map(([opt, cnt]) => `${opt}: ${cnt} hs`);
        wrongSummary = wrongList.length > 0 ? wrongList.join(' • ') : (totalSubs === 0 ? 'Chưa có bài thi' : 'Không có');
      } else if (q.part === 'Phần II') {
        wrongSummary = wrongOtherCount > 0 ? `${wrongOtherCount} hs sai một hoặc nhiều ý` : (totalSubs === 0 ? 'Chưa có bài' : 'Toàn bộ đúng');
      } else {
        wrongSummary = wrongOtherCount > 0 ? `${wrongOtherCount} hs sai đáp số` : (totalSubs === 0 ? 'Chưa có bài' : 'Toàn bộ đúng');
      }

      return {
        q,
        qNum,
        part: q.part,
        correctCount,
        totalSubs,
        correctRate,
        errorRate,
        isHighError,
        wrongSummary,
      };
    });
  }, [exam.questions, submissions]);

  // Cập nhật cấu hình giám sát trực tiếp
  const handleUpdateAntiCheat = <K extends keyof AntiCheatConfig>(key: K, value: AntiCheatConfig[K]) => {
    const updated = { ...antiCheatConfig, [key]: value };
    onChangeAntiCheatConfig(updated);
    saveAntiCheatConfig(updated);
    showToast('Đã lưu cấu hình giám sát thi thành công!');
  };

  const handleApplyPreset = (preset: 'strict' | 'standard' | 'relaxed') => {
    let newConf: AntiCheatConfig;
    if (preset === 'strict') {
      newConf = {
        enabled: true,
        requireFullscreen: true,
        trackTabSwitching: true,
        maxViolations: 2,
        preventCopyAndShortcuts: true,
      };
      showToast('Đã áp dụng cấu hình: "Kỳ thi Nghiêm ngặt"');
    } else if (preset === 'standard') {
      newConf = {
        enabled: true,
        requireFullscreen: true,
        trackTabSwitching: true,
        maxViolations: 3,
        preventCopyAndShortcuts: true,
      };
      showToast('Đã áp dụng cấu hình: "Tiêu chuẩn kiểm tra định kỳ"');
    } else {
      newConf = {
        enabled: true,
        requireFullscreen: false,
        trackTabSwitching: true,
        maxViolations: 5,
        preventCopyAndShortcuts: false,
      };
      showToast('Đã áp dụng cấu hình: "Linh hoạt / Thi thử"');
    }
    onChangeAntiCheatConfig(newConf);
    saveAntiCheatConfig(newConf);
  };

  // Xử lý nạp tệp Word (.docx) ở Panel 2 (Tab 2.1)
  const handleWordFileChange = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setWordParseError('Vui lòng chọn tệp Word có định dạng .docx hoặc .doc.');
      return;
    }
    setWordFile(file);
    setIsParsingWord(true);
    setWordParseError(null);
    setWordParseResult(null);
    try {
      const result = await parseWordPhysicsExam(file);
      setWordParseResult(result);
      showToast(`Đã bóc tách thành công ${result.summary.totalQuestions} câu hỏi từ "${file.name}"!`);
    } catch (err: any) {
      console.error('Lỗi phân tích file Word:', err);
      setWordParseError(err?.message || 'Không thể bóc tách tệp Word. Vui lòng kiểm tra định dạng tệp.');
    } finally {
      setIsParsingWord(false);
    }
  };

  const handleApplyWordExam = () => {
    if (!wordParseResult) return;
    onUpdateExam(wordParseResult.exam);
    showToast(`Đã áp dụng đề thi "${wordParseResult.exam.title}" (${wordParseResult.exam.questions.length} câu) thành công!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG QUAY LẠI TRANG CHỦ & THÔNG TIN ĐỀ ĐANG LÀM VIỆC (VIEWPORT ISOLATION) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200 transition cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              title="Quay lại Cổng Thông Tin Trang Chủ (Khôi phục Pano Banner)"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>⬅ Quay lại Trang chủ</span>
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-2xs">
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[280px] sm:max-w-md">
                {exam.title}
              </span>
              <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {exam.gradeLevel ? exam.gradeLevel.replace(/\s*\(?Chương trình GDPT 2018\)?/gi, '').trim() : 'Lớp 12'}
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-slate-100 text-slate-700">
                Mã: {activeCode}
              </span>
              <span className="text-slate-500 font-medium">
                • {partStats.total} câu ({exam.durationMinutes} phút)
              </span>
              {antiCheatConfig.enabled && (
                <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Giám sát bật
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cụm hành động nhanh trong Workspace */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => setIsSaveExamModalOpen(true)}
            className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            title="Lưu cấu trúc đề thi vào Ngân hàng dữ liệu GDPT 2018"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>💾 Lưu đề</span>
          </button>

          <button
            type="button"
            onClick={onPreviewAsStudent}
            className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            title="Xem trước đề thi với tư cách Học sinh"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Xem trước đề</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPrint('exam_only')}
            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
            title="In đề thi chuẩn Bộ GD&ĐT"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>In đề</span>
          </button>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG 5 PANEL TRUNG TÂM */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActivePanel('panel1')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel1' || activePanel === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panel 1: Ngân Hàng Đề & CT 2018</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs ${
              activePanel === 'panel1' || activePanel === 'overview' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {allPackages.length} đề
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('panel2')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel2' || activePanel === 'ai_tools'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Panel 2: Soạn Thảo & Bóc Tách Đề</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs ${
              activePanel === 'panel2' || activePanel === 'ai_tools' ? 'bg-sky-700 text-sky-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {exam.questions.length} câu
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('panel3')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel3' || activePanel === 'config'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Panel 3: Cấu Hình & Trộn Mã Đề</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs ${
              activePanel === 'panel3' || activePanel === 'config' ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {bundle ? `${bundle.variants.length} mã` : 'Mã ' + activeCode}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('panel4')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel4' || activePanel === 'monitoring'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Panel 4: Giám Sát & Bảng Điểm</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs ${
              activePanel === 'panel4' || activePanel === 'monitoring' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {submissions.length} bài
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('panel5')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel5'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Panel 5: Trung Tâm In Ấn & PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('panel6')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activePanel === 'panel6' || activePanel === 'admin'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Panel 6: Quản Trị Hệ Thống & Phân Quyền</span>
          </button>
        </div>

        {/* Nút thao tác nhanh JSON */}
        <div className="hidden xl:flex items-center gap-2 pr-2">
          <button
            type="button"
            onClick={onOpenTeacherJsonModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quản lý JSON</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL 1: TỔNG QUAN & NGÂN HÀNG ĐỀ THI CHUẨN GDPT 2018                     */}
      {/* ========================================================================= */}
      {(activePanel === 'panel1' || activePanel === 'overview') && (
        <div className="space-y-6">

          {/* THANH ĐIỀU HƯỚNG PHỤ TRONG PANEL 1 */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanel1ViewMode('curriculum_bank')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel1ViewMode === 'curriculum_bank'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>Ngân hàng đề thi GDPT 2018</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                  panel1ViewMode === 'curriculum_bank' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {allPackages.length} đề
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPanel1ViewMode('current_exam_questions')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel1ViewMode === 'current_exam_questions'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Chi tiết câu hỏi đề đang nạp</span>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                  panel1ViewMode === 'current_exam_questions' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {exam.questions.length} câu
                </span>
              </button>
            </div>

            {panel1ViewMode === 'current_exam_questions' && (
              <button
                type="button"
                onClick={() => setPanel1ViewMode('curriculum_bank')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quay lại Ngân hàng đề thi</span>
              </button>
            )}
          </div>

          {panel1ViewMode === 'curriculum_bank' ? (
            <CurriculumExamBank
              currentExam={exam}
              packages={allPackages}
              assignments={allAssignments}
              onSelectPackage={handleSelectPackageAsActive}
              onSavePackage={handleSavePackage}
              onDeletePackage={handleDeleteExamPackage}
              onOpenInEditor={handleOpenInEditor}
              onOpenSaveCurrentExamModal={() => setIsSaveExamModalOpen(true)}
              onAssignExam={handleBankAssignExam}
              onDeleteAssignment={handleDeleteAssignment}
              onPreviewAsStudent={onPreviewAsStudent}
              onOpenPrint={onOpenPrint}
              antiCheatConfig={antiCheatConfig}
              showToast={showToast}
            />
          ) : (
            <div className="space-y-4">
              
              {/* Banner đề đang chọn */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Đề thi đang chọn
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold bg-amber-400/20 text-amber-200">
                      Mã {activeCode}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">{exam.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{exam.subtitle} • {exam.durationMinutes} phút • Thang {exam.totalPoints}đ</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsSaveExamModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition flex items-center gap-1.5 cursor-pointer"
                    title="Lưu cấu trúc đề thi này vào Ngân hàng dữ liệu GDPT 2018"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-slate-950" />
                    <span>💾 Lưu đề này vào Ngân hàng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const matched = allPackages.find((p) => p.code === activeCode || p.title === exam.title);
                      if (matched) {
                        setAssigningPackage(matched);
                      } else {
                        const tempPkg: ExamPackage = {
                          id: exam.id,
                          grade: 12,
                          category: 'survey',
                          categoryLabel: 'Chuẩn Bộ GD&ĐT',
                          chapterId: '12-c1',
                          chapterTitle: 'Chương 1: Vật lí nhiệt & Sóng - Điện',
                          code: activeCode,
                          title: exam.title,
                          subtitle: exam.subtitle,
                          durationMinutes: exam.durationMinutes,
                          totalPoints: exam.totalPoints,
                          difficulty: 'Chuẩn Bộ GD&ĐT',
                          tags: ['Bộ GD&ĐT', 'KaTeX', 'SVG'],
                          svgCount: exam.questions.filter((q) => q.diagram?.type === 'svg').length,
                          katexCount: exam.questions.filter((q) => q.stem.includes('$')).length,
                          examData: exam,
                          createdAt: new Date().toISOString().slice(0, 10),
                        };
                        setAssigningPackage(tempPkg);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Giao đề này cho học sinh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPrint('exam_only')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-white/15"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-300" />
                    <span>In đề</span>
                  </button>
                </div>
              </div>

              {/* Thanh công cụ tìm kiếm và bộ lọc */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                  {/* Lọc theo phần thi */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Phần thi:
                    </span>
                    {(['all', 'Phần I', 'Phần II', 'Phần III'] as const).map((part) => (
                      <button
                        key={part}
                        onClick={() => setSelectedPartFilter(part)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedPartFilter === part
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {part === 'all' ? 'Tất cả câu hỏi' : part}
                        <span className="ml-1 opacity-70">
                          ({part === 'all'
                            ? exam.questions.length
                            : exam.questions.filter((q) => q.part === part).length})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Ô tìm kiếm từ khóa */}
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm nội dung, công thức..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* BỘ LỌC MỨC ĐỘ NHẬN THỨC GDPT 2018 (YÊU CẦU 3) */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mức độ nhận thức:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedCognitiveLevelFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCognitiveLevelFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Tất cả mức độ</span>
                    <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono bg-black/20">
                      {cognitiveStats.total}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCognitiveLevelFilter('NB')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCognitiveLevelFilter === 'NB'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    <span>[NB] Nhận biết</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono ${selectedCognitiveLevelFilter === 'NB' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-800'}`}>
                      {cognitiveStats.nb}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCognitiveLevelFilter('TH')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCognitiveLevelFilter === 'TH'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span>[TH] Thông hiểu</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono ${selectedCognitiveLevelFilter === 'TH' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                      {cognitiveStats.th}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCognitiveLevelFilter('VD')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCognitiveLevelFilter === 'VD'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>[VD] Vận dụng</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono ${selectedCognitiveLevelFilter === 'VD' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
                      {cognitiveStats.vd}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCognitiveLevelFilter('VDC')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedCognitiveLevelFilter === 'VDC'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <span>[VDC] Vận dụng cao</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-3xs font-mono ${selectedCognitiveLevelFilter === 'VDC' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-800'}`}>
                      {cognitiveStats.vdc}
                    </span>
                  </button>
                </div>
              </div>

          {/* Danh sách câu hỏi hiển thị chi tiết */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700">Không tìm thấy câu hỏi phù hợp</div>
                <p className="text-xs text-slate-500">
                  Hãy thử thay đổi bộ lọc phần thi hoặc từ khóa tìm kiếm.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isExpanded = expandedQuestionId === q.id;
                const originalIndex = exam.questions.findIndex((item) => item.id === q.id);
                const qLevel = getQuestionCognitiveLevel(q);

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
                  >
                    {/* Header câu hỏi */}
                    <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center border border-indigo-200">
                          {originalIndex + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{q.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-slate-200 text-slate-700">
                              {q.part}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-3xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {q.topic}
                            </span>
                            <CognitiveLevelBadge level={qLevel} showFullName={true} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">
                          Điểm: <strong className="text-slate-800">{q.points}đ</strong>
                        </span>
                        <button
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Nội dung câu hỏi & KaTeX */}
                    <div className="p-5 space-y-4">
                      <div className="text-sm text-slate-800 leading-relaxed font-medium flex items-start flex-wrap gap-1.5">
                        {(q.part === 'Phần I' || q.part === 'Phần III') && (
                          <CognitiveLevelBadge level={qLevel} showFullName={false} className="mt-0.5" />
                        )}
                        <div className="flex-1 min-w-[280px]">
                          <MathRenderer content={stripCognitiveLevelPrefix(q.stem)} />
                        </div>
                      </div>

                      {/* Hiển thị đồ thị SVG nếu có hoặc đề bài nhắc đến hình vẽ */}
                      {(() => {
                        const resolvedDiagram = resolveQuestionDiagram(q);
                        const mentionsFig = FIGURE_MENTION_REGEX.test(q.stem) || Boolean((q as any).needs_diagram || (q as any).missingPrompt);
                        if (!resolvedDiagram && !mentionsFig) return null;

                        return (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">
                                {resolvedDiagram?.type === 'svg' ? 'Đồ thị Vector SVG:' : resolvedDiagram ? 'Hình ảnh đính kèm:' : 'Sơ đồ hình vẽ đề bài:'}
                              </span>
                              {resolvedDiagram?.type === 'svg' && (
                                <button
                                  onClick={() =>
                                    setSelectedDiagramSourceId(
                                      selectedDiagramSourceId === q.id ? null : q.id
                                    )
                                  }
                                  className="text-3xs font-mono font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                >
                                  {selectedDiagramSourceId === q.id ? 'Ẩn mã SVG' : 'Xem mã nguồn SVG'}
                                </button>
                              )}
                            </div>

                            <div className="max-w-md mx-auto">
                              <DiagramViewer 
                                diagram={resolvedDiagram} 
                                questionId={q.id}
                                questionStem={q.stem}
                                questionTitle={q.title}
                                questionTopic={q.topic}
                                onAttachDiagram={(newDiag) => onUpdateExam(updateQuestionDiagramInExam(exam, q.id, newDiag))}
                                onRemoveDiagram={() => onUpdateExam(updateQuestionDiagramInExam(exam, q.id, null))}
                                canEdit={true}
                                missingPrompt={resolvedDiagram ? undefined : 'Đề bài có nhắc đến hình vẽ nhưng chưa nhúng tệp hình. Giáo viên có thể tải ảnh hoặc yêu cầu AI tạo sơ đồ vector SVG ngay bên dưới.'}
                              />
                            </div>

                            {selectedDiagramSourceId === q.id && resolvedDiagram?.content && (
                              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-3xs rounded-xl overflow-x-auto max-h-48 border border-slate-700">
                                {resolvedDiagram.content}
                              </pre>
                            )}
                          </div>
                        );
                      })()}

                      {/* Hiển thị các phương án đáp án */}
                      {q.type === 'multiple_choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt) => {
                            const isCorrect = opt.id === q.correctAnswer;
                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-medium'
                                    : 'bg-slate-50/50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-3xs shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {opt.id}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer content={opt.text} />
                                </div>
                                {isCorrect && (
                                  <span className="text-2xs font-bold text-emerald-700 shrink-0">
                                    ✓ Đáp án đúng
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hiển thị Phần II: Đúng/Sai */}
                      {q.type === 'true_false_cluster' && (
                        <div className="space-y-2.5 pt-2">
                          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Các nhận định a, b, c, d:</span>
                            <span className="text-3xs text-slate-500 font-medium">Phân hóa 4 mức độ nhận thức (a: NB → b: TH → c: VD → d: VDC)</span>
                          </div>
                          {q.items.map((item, itemIdx) => {
                            const stLevel = getStatementCognitiveLevel(item, itemIdx);
                            return (
                              <div
                                key={item.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                              >
                                <div className="flex items-start gap-2 flex-1">
                                  <span className="font-bold text-slate-800 uppercase font-mono mt-0.5 min-w-[20px]">
                                    {item.id})
                                  </span>
                                  <CognitiveLevelBadge level={stLevel} showFullName={false} className="mt-0.5" />
                                  <div className="text-slate-800 flex-1 leading-relaxed">
                                    <MathRenderer content={stripCognitiveLevelPrefix(item.statement)} />
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-2xs shrink-0 ${
                                    item.correctAnswer
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {item.correctAnswer ? 'ĐÚNG' : 'SAI'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hiển thị Phần III: Trả lời ngắn */}
                      {q.type === 'short_answer' && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-900">
                            Giá trị đáp án chuẩn: <strong className="font-mono text-base font-black text-amber-950">{q.correctValue}</strong> {q.acceptedUnits.join(', ')}
                          </span>
                          <span className="text-2xs text-amber-700">
                            Dung sai cho phép: ±{q.tolerance || 0}
                          </span>
                        </div>
                      )}

                      {/* Lời giải chi tiết khi bấm mở rộng */}
                      {isExpanded && q.explanation && (
                        <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span>Hướng dẫn giải chi tiết & Công thức chìa khóa:</span>
                          </div>
                          <p className="text-slate-700">
                            <MathRenderer content={q.explanation.overview} />
                          </p>
                          {q.explanation.keyFormula && (
                            <div className="p-2.5 bg-white rounded-lg border border-indigo-100 text-center font-mono">
                              <MathRenderer content={`$$${q.explanation.keyFormula}$$`} />
                            </div>
                          )}
                          {q.explanation.stepByStep && q.explanation.stepByStep.length > 0 && (
                            <div className="space-y-1 pt-1 text-slate-700">
                              {q.explanation.stepByStep.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-1.5">
                                  <span className="font-bold text-indigo-600">•</span>
                                  <div>
                                    <MathRenderer content={step} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Hộp thoại giao đề thi nếu kích hoạt từ đề đang nạp */}
      {assigningPackage && (
        <AssignExamModal
          isOpen={true}
          onClose={() => setAssigningPackage(null)}
          examPackage={assigningPackage}
          onConfirmAssignment={handleConfirmAssignment}
          currentAntiCheatConfig={antiCheatConfig}
        />
      )}
    </div>
  )}

      {/* ========================================================================= */}
      {/* PANEL 3: CẤU HÌNH KỲ THI & TRỘN MÃ ĐỀ                                      */}
      {/* ========================================================================= */}
      {(activePanel === 'panel3' || activePanel === 'config') && (
        <div className="space-y-6">

          {/* Thanh chuyển Subtab trong Panel 3 */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanel3Tab('shuffling')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel3Tab === 'shuffling'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shuffle className="w-4 h-4" />
                <span>Tab 3.1: Trộn đề tự động & Sinh ma trận đáp án (101-104)</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel3Tab('anticheat')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel3Tab === 'anticheat'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Tab 3.2: Giám sát thi & Chống gian lận</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel3Tab('settings')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel3Tab === 'settings'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Tab 3.3: Cài đặt thời gian, ngày mở & mật khẩu</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                {bundle ? `${bundle.variants.length} mã đề sẵn sàng` : 'Chưa trộn mã đề'}
              </span>
            </div>
          </div>

          {/* Subtab 3.1: Trộn đề tự động */}
          {panel3Tab === 'shuffling' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <ShufflingTab
                currentExam={exam}
                onApplyBundle={onApplyBundle}
                onOpenPrintMatrix={onOpenPrintMatrix}
              />
            </div>
          )}

          {/* Subtab 3.2: Giám sát thi & Chống gian lận */}
          {panel3Tab === 'anticheat' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <AntiCheatConfigTab
                config={antiCheatConfig}
                onChangeConfig={onChangeAntiCheatConfig}
              />
            </div>
          )}

          {/* Subtab 3.3: Cài đặt thời gian, ngày mở/đóng và mật khẩu */}
          {panel3Tab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Cột trái: Cấu hình đề & Mã đề */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Thẻ 1: Thông tin cơ bản đề thi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Thiết lập Thông tin Đề thi</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiêu đề kỳ thi:</label>
                  <input
                    type="text"
                    value={exam.title}
                    onChange={(e) => onUpdateExam({ ...exam, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả / Đề phụ:</label>
                  <input
                    type="text"
                    value={exam.subtitle}
                    onChange={(e) => onUpdateExam({ ...exam, subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thời gian làm bài (phút):</label>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={exam.durationMinutes}
                      onChange={(e) => onUpdateExam({ ...exam, durationMinutes: Number(e.target.value) || 50 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Khối lớp:</label>
                    <input
                      type="text"
                      value={exam.gradeLevel}
                      onChange={(e) => onUpdateExam({ ...exam, gradeLevel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ 2: Quản lý Mã đề thi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Mã đề & Trộn đề thi</h3>
                </div>
                {bundle && (
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Đã tạo {bundle.variants.length} mã đề
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Mã đề thi đang kích hoạt cho phòng thi:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(availableCodes || ['101']).map((code) => (
                      <button
                        key={code}
                        onClick={() => onSelectExamCode(code)}
                        className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs transition cursor-pointer border ${
                          code === activeCode
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Mã {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenPrintMatrix && bundle && onOpenPrintMatrix(bundle)}
                    disabled={!bundle}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>In ma trận đáp án toàn bộ mã đề</span>
                  </button>

                  <button
                    onClick={onOpenTeacherJsonModal}
                    className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-200"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Tạo thêm mã đề mới</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Cột phải: Cấu hình Chống gian lận & Giám sát thi */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Cấu hình Giám sát Thi & Chống gian lận
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
                  <button
                    onClick={() => handleUpdateAntiCheat('enabled', !antiCheatConfig.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      antiCheatConfig.enabled
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {antiCheatConfig.enabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                  </button>
                </div>
              </div>

              {/* Bộ thiết lập nhanh Presets */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-2xs uppercase tracking-wider font-bold text-slate-500">
                  Bộ thiết lập quy chế nhanh (Presets):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset('strict')}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-rose-400 text-center transition cursor-pointer group shadow-2xs"
                  >
                    <div className="text-xs font-black text-rose-700 group-hover:scale-105 transition-transform">
                      Nghiêm ngặt
                    </div>
                    <div className="text-3xs text-slate-500">Kỳ thi ĐGNL</div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('standard')}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-center transition cursor-pointer group shadow-2xs"
                  >
                    <div className="text-xs font-black text-indigo-700 group-hover:scale-105 transition-transform">
                      Tiêu chuẩn
                    </div>
                    <div className="text-3xs text-slate-500">Kiểm tra định kỳ</div>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('relaxed')}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 text-center transition cursor-pointer group shadow-2xs"
                  >
                    <div className="text-xs font-black text-amber-700 group-hover:scale-105 transition-transform">
                      Linh hoạt
                    </div>
                    <div className="text-3xs text-slate-500">Thi thử ôn tập</div>
                  </button>
                </div>
              </div>

              {/* Các công tắc chi tiết */}
              <div className="space-y-4 pt-1 text-xs">
                
                {/* 1. Toàn màn hình */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Maximize2 className="w-4 h-4 text-indigo-600" />
                      <span>Bắt buộc Chế độ Toàn màn hình</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-relaxed">
                      Yêu cầu học sinh mở toàn màn hình khi làm bài. Khóa màn hình nếu học sinh cố ý thoát ra.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiCheatConfig.requireFullscreen}
                    onChange={(e) => handleUpdateAntiCheat('requireFullscreen', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
                  />
                </div>

                {/* 2. Giám sát chuyển tab */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Cảnh báo & Đếm số lần rời màn hình thi</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-relaxed">
                      Phát hiện sự kiện chuyển tab (visibilitychange) và click chuột ra ngoài cửa sổ thi (window blur).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiCheatConfig.trackTabSwitching}
                    onChange={(e) => handleUpdateAntiCheat('trackTabSwitching', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
                  />
                </div>

                {/* 3. Số lần vi phạm tối đa */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Số lần rời màn hình tối đa trước khi tự động nộp bài:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={antiCheatConfig.maxViolations}
                      onChange={(e) => handleUpdateAntiCheat('maxViolations', Number(e.target.value) || 3)}
                      className="w-16 px-2.5 py-1 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <p className="text-3xs text-rose-600 font-medium">
                    Nếu học sinh vi phạm quá {antiCheatConfig.maxViolations} lần, bài thi sẽ lập tức bị thu bài tự động kèm biên bản vi phạm.
                  </p>
                </div>

                {/* 4. Chặn sao chép & chuột phải */}
                <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Lock className="w-4 h-4 text-rose-500" />
                      <span>Chặn sao chép, chuột phải & phím tắt tra cứu</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-relaxed">
                      Vô hiệu hóa click chuột phải, Ctrl+C, Ctrl+U, Ctrl+P, F12 và bôi đen nội dung câu hỏi.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiCheatConfig.preventCopyAndShortcuts}
                    onChange={(e) => handleUpdateAntiCheat('preventCopyAndShortcuts', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer mt-1"
                  />
                </div>

              </div>
            </div>
          </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 2: SOẠN THẢO & BÓC TÁCH ĐỀ THÔNG MINH                                */}
      {/* ========================================================================= */}
      {(activePanel === 'panel2' || activePanel === 'ai_tools') && (
        <div className="space-y-6">
          
          {/* Thanh chuyển Subtab trong Panel 2 */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanel2Tab('word_import')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel2Tab === 'word_import'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileUp className="w-4 h-4" />
                <span>Tab 2.1: Nhập đề từ tệp Word (.docx / .doc)</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel2Tab('visual_editor')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel2Tab === 'visual_editor'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                <span>Tab 2.2: Trình soạn thảo trực quan & KaTeX</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel2Tab('ai_scan')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel2Tab === 'ai_scan'
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Tab 2.3: AI Quét ảnh trang sách & Tự sinh câu hỏi</span>
              </button>
            </div>

            <span className="text-2xs text-slate-500 font-semibold px-3 py-1 bg-slate-50 rounded-lg hidden md:inline">
              Đề hiện tại: {exam.questions.length} câu hỏi
            </span>
          </div>

          {/* Subtab 2.1: Nhập đề từ tệp Word */}
          {panel2Tab === 'word_import' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-sky-600" />
                  <span>Bóc Tách Đề Thi Từ Tệp Word (.docx) Chuẩn Hóa Sang JSON</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống tự động nhận diện Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng / Sai a,b,c,d), Phần III (Trả lời ngắn),
                  chuyển đổi công thức sang KaTeX và trích xuất hình vẽ Base64/SVG.
                </p>
              </div>

              {/* Vùng thả tệp Word */}
              <div 
                onClick={() => wordFileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isParsingWord
                    ? 'bg-sky-50/80 border-sky-400'
                    : 'border-sky-300 hover:border-sky-500 bg-sky-50/30 hover:bg-sky-50/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs">
                  {isParsingWord ? (
                    <Loader2 className="w-7 h-7 animate-spin text-sky-600" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    {isParsingWord ? 'Đang bóc tách cấu trúc câu hỏi & công thức KaTeX...' : 'Nhấp hoặc kéo thả tệp Word (.docx) vào đây'}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Hỗ trợ tệp đề thi Word của Bộ GD&ĐT, các Sở GD và trường THPT
                  </span>
                </div>

                <input
                  ref={wordFileInputRef}
                  type="file"
                  accept=".docx, .doc, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => e.target.files?.[0] && handleWordFileChange(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {/* Thông báo lỗi nếu có */}
              {wordParseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Không thể phân tích tệp Word</h4>
                    <p className="mt-0.5">{wordParseError}</p>
                  </div>
                </div>
              )}

              {/* Kết quả bóc tách Word */}
              {wordParseResult && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Bóc tách thành công: {wordFile?.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {wordParseResult.summary.totalQuestions} câu hỏi hợp lệ
                    </span>
                  </div>

                  {/* 4 Thống kê phần thi */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-3xs text-slate-500 uppercase font-bold block">Phần I (MCQ)</span>
                      <span className="text-lg font-black text-indigo-600">{wordParseResult.summary.part1Count}</span>
                      <span className="text-3xs text-slate-400 block">câu</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-3xs text-slate-500 uppercase font-bold block">Phần II (Đúng/Sai)</span>
                      <span className="text-lg font-black text-emerald-600">{wordParseResult.summary.part2Count}</span>
                      <span className="text-3xs text-slate-400 block">câu</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-3xs text-slate-500 uppercase font-bold block">Phần III (Ngắn)</span>
                      <span className="text-lg font-black text-amber-600">{wordParseResult.summary.part3Count}</span>
                      <span className="text-3xs text-slate-400 block">câu</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-3xs text-slate-500 uppercase font-bold block">Hình vẽ / Sơ đồ</span>
                      <span className="text-lg font-black text-sky-600">{wordParseResult.summary.imageCount}</span>
                      <span className="text-3xs text-slate-400 block">ảnh</span>
                    </div>
                  </div>

                  {/* Nút hành động áp dụng */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleApplyWordExam}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>✅ Áp dụng vào đề thi hiện tại</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveExamPackage && wordParseResult) {
                          const newPkg: ExamPackage = {
                            id: `pkg-${Date.now()}`,
                            title: wordParseResult.exam.title || 'Đề bóc tách từ Word',
                            subtitle: wordParseResult.exam.subtitle || 'Đề thi bóc tách từ tài liệu Word',
                            grade: 12,
                            category: 'survey',
                            categoryLabel: 'Khảo sát / Thi thử Tốt nghiệp THPT',
                            chapterId: 'ch-dao-dong',
                            chapterTitle: 'Dao động điều hòa',
                            durationMinutes: wordParseResult.exam.durationMinutes || 50,
                            totalPoints: wordParseResult.exam.totalPoints || 10,
                            difficulty: 'Chuẩn Bộ GD&ĐT',
                            code: '101',
                            svgCount: wordParseResult.summary.imageCount,
                            katexCount: wordParseResult.summary.totalQuestions,
                            createdAt: new Date().toISOString(),
                            examData: wordParseResult.exam,
                            tags: ['Word Bóc tách', 'GDPT 2018'],
                          };
                          onSaveExamPackage(newPkg);
                          showToast(`Đã lưu "${newPkg.title}" vào Ngân hàng đề thi!`);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span>💾 Lưu vào Ngân hàng đề</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPanel2Tab('visual_editor')}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <FileEdit className="w-4 h-4 text-sky-600" />
                      <span>Chỉnh sửa trực quan trong Tab 2.2</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtab 2.2: Trình soạn thảo trực quan & KaTeX */}
          {panel2Tab === 'visual_editor' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <TeacherEditor
                currentExam={exam}
                onUpdateExam={(newExam) => {
                  onUpdateExam(newExam);
                  showToast('Đã lưu các thay đổi câu hỏi vào đề thi hiện tại!');
                }}
                onOpenSaveToBank={onOpenSaveToBank}
                onExitToStudentMode={onPreviewAsStudent}
              />
            </div>
          )}

          {/* Subtab 2.3: AI Quét ảnh trang sách & Tự sinh câu hỏi */}
          {panel2Tab === 'ai_scan' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <AIGeneratorTab
                currentExam={exam}
                onAppendQuestions={(newQuestions) => {
                  const updated = {
                    ...exam,
                    questions: [...exam.questions, ...newQuestions],
                  };
                  onUpdateExam(updated);
                  showToast(`Đã thêm thành công ${newQuestions.length} câu hỏi mới từ AI vào đề thi!`);
                }}
                onReplaceExam={(newExam) => {
                  onUpdateExam(newExam);
                  showToast('Đã áp dụng toàn bộ đề thi mới được sinh từ AI!');
                }}
              />
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 4: GIÁM SÁT & BẢNG ĐIỂM                                              */}
      {/* ========================================================================= */}
      {(activePanel === 'panel4' || activePanel === 'monitoring') && (
        <div className="space-y-6">

          {/* Thanh chuyển Subtab trong Panel 4 */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanel4Tab('submissions')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel4Tab === 'submissions'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Tab 4.1: Danh sách bài nộp & Nhật ký vi phạm</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel4Tab('distribution')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel4Tab === 'distribution'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Tab 4.2: Thống kê phổ điểm & Phân tích câu sai</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel4Tab('export_report')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel4Tab === 'export_report'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Tab 4.3: Xuất bảng điểm chi tiết (Excel .xlsx / CSV)</span>
              </button>
            </div>

            <span className="text-2xs text-slate-500 font-bold px-3 py-1 bg-slate-50 rounded-lg">
              {submissions.length} bài nộp đã lưu
            </span>
          </div>
          
          {/* ================================================================= */}
          {/* SUBTAB 4.1: DANH SÁCH BÀI NỘP & NHẬT KÝ VI PHẠM                   */}
          {/* ================================================================= */}
          {panel4Tab === 'submissions' && (
            <div className="space-y-6">
              {/* Hàng 4 thẻ thống kê tổng quan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Tổng số bài thi</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{submissionStats.total}</div>
                  <div className="text-2xs text-slate-500">Đã nộp vào hệ thống</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Điểm trung bình</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {submissionStats.avgScore} <span className="text-xs text-slate-400 font-normal">/ 10đ</span>
                  </div>
                  <div className="text-2xs text-slate-500">Tỉ lệ đạt: {submissionStats.passRate}%</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Cảnh báo vi phạm</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600">{submissionStats.violatedCount}</div>
                  <div className="text-2xs text-rose-500 font-medium">Trường hợp rời tab / cưỡng chế</div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>Xuất báo cáo</span>
                    </div>
                    <div className="text-xs text-slate-600 pt-1">Định dạng Excel .xlsx / CSV chuẩn</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => exportGradebookToExcel(submissions, exam.title)}
                      disabled={submissions.length === 0}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải Excel (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => exportAllSubmissionsToCSV(submissions, exam.title)}
                      disabled={submissions.length === 0}
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                      title="Xuất CSV"
                    >
                      CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Thanh tìm kiếm & lọc danh sách thí sinh */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSubmissionFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      submissionFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({submissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('submitted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      submissionFilter === 'submitted'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Học sinh nộp hợp lệ
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('violated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      submissionFilter === 'violated'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Có ghi nhận vi phạm ({submissionStats.violatedCount})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Tìm tên, lớp hoặc SBD..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Bảng danh sách nộp bài */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-3xs">
                      <tr>
                        <th className="py-3 px-4">Thí sinh & Lớp</th>
                        <th className="py-3 px-4">Mã đề</th>
                        <th className="py-3 px-4">Điểm số</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Tình trạng nộp bài</th>
                        <th className="py-3 px-4">Nhật ký Giám sát</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Chưa có bài thi nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((sub) => {
                          const isAutoPenalized = sub.submissionReason === 'violation_limit_exceeded';

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{sub.studentName}</div>
                                <div className="text-3xs text-slate-500">
                                  Lớp: {sub.studentClass} • SBD: <span className="font-mono">{sub.candidateNumber}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-3xs">
                                  {sub.examCode}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-black text-sm text-indigo-700">
                                  {sub.totalScore.toFixed(2)}đ
                                </div>
                                <div className="text-3xs text-slate-400">{sub.percentage}%</div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="text-slate-700 font-medium">{sub.submittedAt}</div>
                                <div className="text-3xs text-slate-400">
                                  Làm trong: {Math.floor(sub.timeSpentSeconds / 60)}p {sub.timeSpentSeconds % 60}s
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {isAutoPenalized ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    Thu bài cưỡng chế
                                  </span>
                                ) : sub.submissionReason === 'time_expired' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-amber-100 text-amber-800">
                                    Hết giờ tự động nộp
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Chủ động nộp bài
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {sub.violationCount === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    0 vi phạm (Tuân thủ)
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-black border ${
                                      isAutoPenalized
                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    <ShieldAlert className="w-3 h-3" />
                                    {sub.violationCount} lần rời màn hình
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => setInspectingSubmission(sub)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-3xs font-bold transition cursor-pointer"
                                  title="Xem chi tiết các lần vi phạm & bài làm"
                                >
                                  Xem Audit Log
                                </button>

                                <button
                                  onClick={() =>
                                    exportScoreReportToCSV(exam, sub.evaluation, {
                                      name: sub.studentName,
                                      studentClass: sub.studentClass,
                                      candidateNumber: sub.candidateNumber,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-3xs font-semibold transition cursor-pointer"
                                  title="Tải tệp CSV cá nhân"
                                >
                                  Xuất CSV
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
            </div>
          )}

          {/* ================================================================= */}
          {/* SUBTAB 4.2: THỐNG KÊ PHỔ ĐIỂM & PHÂN TÍCH CÂU SAI                 */}
          {/* ================================================================= */}
          {panel4Tab === 'distribution' && (
            <div className="space-y-6">
              
              {/* 5 Thẻ chỉ số tổng quan Phổ điểm */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Điểm cao nhất</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-700">
                    {scoreDistributionData.maxScore.toFixed(2)}đ
                  </div>
                  <div className="text-3xs text-slate-400">Thang điểm 10</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Điểm thấp nhất</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600">
                    {scoreDistributionData.minScore.toFixed(2)}đ
                  </div>
                  <div className="text-3xs text-slate-400">Thang điểm 10</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Điểm trung bình</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {scoreDistributionData.avgScore.toFixed(2)}đ
                  </div>
                  <div className="text-3xs text-slate-400">Toàn bộ {scoreDistributionData.total} bài nộp</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
                  <div className="text-3xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Điểm trung vị (Median)</span>
                  </div>
                  <div className="text-2xl font-black text-blue-700">
                    {scoreDistributionData.medianScore.toFixed(2)}đ
                  </div>
                  <div className="text-3xs text-slate-400">Giá trị trung vị 50%</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
                  <div className="text-3xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tỉ lệ đạt (≥ 5,0đ)</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {scoreDistributionData.passRate}%
                  </div>
                  <div className="text-3xs text-emerald-600 font-medium">Học sinh đạt chuẩn năng lực</div>
                </div>
              </div>

              {/* Biểu đồ Phổ Điểm Thi (Bar Chart) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      <span>Biểu Đồ Phổ Điểm Thi (Score Distribution Bands)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phân bổ số lượng thí sinh theo các khoảng điểm tiêu chuẩn: [0-2), [2-4), [4-5), [5-6.5), [6.5-8), [8-9), [9-10]
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-100 rounded-xl">
                    Tổng số: {scoreDistributionData.total} thí sinh
                  </span>
                </div>

                {/* Khối Cột Biểu Đồ Responsive */}
                <div className="pt-6 pb-2">
                  {scoreDistributionData.total === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Chưa có dữ liệu bài nộp để tạo biểu đồ phổ điểm.
                    </div>
                  ) : (
                    (() => {
                      const maxBandCount = Math.max(...scoreDistributionData.bands.map((b) => b.count), 1);
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-56 px-2 sm:px-4 border-b border-slate-200 pb-2">
                            {scoreDistributionData.bands.map((b, i) => {
                              const heightPct = Math.round((b.count / maxBandCount) * 100);
                              return (
                                <div key={i} className="flex flex-col items-center h-full justify-end group">
                                  {/* Tooltip / Nhãn số lượng trên đỉnh cột */}
                                  <div className="mb-1 text-center opacity-90 group-hover:opacity-100 transition">
                                    <span className="text-xs sm:text-sm font-black text-slate-800 block">
                                      {b.count}
                                    </span>
                                    <span className="text-3xs text-slate-400 block font-medium">
                                      {b.percentage}%
                                    </span>
                                  </div>

                                  {/* Thanh cột */}
                                  <div className="w-full max-w-[56px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end transition-all duration-300">
                                    <div
                                      style={{ height: `${Math.max(heightPct, b.count > 0 ? 8 : 2)}%` }}
                                      className={`w-full rounded-t-xl ${b.color} transition-all duration-500 shadow-sm group-hover:brightness-110`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Nhãn dải điểm trục X */}
                          <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center px-2 sm:px-4">
                            {scoreDistributionData.bands.map((b, i) => (
                              <div key={i} className="space-y-0.5">
                                <span className="font-mono text-2xs sm:text-xs font-black text-slate-800 block">
                                  {b.label}
                                </span>
                                <span className="text-3xs text-slate-500 font-medium block truncate">
                                  {b.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Bảng Phân Tích Câu Sai & Ma Trận Độ Khó Thực Tế */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span>Phân Tích Câu Sai & Ma Trận Độ Khó Thực Tế (Item Mistake Analytics)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường tỉ lệ học sinh trả lời đúng/sai từng câu hỏi, phát hiện các câu hỏi có độ nhiễu cao hoặc bẫy đề thi.
                    </p>
                  </div>
                  <span className="text-2xs text-amber-800 bg-amber-50 border border-amber-200 font-bold px-3 py-1 rounded-xl">
                    Tự động cảnh báo câu hỏi có tỉ lệ sai &gt; 50%
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-3xs">
                      <tr>
                        <th className="py-3 px-3 w-16">Thứ tự</th>
                        <th className="py-3 px-3 w-24">Phần</th>
                        <th className="py-3 px-4">Nội dung tóm tắt</th>
                        <th className="py-3 px-4 w-40">Tỉ lệ trả lời ĐÚNG (%)</th>
                        <th className="py-3 px-4">Thống kê chọn sai phương án</th>
                        <th className="py-3 px-4 text-right">Cảnh báo sư phạm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {questionMistakeAnalytics.map((item) => {
                        const cleanStemText = item.q.stem.replace(/<[^>]*>/g, '').replace(/\\\[|\\\]|\\\(|\\\)/g, '').slice(0, 110);
                        return (
                          <tr key={item.q.id} className={`transition ${item.isHighError ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-slate-50/80'}`}>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              Câu {item.qNum}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-3xs font-bold ${
                                item.part === 'Phần I'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : item.part === 'Phần II'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {item.part}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 line-clamp-2">
                                {cleanStemText}...
                              </div>
                              <div className="text-3xs text-slate-400 mt-0.5">
                                Chủ đề: {item.q.topic || 'Vật lí 12'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    style={{ width: `${item.correctRate}%` }}
                                    className={`h-full rounded-full ${
                                      item.correctRate >= 70
                                        ? 'bg-emerald-500'
                                        : item.correctRate >= 45
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                  />
                                </div>
                                <span className="font-mono font-black text-xs text-slate-800 w-12 text-right">
                                  {item.correctRate}%
                                </span>
                              </div>
                              <div className="text-3xs text-slate-500 mt-0.5">
                                {item.correctCount}/{item.totalSubs} học sinh đúng
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-slate-700 font-mono">
                                {item.wrongSummary}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.isHighError ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Câu hỏi có độ nhiễu cao / Học sinh dễ nhầm lẫn</span>
                                </span>
                              ) : item.errorRate <= 20 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Nắm vững kiến thức</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-slate-100 text-slate-700">
                                  <span>Độ phân hóa tốt</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* SUBTAB 4.3: XUẤT BẢNG ĐIỂM CHI TIẾT (EXCEL .XLSX / CSV)           */}
          {/* ================================================================= */}
          {panel4Tab === 'export_report' && (
            <div className="space-y-6">
              
              {/* Banner Xuất Bảng Điểm Chuẩn Hóa */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-2xs font-bold">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Mẫu Xuất Bảng Điểm Chuẩn Bộ GD&ĐT</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    Bảng Điểm Chi Tiết Kỳ Thi Đánh Giá Năng Lực Vật Lý
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG • TRƯỜNG THPT HÙNG VƯƠNG • NĂM HỌC 2026 - 2027.<br />
                    Tự động phân tách điểm 3 phần (Phần I, Phần II, Phần III), tính tổng điểm thang 10, đếm số lần vi phạm và tự động xếp loại học lực.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => exportGradebookToExcel(submissions, exam.title)}
                    disabled={submissions.length === 0}
                    className="py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>📥 Tải Bảng Điểm Microsoft Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportAllSubmissionsToCSV(submissions, exam.title)}
                    disabled={submissions.length === 0}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Tải tệp CSV UTF-8</span>
                  </button>
                </div>
              </div>

              {/* Bảng Xem Trước Dữ Liệu Bảng Điểm Chuẩn (11 Cột) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Xem trước Bảng điểm chuẩn ({submissions.length} thí sinh)</span>
                  </h4>
                  <span className="text-2xs text-slate-500">
                    Cấu trúc 11 cột khớp với file Excel .xlsx tải về
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-3xs">
                      <tr>
                        <th className="py-3 px-3 text-center">STT</th>
                        <th className="py-3 px-4">Họ và tên học sinh</th>
                        <th className="py-3 px-3 text-center">Lớp</th>
                        <th className="py-3 px-3 text-center">Mã đề thi</th>
                        <th className="py-3 px-3 text-right">Điểm Phần I</th>
                        <th className="py-3 px-3 text-right">Điểm Phần II</th>
                        <th className="py-3 px-3 text-right">Điểm Phần III</th>
                        <th className="py-3 px-4 text-right font-black">TỔNG ĐIỂM (10)</th>
                        <th className="py-3 px-3 text-center">Số lần vi phạm</th>
                        <th className="py-3 px-4">Thời gian nộp bài</th>
                        <th className="py-3 px-3 text-center">Xếp loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400">
                            Chưa có dữ liệu bài nộp nào trong hệ thống.
                          </td>
                        </tr>
                      ) : (
                        submissions.map((sub, idx) => {
                          const p1 = sub.evaluation?.partScores?.['Phần I']?.earned ?? 0;
                          const p2 = sub.evaluation?.partScores?.['Phần II']?.earned ?? 0;
                          const p3 = sub.evaluation?.partScores?.['Phần III']?.earned ?? 0;
                          const total = Number(sub.totalScore.toFixed(2));

                          let rank = 'Chưa đạt';
                          let rankBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                          if (total >= 9.0) {
                            rank = 'Xuất sắc';
                            rankBadge = 'bg-purple-50 text-purple-700 border-purple-200 font-black';
                          } else if (total >= 8.0) {
                            rank = 'Giỏi';
                            rankBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                          } else if (total >= 6.5) {
                            rank = 'Khá';
                            rankBadge = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
                          } else if (total >= 5.0) {
                            rank = 'Trung bình';
                            rankBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                          }

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-4 font-bold text-slate-900">{sub.studentName}</td>
                              <td className="py-3 px-3 text-center font-semibold text-slate-700">{sub.studentClass}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{sub.examCode || '101'}</td>
                              <td className="py-3 px-3 text-right font-mono">{p1.toFixed(2)}</td>
                              <td className="py-3 px-3 text-right font-mono">{p2.toFixed(2)}</td>
                              <td className="py-3 px-3 text-right font-mono">{p3.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right font-black text-indigo-700 text-sm">
                                {total.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {sub.violationCount > 0 ? (
                                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-3xs border border-rose-200">
                                    {sub.violationCount} lần
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 text-3xs font-semibold">0</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-3xs font-mono">{sub.submittedAt}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-3xs border ${rankBadge}`}>
                                  {rank}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Modal xem chi tiết Audit Log của thí sinh */}
          {inspectingSubmission && (
            <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        Nhật ký Giám sát Thi: {inspectingSubmission.studentName}
                      </h4>
                      <p className="text-2xs text-slate-400">
                        Lớp {inspectingSubmission.studentClass} • SBD: {inspectingSubmission.candidateNumber} • Mã đề {inspectingSubmission.examCode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectingSubmission(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                  
                  {/* Tóm tắt tình trạng */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-500 font-bold uppercase block">Điểm đạt:</span>
                      <strong className="text-base font-black text-indigo-700">
                        {inspectingSubmission.totalScore.toFixed(2)} / {inspectingSubmission.maxScore}đ
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-500 font-bold uppercase block">Số lần vi phạm:</span>
                      <strong className={`text-base font-black ${
                        inspectingSubmission.violationCount > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {inspectingSubmission.violationCount} / {inspectingSubmission.auditLog.maxAllowedViolations} lần
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-3xs text-slate-500 font-bold uppercase block">Tình trạng nộp:</span>
                      <strong className="text-xs font-bold text-slate-800">
                        {inspectingSubmission.submissionReason === 'violation_limit_exceeded'
                          ? 'Thu bài cưỡng chế'
                          : 'Học sinh nộp bài'}
                      </strong>
                    </div>
                  </div>

                  {/* Lịch sử vi phạm chi tiết */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Chi tiết các mốc vi phạm quy chế phòng thi:</span>
                      <span className="text-2xs text-slate-500 font-normal">
                        Tổng cộng: {inspectingSubmission.auditLog.violations.length} sự kiện
                      </span>
                    </div>

                    {inspectingSubmission.auditLog.violations.length === 0 ? (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-emerald-800 font-medium">
                        ✓ Tuyệt đối tuân thủ quy chế! Thí sinh không rời khỏi màn hình làm bài trong suốt kỳ thi.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {inspectingSubmission.auditLog.violations.map((v, i) => (
                          <div
                            key={v.id || i}
                            className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3"
                          >
                            <span className="w-6 h-6 rounded-lg bg-rose-200 text-rose-800 font-bold text-3xs flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-900">{v.reason}</span>
                                <span className="text-3xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                  {v.timestamp}
                                </span>
                              </div>
                              <p className="text-3xs text-rose-700">
                                Ghi nhận qua cảm biến trình duyệt (HTML5 Fullscreen / Visibility API).
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() =>
                      exportScoreReportToCSV(exam, inspectingSubmission.evaluation, {
                        name: inspectingSubmission.studentName,
                        studentClass: inspectingSubmission.studentClass,
                        candidateNumber: inspectingSubmission.candidateNumber,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV bài thi này</span>
                  </button>
                  <button
                    onClick={() => setInspectingSubmission(null)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 5: TRUNG TÂM IN ẤN & XUẤT BẢN PDF                                   */}
      {/* ========================================================================= */}
      {activePanel === 'panel5' && (
        <div className="space-y-6">
          
          {/* Thanh chuyển Subtab trong Panel 5 */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPanel5Tab('print_student')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel5Tab === 'print_student'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Tab 5.1: In đề thi học sinh (chuẩn A4 Bộ GD&ĐT)</span>
              </button>

              <button
                type="button"
                onClick={() => setPanel5Tab('print_teacher')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
                  panel5Tab === 'print_teacher'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tab 5.2: In đề kèm lời giải chi tiết & Bảng đáp án</span>
              </button>
            </div>

            <span className="text-2xs text-purple-700 font-bold px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
              Khổ in A4 tiêu chuẩn • KaTeX & SVG sắc nét
            </span>
          </div>

          {/* Subtab 5.1: In đề thi học sinh */}
          {panel5Tab === 'print_student' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Printer className="w-5 h-5 text-purple-600" />
                    <span>In Đề Thi Học Sinh Chuẩn Bộ GD&ĐT (Khổ A4)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Đề thi dành cho thí sinh làm bài trên giấy: gồm tiêu đề trường/sở, số báo danh, 
                    3 phần thi tách biệt, định dạng công thức Toán học KaTeX chuẩn và sơ đồ mạch điện vector SVG sắc nét.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPrint('exam_only')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-purple-500/25 transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Printer className="w-5 h-5" />
                  <span>🖨️ Mở cửa sổ In đề học sinh</span>
                </button>
              </div>

              {/* Thông số kỹ thuật in ấn */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-1.5">
                  <span className="font-bold text-purple-950 block">1. Bố cục & Lề in A4</span>
                  <p className="text-3xs text-purple-800 leading-relaxed">
                    Tối ưu ngắt trang (page-break-inside avoid), chia cột khoa học, phù hợp in 1 mặt hoặc in 2 mặt (in offset / photocopy).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-1.5">
                  <span className="font-bold text-indigo-950 block">2. Độ phân giải Vector</span>
                  <p className="text-3xs text-indigo-800 leading-relaxed">
                    Mọi đồ thị dao động, sơ đồ từ trường và mạch điện SVG được in vector nguyên bản, không bị vỡ nét hay mờ nhòe.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block">3. Phiếu trả lời trắc nghiệm</span>
                  <p className="text-3xs text-slate-600 leading-relaxed">
                    Có thể in kèm khung điền trắc nghiệm tô chì 2025 hoặc phiếu tô đáp án A, B, C, D & Đúng/Sai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 5.2: In đề kèm lời giải chi tiết & Bảng ma trận đáp án */}
          {panel5Tab === 'print_teacher' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>In Đề Thi Kèm Lời Giải Chi Tiết & Bảng Đáp Án Mã Đề</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Bản in dành cho giáo viên chấm thi và phát lời giải chi tiết cho học sinh đối chiếu sau kỳ thi.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPrint('exam_with_solutions')}
                    className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In đề kèm Lời giải</span>
                  </button>

                  {bundle && onOpenPrintMatrix && (
                    <button
                      type="button"
                      onClick={() => onOpenPrintMatrix(bundle)}
                      className="px-4 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Shuffle className="w-4 h-4 text-amber-600" />
                      <span>In Ma trận {bundle.variants.length} mã đề</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Thông tin ma trận đáp án */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Ma trận chấm điểm Phần I, II, III:</span>
                <p className="text-3xs text-slate-600 leading-relaxed">
                  Bao gồm bảng đáp án trắc nghiệm chuẩn Bộ GD&ĐT: Phần I (0.25đ/câu), Phần II tính điểm lũy tiến 
                  (1 ý đúng: 0.1đ; 2 ý đúng: 0.25đ; 3 ý đúng: 0.5đ; 4 ý đúng: 1.0đ), và Phần III dung sai số học.
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 6: QUẢN TRỊ HỆ THỐNG & PHÂN QUYỀN (WEB & USER ADMINISTRATION)       */}
      {/* ========================================================================= */}
      {(activePanel === 'panel6' || activePanel === 'admin') && (
        <UserAdminPanel initialTab={panel6Tab} onNavigateHome={onNavigateHome} />
      )}

      {/* HỘP THOẠI LƯU ĐỀ THI VÀO NGÂN HÀNG GDPT 2018 */}
      {isSaveExamModalOpen && (
        <SaveExamToBankModal
          isOpen={isSaveExamModalOpen}
          onClose={() => setIsSaveExamModalOpen(false)}
          currentExam={exam}
          onSaveExamToBank={handleSavePackage}
        />
      )}

    </div>
  );
};
