/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { samplePhysicsExam } from './data/sampleExams';
import { initialSampleSubmissions } from './data/sampleSubmissions';
import { 
  Exam, StudentAnswers, ExamEvaluation, ExamVariantBundle, 
  AntiCheatConfig, ExamAuditLog, ViolationEvent, StudentSubmission,
  DiagramData 
} from './types/exam';
import { evaluateExam } from './utils/grading';
import { ExamHeader } from './components/ExamHeader';
import { QuestionPalette } from './components/QuestionPalette';
import { QuestionCard } from './components/QuestionCard';
import { ExamResults } from './components/ExamResults';
import { TeacherDashboard, DashboardPanel } from './components/TeacherDashboard';
import { HomepagePortal, PanelId } from './components/HomepagePortal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { BackgroundTheme, getSavedTheme, saveTheme } from './utils/themeStorage';
import { StudentExamLaunch } from './components/StudentExamLaunch';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { SaveExamToBankModal } from './components/SaveExamToBankModal';
import { FormulaSheetModal } from './components/FormulaSheetModal';
import { ScientificCalculatorModal } from './components/ScientificCalculatorModal';
import { PrintModal, PrintMode } from './components/PrintModal';
import { AntiCheatMonitor } from './components/AntiCheatMonitor';
import { getSavedBundle } from './utils/shuffler';
import { getSavedAntiCheatConfig, createInitialAuditLog } from './utils/antiCheat';
import { getSavedCurrentExam, saveCurrentExam, updateQuestionDiagramInExam } from './utils/examStorage';
import { ExamPackage, ExamAssignmentInfo } from './types/curriculum';
import { getSavedExamPackages, saveExamPackagesToStorage } from './data/curriculumData';
import { safeStorage } from './utils/safeStorage';
import { decompressExamFromHash } from './utils/examShareUrl';

export default function App() {
  // ĐỀ THI HIỆN TẠI (Được lưu bền vững trong safeStorage)
  const [exam, setExam] = useState<Exam>(() => getSavedCurrentExam(samplePhysicsExam));
  const [bundle, setBundle] = useState<ExamVariantBundle | null>(() => getSavedBundle());

  // NGÂN HÀNG ĐỀ THI GDPT 2018 & BÀI THI ĐÃ GIAO
  const [examPackages, setExamPackages] = useState<ExamPackage[]>(() => getSavedExamPackages());
  const [assignments, setAssignments] = useState<ExamAssignmentInfo[]>(() => {
    try {
      const raw = safeStorage.getItem('physixam_assignments');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  // HỆ THỐNG HAI CHẾ ĐỘ (DUAL-MODE SYSTEM): MẶC ĐỊNH LÀ CHẾ ĐỘ GIÁO VIÊN
  const [appRole, setAppRole] = useState<'teacher' | 'student'>('teacher');

  // TRẠNG THÁI GIAO DIỆN GIÁO VIÊN: TRANG CHỦ PORTAL HOẶC WORKSPACE TẬP TRUNG THEO PANEL
  const [teacherView, setTeacherView] = useState<'portal' | 'workspace'>('portal');
  const [currentPanel, setCurrentPanel] = useState<DashboardPanel>('panel1');
  const [initialSubtabIndex, setInitialSubtabIndex] = useState<number>(0);

  // TÙY BIẾN HÌNH NỀN HỆ THỐNG (Lưu vĩnh viễn trong localStorage)
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(() => getSavedTheme());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // TRẠNG THÁI TRONG CHẾ ĐỘ HỌC SINH (LÀM BÀI / XEM KẾT QUẢ)
  const [studentExamPhase, setStudentExamPhase] = useState<'student_taking' | 'student_results'>('student_taking');
  const [hasStartedExam, setHasStartedExam] = useState<boolean>(false);

  // THÔNG TIN THÍ SINH
  const [candidateInfo, setCandidateInfo] = useState<{
    name: string;
    studentClass: string;
    candidateNumber: string;
  }>({
    name: 'Thí sinh kiểm tra',
    studentClass: '12A1',
    candidateNumber: 'SBD-12001',
  });

  // DANH SÁCH BÀI NỘP CỦA HỌC SINH (CHO PANEL 4 GIÁM SÁT & BẢNG ĐIỂM)
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const raw = safeStorage.getItem('physixam_submissions');
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialSampleSubmissions;
  });

  // CẤU HÌNH GIÁM SÁT THI & CHỐNG GIAN LẬN
  const [antiCheatConfig, setAntiCheatConfig] = useState<AntiCheatConfig>(() => getSavedAntiCheatConfig());
  const [auditLog, setAuditLog] = useState<ExamAuditLog>(() => createInitialAuditLog(getSavedAntiCheatConfig()));

  // TIẾN ĐỘ VÀ CÂU TRẢ LỜI CỦA HỌC SINH
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<Set<string>>(new Set());
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(() => exam.durationMinutes * 60);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<ExamEvaluation | null>(null);

  // HỘP THOẠI CÔNG CỤ
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isSaveExamModalOpen, setIsSaveExamModalOpen] = useState<boolean>(false);
  const [globalToastMessage, setGlobalToastMessage] = useState<string | null>(null);

  const showGlobalToast = (msg: string) => {
    setGlobalToastMessage(msg);
    setTimeout(() => setGlobalToastMessage(null), 3500);
  };

  const [printConfig, setPrintConfig] = useState<{ isOpen: boolean; mode: PrintMode }>({
    isOpen: false,
    mode: 'exam_only',
  });

  // Lưu danh sách bài nộp vào safeStorage
  useEffect(() => {
    try {
      safeStorage.setItem('physixam_submissions', JSON.stringify(submissions));
    } catch (err) {
      console.error('Không thể lưu submissions vào safeStorage:', err);
    }
  }, [submissions]);

  // Lưu danh sách bài thi đã giao vào safeStorage
  useEffect(() => {
    try {
      safeStorage.setItem('physixam_assignments', JSON.stringify(assignments));
    } catch (err) {
      console.error('Không thể lưu assignments vào safeStorage:', err);
    }
  }, [assignments]);

  // TỰ ĐỘNG GIẢI NÉN ĐỀ THI TỪ URL (#exam=... hoặc ?exam=... hoặc mã bài thi) ĐỂ VÀO THI TRỰC TIẾP
  useEffect(() => {
    const handleUrlHashOrQuery = () => {
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        let loadedExam: Exam | null = null;
        let detectedAccessCode: string | null = null;

        // A. Kiểm tra #exam=... hoặc ?exam=... (Nén LZ-String hoặc Base64 tự chứa toàn bộ đề)
        if (hash.includes('exam=')) {
          const rawHashPart = hash.split('exam=')[1]?.split('&')[0];
          if (rawHashPart) {
            loadedExam = decompressExamFromHash(rawHashPart);
          }
        } else if (search.includes('exam=')) {
          const params = new URLSearchParams(search);
          const rawQueryPart = params.get('exam');
          if (rawQueryPart) {
            loadedExam = decompressExamFromHash(rawQueryPart);
          }
        }

        // B. Kiểm tra #code=... hoặc ?code=...
        if (!loadedExam) {
          const codeMatch = hash.match(/code=([^&]+)/) || search.match(/code=([^&]+)/);
          if (codeMatch && codeMatch[1]) {
            detectedAccessCode = decodeURIComponent(codeMatch[1]);
          }
        }

        // C. Kiểm tra #exam-PHY-... (mã chia sẻ liên kết cũ)
        if (!loadedExam && hash.startsWith('#exam-')) {
          detectedAccessCode = hash.substring(6);
        }

        // Nếu có mã bài thi, tìm trong danh sách đề thi ngân hàng hoặc assignments
        if (!loadedExam && detectedAccessCode) {
          const cleanCode = detectedAccessCode.trim().toLowerCase();
          const foundInBank = examPackages.find(
            (p) => p.code.toLowerCase() === cleanCode || p.id.toLowerCase() === cleanCode
          );
          if (foundInBank) {
            loadedExam = foundInBank.examData;
          } else {
            const foundAssign = assignments.find((a) => a.accessCode.toLowerCase() === cleanCode);
            if (foundAssign) {
              const matchedPkg = examPackages.find((p) => p.id === foundAssign.examId);
              if (matchedPkg) loadedExam = matchedPkg.examData;
            }
          }
        }

        // Nếu tìm thấy hoặc giải nén thành công đề thi từ URL:
        if (loadedExam) {
          setExam(loadedExam);
          setTimeRemainingSeconds((loadedExam.durationMinutes || 45) * 60);
          setAnswers({});
          setFlaggedQuestionIds(new Set());
          setCurrentQuestionIndex(0);
          setEvaluation(null);
          // Tự động chuyển thẳng sang Chế độ Học sinh làm bài (không cần đăng nhập, không cookie)
          setAppRole('student');
          setStudentExamPhase('student_taking');
          setHasStartedExam(false);
          showGlobalToast(`Đã nạp đề thi "${loadedExam.title}" thành công!`);
        } else if (hash.includes('role=student') || search.includes('role=student') || search.includes('mode=student')) {
          setAppRole('student');
          setStudentExamPhase('student_taking');
          setHasStartedExam(false);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra URL hash/query:', err);
      }
    };

    handleUrlHashOrQuery();
    window.addEventListener('hashchange', handleUrlHashOrQuery);
    return () => window.removeEventListener('hashchange', handleUrlHashOrQuery);
  }, [examPackages, assignments]);

  // Lưu hoặc cập nhật gói đề thi trong ngân hàng
  const handleSaveExamPackage = (newPkg: ExamPackage) => {
    setExamPackages((prev) => {
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
    showGlobalToast(`Đã lưu thành công đề thi '${newPkg.title}' vào Ngân hàng đề (Khối ${newPkg.grade})!`);
  };

  // Xóa gói đề thi khỏi ngân hàng
  const handleDeleteExamPackage = (pkgId: string) => {
    setExamPackages((prev) => {
      const updated = prev.filter((p) => p.id !== pkgId);
      saveExamPackagesToStorage(updated);
      return updated;
    });
    showGlobalToast('Đã xóa đề thi khỏi Ngân hàng đề thành công!');
  };

  // Chọn gói đề thi làm đề khảo thí hiện hành
  const handleSelectExamPackage = (pkg: ExamPackage) => {
    setExam(pkg.examData);
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(pkg.examData.durationMinutes * 60);
    setEvaluation(null);
    setStudentExamPhase('student_taking');
  };

  // Giao đề thi cho học sinh
  const handleAssignExam = (pkg: ExamPackage, assignment: ExamAssignmentInfo, switchToStudent: boolean) => {
    setAssignments((prev) => [assignment, ...prev.filter((a) => a.id !== assignment.id)]);
    
    // Cập nhật cấu hình giám sát thi
    const newAntiCheat: AntiCheatConfig = {
      ...antiCheatConfig,
      enabled: assignment.antiCheatEnabled,
      requireFullscreen: assignment.requireFullscreen,
      maxViolations: assignment.maxViolations,
      preventCopyAndShortcuts: assignment.preventCopyAndShortcuts,
    };
    setAntiCheatConfig(newAntiCheat);
    setAuditLog(createInitialAuditLog(newAntiCheat));

    // Nạp đề thi vào hệ thống
    setExam(pkg.examData);
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(pkg.examData.durationMinutes * 60);
    setEvaluation(null);

    // Cập nhật thông tin thí sinh
    setCandidateInfo((prev) => ({
      ...prev,
      studentClass: assignment.className,
    }));

    if (switchToStudent) {
      setAppRole('student');
      setStudentExamPhase('student_taking');
      setHasStartedExam(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Xóa bài thi đã giao
  const handleDeleteAssignment = (assignId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignId));
  };

  const handleOpenPrint = (printMode: PrintMode = 'exam_only') => {
    setPrintConfig({
      isOpen: true,
      mode: printMode,
    });
  };

  // Đổi mã đề thi
  const handleSelectExamCode = (code: string) => {
    if (!bundle) {
      setExam((prev) => ({ ...prev, code }));
      return;
    }
    const targetVariant = bundle.variants.find((v) => v.code === code);
    if (!targetVariant) return;
    setExam(targetVariant);
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(targetVariant.durationMinutes * 60);
    setEvaluation(null);
    setStudentExamPhase('student_taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Áp dụng bộ mã đề mới từ Quản lý đề thi / Trộn đề
  const handleApplyBundle = (newBundle: ExamVariantBundle) => {
    setBundle(newBundle);
    if (newBundle.variants.length > 0) {
      const first = newBundle.variants[0];
      setExam(first);
      setAnswers({});
      setFlaggedQuestionIds(new Set());
      setCurrentQuestionIndex(0);
      setTimeRemainingSeconds(first.durationMinutes * 60);
      setEvaluation(null);
      setStudentExamPhase('student_taking');
    }
  };

  // Mở hộp thoại in ma trận đáp án
  const handleOpenPrintMatrix = (targetBundle: ExamVariantBundle) => {
    setBundle(targetBundle);
    setPrintConfig({
      isOpen: true,
      mode: 'all_variants_with_matrix',
    });
  };

  // Đồng hồ đếm ngược: CHỈ CHẠY KHI ĐANG Ở CHẾ ĐỘ HỌC SINH VÀ ĐÃ BẤM BẮT ĐẦU
  useEffect(() => {
    if (appRole !== 'student' || studentExamPhase !== 'student_taking' || isPaused || !hasStartedExam) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam('time_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appRole, studentExamPhase, isPaused, hasStartedExam, exam, answers, auditLog]);

  // Xử lý thay đổi câu trả lời
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Đánh dấu xem lại
  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Ghi nhận vi phạm từ bộ giám sát thi
  const handleRecordViolation = (event: ViolationEvent) => {
    setAuditLog((prev) => ({
      ...prev,
      violationCount: prev.violationCount + 1,
      totalTabExits: prev.totalTabExits + 1,
      violations: [...prev.violations, event],
    }));
  };

  // Nộp bài và chấm điểm tự động
  const handleSubmitExam = (
    reason: 'student_submitted' | 'violation_limit_exceeded' | 'time_expired' = 'student_submitted'
  ) => {
    const timeSpent = Math.max(0, exam.durationMinutes * 60 - timeRemainingSeconds);
    const result = evaluateExam(exam, answers, timeSpent);
    
    // Đính kèm nhật ký giám sát vào kết quả bài thi
    const finalAuditLog = {
      ...auditLog,
      submissionReason: reason,
    };
    result.auditLog = finalAuditLog;

    setEvaluation(result);
    setStudentExamPhase('student_results');

    // Lưu bài nộp vào danh sách để giáo viên quản lý ở Panel 4
    const currentCodeStr: string = exam.code || (bundle && bundle.variants[0]?.code) || '101';
    const newSubmission: StudentSubmission = {
      id: `sub-${Date.now()}`,
      studentName: candidateInfo.name,
      studentClass: candidateInfo.studentClass,
      candidateNumber: candidateInfo.candidateNumber,
      examTitle: exam.title,
      examCode: currentCodeStr,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      timeSpentSeconds: timeSpent,
      submittedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - Vừa xong',
      submissionReason: reason,
      violationCount: finalAuditLog.violationCount,
      auditLog: finalAuditLog,
      evaluation: result,
      answers,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);

    // Thoát toàn màn hình nếu đang bật
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bắt đầu làm bài thi từ màn hình chuẩn bị
  const handleStartExam = (info: { name: string; studentClass: string; candidateNumber: string }) => {
    setCandidateInfo(info);
    setHasStartedExam(true);
    setAuditLog(createInitialAuditLog(antiCheatConfig));
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(exam.durationMinutes * 60);
    setStudentExamPhase('student_taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Làm lại bài thi
  const handleRetake = () => {
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(exam.durationMinutes * 60);
    setEvaluation(null);
    setAuditLog(createInitialAuditLog(antiCheatConfig));
    setHasStartedExam(false);
    setStudentExamPhase('student_taking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Thoát ra Chế độ Giáo viên một cách an toàn và dứt khoát
  const handleExitToTeacherMode = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setAppRole('teacher');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chuyển sang xem trước đề với tư cách Học sinh (1-click)
  const handlePreviewAsStudent = () => {
    setAppRole('student');
    setStudentExamPhase('student_taking');
    setHasStartedExam(false); // Đưa về màn hình chuẩn bị sẵn sàng làm bài
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cập nhật cấu hình chống gian lận
  const handleChangeAntiCheatConfig = (newConfig: AntiCheatConfig) => {
    setAntiCheatConfig(newConfig);
    setAuditLog(createInitialAuditLog(newConfig));
  };

  // Cập nhật đề thi mới
  const handleUpdateExam = (newExam: Exam) => {
    setExam(newExam);
    saveCurrentExam(newExam);
    setTimeRemainingSeconds(newExam.durationMinutes * 60);
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setEvaluation(null);
    setAuditLog(createInitialAuditLog(antiCheatConfig));
    setHasStartedExam(false);
  };

  // Cập nhật hoặc gỡ bỏ hình vẽ / sơ đồ cho một câu hỏi cụ thể (lưu bền vững)
  const handleUpdateQuestionDiagram = (questionId: string, diagram: DiagramData | null) => {
    setExam((prev) => updateQuestionDiagramInExam(prev, questionId, diagram));
  };

  // Nạp đề thi cho học sinh theo mã bài thi rút gọn
  const handleLoadExamByCode = (code: string): boolean => {
    const trimmed = code.trim().toLowerCase();
    const found = examPackages.find(
      (p) => p.code.toLowerCase() === trimmed || p.id.toLowerCase() === trimmed
    );
    if (found) {
      setExam(found.examData);
      setTimeRemainingSeconds((found.examData.durationMinutes || 45) * 60);
      setAnswers({});
      setFlaggedQuestionIds(new Set());
      setCurrentQuestionIndex(0);
      setEvaluation(null);
      setHasStartedExam(false);
      showGlobalToast(`Đã nạp đề thi "${found.title}" [Mã: ${found.code}] thành công!`);
      return true;
    }
    const foundAssign = assignments.find(
      (a) => a.accessCode.toLowerCase() === trimmed || a.examCode?.toLowerCase() === trimmed
    );
    if (foundAssign) {
      const pkg = examPackages.find((p) => p.id === foundAssign.examId);
      if (pkg) {
        setExam(pkg.examData);
        setTimeRemainingSeconds((pkg.examData.durationMinutes || 45) * 60);
        setAnswers({});
        setFlaggedQuestionIds(new Set());
        setCurrentQuestionIndex(0);
        setEvaluation(null);
        setHasStartedExam(false);
        showGlobalToast(`Đã nạp bài thi lớp ${foundAssign.className}!`);
        return true;
      }
    }
    return false;
  };

  // Nạp đề thi tùy chỉnh do học sinh dán trực tiếp (JSON hoặc URL #exam=...)
  const handleLoadCustomExamFromStudent = (customExam: Exam) => {
    setExam(customExam);
    setTimeRemainingSeconds((customExam.durationMinutes || 45) * 60);
    setAnswers({});
    setFlaggedQuestionIds(new Set());
    setCurrentQuestionIndex(0);
    setEvaluation(null);
    setHasStartedExam(false);
    showGlobalToast(`Đã nạp đề thi "${customExam.title}" thành công!`);
  };

  // TÙY BIẾN HÌNH NỀN VÀ ĐIỀU HƯỚNG PANEL
  const handleSelectTheme = (newTheme: BackgroundTheme) => {
    setCurrentTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleNavigateToPanel = (panel: PanelId, subtabIndex?: number) => {
    setCurrentPanel(panel);
    setInitialSubtabIndex(subtabIndex ?? 0);
    setTeacherView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAccessStudent = (code: string) => {
    const loaded = handleLoadExamByCode(code);
    if (loaded) {
      handlePreviewAsStudent();
    } else {
      showGlobalToast(`Không tìm thấy bài thi với mã "${code}". Vui lòng thử lại!`);
    }
  };

  const activeExamCode: string = exam.code || (bundle && bundle.variants[0]?.code) || '101';
  const availableCodesList = bundle ? bundle.variants.map((v) => v.code || '') : ['101', '102', '103', '104'];

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        currentTheme.type === 'preset' ? currentTheme.cssClass : 'bg-slate-100/70 text-slate-800'
      }`}
      style={currentTheme.type === 'custom' ? currentTheme.style : undefined}
    >
      
      {/* THANH ĐIỀU HƯỚNG ĐẦU TRANG CÓ BỘ CHUYỂN ĐỔI VAI TRÒ */}
      <ExamHeader
        exam={exam}
        answers={answers}
        timeRemainingSeconds={timeRemainingSeconds}
        isPaused={isPaused}
        onSubmit={handleSubmitExam}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
        onOpenTeacherManagement={() => setIsTeacherModalOpen(true)}
        onOpenPrint={() => handleOpenPrint('exam_only')}
        onOpenSaveToBank={() => setIsSaveExamModalOpen(true)}
        activeCode={activeExamCode}
        availableCodes={availableCodesList}
        onSelectCode={handleSelectExamCode}
        antiCheatConfig={antiCheatConfig}
        violationCount={auditLog.violationCount}
        appRole={appRole}
        onChangeAppRole={(role) => {
          if (role === 'teacher') {
            handleExitToTeacherMode();
          } else {
            handlePreviewAsStudent();
          }
        }}
        onExitToTeacherMode={handleExitToTeacherMode}
        hasStartedExam={hasStartedExam}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onQuickAccessStudent={handleQuickAccessStudent}
        onNavigateHome={() => setTeacherView('portal')}
        isHomeView={appRole === 'teacher' && teacherView === 'portal'}
      />

      {/* BỘ GIÁM SÁT THI & CHỐNG GIAN LẬN: CHỈ KÍCH HOẠT KHI Ở CHẾ ĐỘ HỌC SINH ĐANG LÀM BÀI */}
      <AntiCheatMonitor
        config={antiCheatConfig}
        isActive={appRole === 'student' && studentExamPhase === 'student_taking'}
        hasStarted={hasStartedExam}
        onStartExamFullscreen={() => setHasStartedExam(true)}
        onExitToTeacherMode={handleExitToTeacherMode}
        violationCount={auditLog.violationCount}
        onRecordViolation={(event) => handleRecordViolation(event)}
        onAutoSubmitExam={(reason) => handleSubmitExam(reason)}
      />

      {/* VÙNG NỘI DUNG CHÍNH */}
      <main
        onContextMenu={(e) => {
          if (appRole === 'student' && hasStartedExam && antiCheatConfig.enabled && antiCheatConfig.preventCopyAndShortcuts) {
            e.preventDefault();
          }
        }}
        className={`flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 ${
          appRole === 'student' && hasStartedExam && antiCheatConfig.enabled && antiCheatConfig.preventCopyAndShortcuts
            ? 'anti-cheat-protected'
            : ''
        }`}
      >
        
        {/* ========================================================================= */}
        {/* 1. CHẾ ĐỘ GIÁO VIÊN / MÁY CHỦ: PORTAL TRANG CHỦ HOẶC WORKSPACE THEO PANEL */}
        {/* ========================================================================= */}
        {appRole === 'teacher' && teacherView === 'portal' && (
          <HomepagePortal
            exam={exam}
            examPackages={examPackages}
            assignments={assignments}
            submissions={submissions}
            onNavigateToPanel={handleNavigateToPanel}
            onSelectExamPackage={handleSelectExamPackage}
            onOpenSaveToBank={() => setIsSaveExamModalOpen(true)}
            onPreviewAsStudent={handlePreviewAsStudent}
            onQuickAccessStudent={handleQuickAccessStudent}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
          />
        )}

        {appRole === 'teacher' && teacherView === 'workspace' && (
          <TeacherDashboard
            exam={exam}
            onUpdateExam={handleUpdateExam}
            onPreviewAsStudent={handlePreviewAsStudent}
            bundle={bundle}
            onApplyBundle={handleApplyBundle}
            onOpenPrint={handleOpenPrint}
            onOpenPrintMatrix={handleOpenPrintMatrix}
            onOpenTeacherJsonModal={() => setIsTeacherModalOpen(true)}
            antiCheatConfig={antiCheatConfig}
            onChangeAntiCheatConfig={handleChangeAntiCheatConfig}
            submissions={submissions}
            activeCode={activeExamCode}
            availableCodes={availableCodesList}
            onSelectExamCode={handleSelectExamCode}
            examPackages={examPackages}
            onSaveExamPackage={handleSaveExamPackage}
            onDeleteExamPackage={handleDeleteExamPackage}
            onOpenSaveToBank={() => setIsSaveExamModalOpen(true)}
            assignments={assignments}
            onAssignExam={handleAssignExam}
            onSelectExamPackage={handleSelectExamPackage}
            onDeleteAssignment={handleDeleteAssignment}
            initialPanel={currentPanel}
            initialSubtabIndex={initialSubtabIndex}
            onNavigateHome={() => setTeacherView('portal')}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. CHẾ ĐỘ HỌC SINH LÀM BÀI (STUDENT EXAMINATION VIEW)                     */}
        {/* ========================================================================= */}
        {appRole === 'student' && (
          <>
            {/* Giai đoạn A: Thí sinh chuẩn bị vào phòng thi (Chưa bấm Bắt đầu) */}
            {studentExamPhase === 'student_taking' && !hasStartedExam && (
              <StudentExamLaunch
                exam={exam}
                activeCode={activeExamCode}
                antiCheatConfig={antiCheatConfig}
                onStartExam={handleStartExam}
                onStartWithoutFullscreen={(info) => {
                  setCandidateInfo(info);
                  setHasStartedExam(true);
                  setAuditLog(createInitialAuditLog({ ...antiCheatConfig, requireFullscreen: false }));
                  setAnswers({});
                  setFlaggedQuestionIds(new Set());
                  setCurrentQuestionIndex(0);
                  setTimeRemainingSeconds(exam.durationMinutes * 60);
                  setStudentExamPhase('student_taking');
                }}
                onExitToTeacherMode={handleExitToTeacherMode}
                onLoadExamByCode={handleLoadExamByCode}
                onLoadCustomExam={handleLoadCustomExamFromStudent}
              />
            )}

            {/* Giai đoạn B: Thí sinh đang làm bài thi */}
            {studentExamPhase === 'student_taking' && hasStartedExam && (
              <div className="space-y-4">
                {/* Thẻ định danh Thí sinh & Thủy ấn số bảo mật phòng thi */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl px-4 sm:px-5 py-2.5 text-white border border-indigo-500/30 shadow-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                    <div className="text-xs">
                      <span className="text-slate-400 font-medium">Thí sinh: </span>
                      <strong className="text-white font-black text-sm">{candidateInfo.name}</strong>
                      <span className="mx-2 text-slate-600">•</span>
                      <span className="text-slate-400 font-medium">Lớp: </span>
                      <strong className="text-sky-300 font-bold">{candidateInfo.studentClass}</strong>
                      <span className="mx-2 text-slate-600">•</span>
                      <span className="text-slate-400 font-medium">SBD: </span>
                      <span className="text-amber-400 font-mono font-bold">{candidateInfo.candidateNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-2xs font-mono text-slate-300 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                    <span>MÃ ĐỀ: <strong className="text-emerald-400">{activeExamCode}</strong></span>
                    <span className="text-slate-500">•</span>
                    <span>BÀI LÀM ĐÃ ĐƯỢC ĐÓNG DẤU ĐỊNH DANH</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
                  {/* Cột trái: Bảng điều hướng câu hỏi */}
                  <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
                    <QuestionPalette
                      exam={exam}
                      currentQuestionIndex={currentQuestionIndex}
                      onSelectQuestion={(idx) => setCurrentQuestionIndex(idx)}
                      answers={answers}
                      flaggedQuestionIds={flaggedQuestionIds}
                      onToggleFlag={handleToggleFlag}
                    />
                  </div>

                  {/* Cột chính: Khối hiển thị câu hỏi, sơ đồ và phương án trả lời */}
                  <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 relative">
                    {/* Chìm mờ thủy ấn (Watermark) trên bài thi học sinh */}
                    <div className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.035] overflow-hidden">
                      <div className="text-center font-black text-4xl sm:text-6xl -rotate-12 tracking-wider text-slate-900 whitespace-nowrap">
                        {candidateInfo.name} • {candidateInfo.studentClass} • {candidateInfo.candidateNumber}
                      </div>
                    </div>

                    {exam.questions[currentQuestionIndex] && (
                      <QuestionCard
                        question={exam.questions[currentQuestionIndex]}
                        index={currentQuestionIndex}
                        totalQuestions={exam.questions.length}
                        answers={answers}
                        onAnswerChange={handleAnswerChange}
                        isFlagged={flaggedQuestionIds.has(exam.questions[currentQuestionIndex].id)}
                        onToggleFlag={() => handleToggleFlag(exam.questions[currentQuestionIndex].id)}
                        onPrev={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        onNext={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                        onUpdateQuestionDiagram={handleUpdateQuestionDiagram}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Giai đoạn C: Báo cáo kết quả & Lời giải chi tiết sau khi nộp */}
            {studentExamPhase === 'student_results' && evaluation && (
              <ExamResults
                exam={exam}
                answers={answers}
                evaluation={evaluation}
                onRetake={handleRetake}
                onOpenTeacherMode={handleExitToTeacherMode}
                onOpenPrint={(printMode) => handleOpenPrint(printMode)}
              />
            )}
          </>
        )}

      </main>

      {/* HỘP THOẠI QUẢN LÝ ĐỀ THI (JSON & BUILDER) */}
      <TeacherManagementModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        currentExam={exam}
        onUpdateExam={handleUpdateExam}
        onOpenPrint={(printMode) => handleOpenPrint(printMode)}
        onApplyBundle={handleApplyBundle}
        onOpenPrintMatrix={handleOpenPrintMatrix}
        antiCheatConfig={antiCheatConfig}
        onChangeAntiCheatConfig={handleChangeAntiCheatConfig}
        onOpenSaveToBank={() => setIsSaveExamModalOpen(true)}
      />

      {/* HỘP THOẠI LƯU ĐỀ THI VÀO NGÂN HÀNG DỮ LIỆU GDPT 2018 */}
      {isSaveExamModalOpen && (
        <SaveExamToBankModal
          isOpen={isSaveExamModalOpen}
          onClose={() => setIsSaveExamModalOpen(false)}
          currentExam={exam}
          onSaveExamToBank={handleSaveExamPackage}
        />
      )}

      {/* Toast thông báo toàn cục */}
      {globalToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>{globalToastMessage}</span>
        </div>
      )}

      {/* HỘP THOẠI IN ĐỀ THI & XUẤT PDF */}
      <PrintModal
        isOpen={printConfig.isOpen}
        onClose={() => setPrintConfig((prev) => ({ ...prev, isOpen: false }))}
        exam={exam}
        mode={printConfig.mode}
        evaluation={evaluation}
        answers={answers}
        bundle={bundle}
      />

      {/* SỔ TAY TRA CỨU CÔNG THỨC VẬT LÍ */}
      <FormulaSheetModal
        isOpen={isFormulaSheetOpen}
        onClose={() => setIsFormulaSheetOpen(false)}
      />

      {/* MÁY TÍNH KHOA HỌC BỎ TÚI */}
      <ScientificCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* MODAL TÙY BIẾN HÌNH NỀN HỆ THỐNG */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* CHÂN TRANG ỨNG DỤNG */}
      <footer className="mt-auto py-4 px-6 border-t border-slate-200 bg-white/70 text-center text-xs text-slate-500">
        PhysiXam - Hệ thống Quản trị & Khảo thí Trực tuyến môn Vật lí THPT • Hỗ trợ song song Chế độ Giáo viên & Học sinh
      </footer>

    </div>
  );
}
