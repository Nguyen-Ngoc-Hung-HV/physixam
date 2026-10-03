import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, XCircle, AlertCircle, RotateCcw, Award, 
  FileText, Printer, ChevronDown, ChevronUp, Eye, Check, X,
  Clock, CheckSquare, Sparkles, HelpCircle, Layers, SlidersHorizontal,
  Download, UserCheck, Edit3, ShieldCheck, ShieldAlert, AlertTriangle,
  Lock, Maximize2
} from 'lucide-react';
import { Exam, StudentAnswers, ExamEvaluation } from '../types/exam';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { resolveQuestionDiagram, FIGURE_MENTION_REGEX } from '../utils/diagramResolver';
import { exportScoreReportToCSV, StudentInfo } from '../utils/exportCsv';

interface ExamResultsProps {
  exam: Exam;
  answers: StudentAnswers;
  evaluation: ExamEvaluation;
  onRetake: () => void;
  onOpenTeacherMode: () => void;
  onOpenPrint?: (mode: 'student_report' | 'exam_with_solutions' | 'exam_only') => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  answers,
  evaluation,
  onRetake,
  onOpenTeacherMode,
  onOpenPrint,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'partial' | 'incorrect'>('all');
  const [expandedSolutions, setExpandedSolutions] = useState<{ [qId: string]: boolean }>({});
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: 'Nguyễn Văn A',
    studentClass: '12A1',
    candidateNumber: '120456'
  });
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (qId: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const expandAll = () => {
    const all: { [qId: string]: boolean } = {};
    exam.questions.forEach((q) => { all[q.id] = true; });
    setExpandedSolutions(all);
  };

  const collapseAll = () => {
    setExpandedSolutions({});
  };

  const scrollToSolutions = () => {
    solutionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s} giây`;
  };

  // Đánh giá xếp loại theo thang điểm 10 chuẩn
  const getPerformanceBadge = (score: number, max: number) => {
    const scale10 = max > 0 ? (score / max) * 10 : 0;
    if (scale10 >= 8.5) return { label: 'Xuất sắc (Đạt mức Giỏi - Từ 8,5 đến 10 điểm)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' };
    if (scale10 >= 7.0) return { label: 'Khá (Đạt mức Khá - Từ 7,0 đến 8,4 điểm)', color: 'bg-sky-500/20 text-sky-300 border-sky-400/40' };
    if (scale10 >= 5.0) return { label: 'Đạt yêu cầu (Mức Trung bình - Từ 5,0 đến 6,9 điểm)', color: 'bg-amber-500/20 text-amber-300 border-amber-400/40' };
    return { label: 'Cần ôn luyện thêm (Dưới 5,0 điểm)', color: 'bg-rose-500/20 text-rose-300 border-rose-400/40' };
  };

  const badge = getPerformanceBadge(evaluation.totalScore, evaluation.maxScore);

  // Thống kê số câu đã trả lời
  const answeredCount = exam.questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'multiple_choice') return typeof a === 'string' && a.length > 0;
    if (q.type === 'true_false_cluster') {
      const obj = a as { [key: string]: boolean };
      return Object.keys(obj).length > 0;
    }
    if (q.type === 'short_answer') {
      const obj = a as { value: string; unit: string };
      return obj && obj.value && obj.value.trim().length > 0;
    }
    return false;
  }).length;

  const completionRate = Math.round((answeredCount / exam.questions.length) * 100);

  // Phân nhóm câu hỏi theo từng Phần thi để hiển thị bảng tóm tắt
  const part1Questions = exam.questions.filter((q) => q.part === 'Phần I');
  const part2Questions = exam.questions.filter((q) => q.part === 'Phần II');
  const part3Questions = exam.questions.filter((q) => q.part === 'Phần III');

  // Lọc danh sách câu hỏi ở chế độ Xem lại bài làm
  const filteredQuestions = exam.questions.filter((q) => {
    const res = evaluation.results[q.id];
    if (filter === 'correct') return res.isCorrect;
    if (filter === 'partial') return res.isPartiallyCorrect;
    if (filter === 'incorrect') return !res.isCorrect && !res.isPartiallyCorrect;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. BANNER CHÚC MỪNG VÀ BẢNG ĐIỂM CHÍNH THỨC */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Barem Chấm Điểm Bộ GD&ĐT 2025</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {exam.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Thời gian làm bài: <strong className="text-white">{formatTime(evaluation.timeSpentSeconds)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tỉ lệ hoàn thành: <strong className="text-white">{completionRate}%</strong> ({answeredCount}/{exam.questions.length} câu)</span>
              </div>
            </div>

            <div className="pt-2">
              <span className={`inline-block px-3.5 py-1 rounded-xl text-xs font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Khối Điểm số Toàn phần */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center min-w-[220px] shrink-0 shadow-lg">
            <div className="text-xs uppercase tracking-widest text-indigo-200 font-bold">
              Điểm Tổng Kết
            </div>
            <div className="text-5xl sm:text-6xl font-black text-white mt-1.5 tracking-tight font-mono">
              {evaluation.totalScore.toFixed(2)}
              <span className="text-2xl font-bold text-slate-400">/{evaluation.maxScore.toFixed(2)}</span>
            </div>
            <div className="text-xs font-bold text-indigo-300 mt-2 bg-white/10 py-1 px-2.5 rounded-lg inline-block">
              Đạt {evaluation.percentage}% số điểm tối đa
            </div>
          </div>
        </div>

        {/* Thông tin thí sinh & Thanh tác vụ: Nút Xem lại bài làm, Tải bảng điểm, In phiếu điểm */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-4">
          
          {/* Hàng thông tin học sinh */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/15 text-xs text-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Thí sinh: <strong className="text-white font-medium">{studentInfo.name}</strong></span>
              <span className="text-slate-400">•</span>
              <span>Lớp: <strong className="text-white font-mono">{studentInfo.studentClass}</strong></span>
              <span className="text-slate-400">•</span>
              <span>SBD: <strong className="text-white font-mono">{studentInfo.candidateNumber}</strong></span>
            </div>

            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="inline-flex items-center gap-1 text-2xs text-indigo-200 hover:text-white underline cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingInfo ? 'Đóng chỉnh sửa' : 'Đổi thông tin học sinh'}</span>
            </button>
          </div>

          {/* Form đổi thông tin học sinh nếu bật */}
          {isEditingInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/90 p-3 rounded-xl border border-white/20 text-xs animate-in fade-in duration-150">
              <div>
                <label className="block text-2xs text-slate-400 mb-1">Họ và tên thí sinh:</label>
                <input
                  type="text"
                  value={studentInfo.name}
                  onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                  className="w-full px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white font-medium focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-2xs text-slate-400 mb-1">Lớp:</label>
                <input
                  type="text"
                  value={studentInfo.studentClass}
                  onChange={(e) => setStudentInfo({ ...studentInfo, studentClass: e.target.value })}
                  className="w-full px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white font-medium focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-2xs text-slate-400 mb-1">Số báo danh:</label>
                <input
                  type="text"
                  value={studentInfo.candidateNumber}
                  onChange={(e) => setStudentInfo({ ...studentInfo, candidateNumber: e.target.value })}
                  className="w-full px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white font-medium focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>
          )}

          {/* Các nút thao tác xuất báo cáo & in ấn */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={scrollToSolutions}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Xem lại bài làm</span>
              </button>

              {/* Tải bảng điểm Excel / CSV */}
              <button
                onClick={() => {
                  exportScoreReportToCSV(exam, evaluation, studentInfo);
                  setDownloadSuccess(true);
                  setTimeout(() => setDownloadSuccess(false), 3000);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
                title="Tải bảng điểm sang file Excel CSV với mã hóa UTF-8 BOM"
              >
                <Download className="w-4 h-4" />
                <span>{downloadSuccess ? '✓ Đã tải file CSV' : 'Tải bảng điểm (Excel / CSV)'}</span>
              </button>

              {/* In phiếu kết quả học sinh */}
              <button
                onClick={() => onOpenPrint ? onOpenPrint('student_report') : window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md transition cursor-pointer"
                title="In phiếu báo điểm chuẩn A4 cho học sinh"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu kết quả học sinh</span>
              </button>

              {/* In đề kèm đáp án */}
              <button
                onClick={() => onOpenPrint ? onOpenPrint('exam_with_solutions') : window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer"
                title="In toàn bộ đề thi kèm theo đáp án và lời giải chi tiết"
              >
                <FileText className="w-4 h-4" />
                <span>In đề kèm đáp án</span>
              </button>

              <button
                onClick={onRetake}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <span>Làm lại</span>
              </button>
            </div>

            <button
              onClick={onOpenTeacherMode}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md transition cursor-pointer"
            >
              <span>⬅ Trở về màn hình Giáo viên</span>
            </button>
          </div>
        </div>
      </div>

      {/* KHỐI NHẬT KÝ GIÁM SÁT THI (AUDIT LOG & INTEGRITY TRAIL) */}
      {evaluation.auditLog && (
        <div className={`rounded-2xl border p-5 transition-all shadow-xs ${
          evaluation.auditLog.submissionReason === 'violation_limit_exceeded'
            ? 'bg-rose-50/90 border-rose-300'
            : evaluation.auditLog.violationCount > 0
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-emerald-50/70 border-emerald-300'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                evaluation.auditLog.submissionReason === 'violation_limit_exceeded'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : evaluation.auditLog.violationCount > 0
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-emerald-600 text-white shadow-sm'
              }`}>
                {evaluation.auditLog.submissionReason === 'violation_limit_exceeded' ? (
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800">
                    Nhật ký Giám sát & Tính minh bạch bài thi (Audit Log)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    evaluation.auditLog.submissionReason === 'violation_limit_exceeded'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : evaluation.auditLog.violationCount > 0
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {evaluation.auditLog.submissionReason === 'violation_limit_exceeded'
                      ? 'Thu bài cưỡng chế do vi phạm quy chế'
                      : evaluation.auditLog.violationCount > 0
                      ? `Có ${evaluation.auditLog.violationCount} lần cảnh báo`
                      : 'Tuyệt đối tuân thủ quy chế'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi nhận toàn bộ sự kiện chuyển tab, rời cửa sổ làm bài và chế độ toàn màn hình
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium self-end sm:self-auto">
              <span className="text-slate-600">Số lần rời màn hình:</span>
              <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs ${
                evaluation.auditLog.violationCount >= evaluation.auditLog.maxAllowedViolations
                  ? 'bg-rose-600 text-white'
                  : evaluation.auditLog.violationCount > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {evaluation.auditLog.violationCount} / {evaluation.auditLog.maxAllowedViolations} lần
              </span>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Tình trạng nộp bài:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                {evaluation.auditLog.submissionReason === 'violation_limit_exceeded' ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Tự động thu bài (Quá số lần vi phạm)
                  </span>
                ) : evaluation.auditLog.submissionReason === 'time_expired' ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Hết giờ thi (Tự động nộp)
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Thí sinh chủ động nộp bài
                  </span>
                )}
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Chế độ Toàn màn hình:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
                {evaluation.auditLog.isFullscreenRequired ? 'Bắt buộc & Đã giám sát' : 'Tùy chọn'}
              </p>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-slate-500 font-medium">Chặn sao chép & Phím tắt:</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                {evaluation.auditLog.copyProtectionEnabled ? 'Đã bật bảo vệ bản quyền' : 'Không khóa'}
              </p>
            </div>
          </div>

          {/* Danh sách chi tiết thời điểm vi phạm nếu có */}
          {evaluation.auditLog.violations.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-slate-200/60 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Chi tiết các thời điểm ghi nhận vi phạm trong phiên làm bài:
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {evaluation.auditLog.violations.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="flex items-center justify-between text-xs bg-white/95 px-3 py-1.5 rounded-lg border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium text-slate-800">{v.reason}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0 bg-slate-100 px-2 py-0.5 rounded">
                      {v.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. BẢNG TỔNG HỢP CHI TIẾT TỪNG PHẦN THEO BAREM BỘ GD&ĐT */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Bảng thống kê điểm số theo cấu trúc đề thi Bộ GD&ĐT 2025</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Thang điểm: 10.0
          </span>
        </div>

        {/* ================= BẢNG PHẦN I ================= */}
        {part1Questions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="font-bold text-sm text-slate-800">
                  Phần I: Trắc nghiệm 4 lựa chọn
                </h3>
                <span className="text-2xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  0,25 điểm / câu đúng
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Đạt: <span className="text-indigo-600 font-mono text-sm">{evaluation.partScores['Phần I']?.earned || 0}</span> / {evaluation.partScores['Phần I']?.max || 0} điểm
                ({part1Questions.filter((q) => evaluation.results[q.id]?.isCorrect).length}/{part1Questions.length} câu đúng)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-200 uppercase text-3xs">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Câu</th>
                    <th className="py-2.5 px-4">Tên câu hỏi</th>
                    <th className="py-2.5 px-4 w-32 text-center">Lựa chọn của bạn</th>
                    <th className="py-2.5 px-4 w-32 text-center">Đáp án chuẩn</th>
                    <th className="py-2.5 px-4 w-28 text-center">Trạng thái</th>
                    <th className="py-2.5 px-4 w-24 text-right">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {part1Questions.map((q, idx) => {
                    const res = evaluation.results[q.id];
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700">Q{idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 truncate max-w-xs">{q.title}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold">
                          <span className={res.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {res.userAnswerSummary}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-700">
                          {res.correctAnswerSummary}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {res.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-3xs">
                              <Check className="w-3 h-3" /> Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-3xs">
                              <X className="w-3 h-3" /> Sai
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          +{res.earnedPoints.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= BẢNG PHẦN II (LŨY TIẾN) ================= */}
        {part2Questions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-sm text-slate-800">
                  Phần II: Trắc nghiệm Đúng/Sai lũy tiến
                </h3>
                <span className="text-2xs font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                  Barem: 1 ý=0,1đ | 2 ý=0,25đ | 3 ý=0,5đ | 4 ý=1,0đ
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Đạt: <span className="text-amber-600 font-mono text-sm">{evaluation.partScores['Phần II']?.earned || 0}</span> / {evaluation.partScores['Phần II']?.max || 0} điểm
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-200 uppercase text-3xs">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Câu</th>
                    <th className="py-2.5 px-4">Tên câu hỏi</th>
                    <th className="py-2.5 px-4 text-center">Kết quả từng lệnh hỏi (a, b, c, d)</th>
                    <th className="py-2.5 px-4 w-32 text-center">Số ý đúng</th>
                    <th className="py-2.5 px-4 w-28 text-center">Đánh giá</th>
                    <th className="py-2.5 px-4 w-24 text-right">Điểm theo barem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {part2Questions.map((q, idx) => {
                    const res = evaluation.results[q.id];
                    const itemBreakdown = res.detail?.itemBreakdown || {};
                    const correctCount = res.detail?.correctCount ?? 0;

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-700">Q{part1Questions.length + idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="truncate max-w-xs">{q.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {['a', 'b', 'c', 'd'].map((subId) => {
                              const it = itemBreakdown[subId];
                              const isMatch = it?.match;
                              return (
                                <span
                                  key={subId}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-mono font-bold border ${
                                    isMatch
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                  title={`Ý ${subId}: Bạn chọn ${it?.user === undefined ? 'Chưa chọn' : it?.user ? 'Đúng' : 'Sai'} | Đáp án chuẩn: ${it?.correct ? 'Đúng' : 'Sai'}`}
                                >
                                  {subId}) {it?.user === undefined ? '—' : it?.user ? 'Đ' : 'S'}
                                  {isMatch ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <X className="w-2.5 h-2.5 text-rose-600" />}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">
                          {correctCount} / 4 ý
                        </td>
                        <td className="py-3 px-4 text-center">
                          {res.isCorrect ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-3xs">
                              Đúng trọn vẹn
                            </span>
                          ) : res.isPartiallyCorrect ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-3xs">
                              Đúng một phần
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-3xs">
                              0 ý đúng
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          +{res.earnedPoints.toFixed(2)}đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= BẢNG PHẦN III (TRẢ LỜI NGẮN) ================= */}
        {part3Questions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="font-bold text-sm text-slate-800">
                  Phần III: Trắc nghiệm Trả lời ngắn
                </h3>
                <span className="text-2xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  0,25 điểm / câu đúng
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700">
                Đạt: <span className="text-emerald-600 font-mono text-sm">{evaluation.partScores['Phần III']?.earned || 0}</span> / {evaluation.partScores['Phần III']?.max || 0} điểm
                ({part3Questions.filter((q) => evaluation.results[q.id]?.isCorrect).length}/{part3Questions.length} câu đúng)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-200 uppercase text-3xs">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Câu</th>
                    <th className="py-2.5 px-4">Tên câu hỏi</th>
                    <th className="py-2.5 px-4 text-center">Câu trả lời của bạn</th>
                    <th className="py-2.5 px-4 text-center">Đáp án chuẩn</th>
                    <th className="py-2.5 px-4 w-28 text-center">Trạng thái</th>
                    <th className="py-2.5 px-4 w-24 text-right">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {part3Questions.map((q, idx) => {
                    const res = evaluation.results[q.id];
                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-4 text-center font-bold text-slate-700">Q{part1Questions.length + part2Questions.length + idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 truncate max-w-xs">{q.title}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold">
                          <span className={res.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {res.userAnswerSummary}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-indigo-700">
                          {res.correctAnswerSummary}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {res.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-3xs">
                              <Check className="w-3 h-3" /> Chính xác
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-3xs">
                              <X className="w-3 h-3" /> Chưa đúng
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          +{res.earnedPoints.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. MÀN HÌNH XEM LẠI BÀI LÀM & LỜI GIẢI CHI TIẾT TỪNG BƯỚC */}
      <div ref={solutionsRef} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden scroll-mt-6">
        
        {/* Tiêu đề & Bộ lọc trạng thái */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              <span>Xem lại bài làm & Lời giải chi tiết từng câu</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quan sát đồ thị hình vẽ, kiểm tra đáp án của bạn và nghiên cứu từng bước biến đổi KaTeX chuẩn mực.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ lọc theo màu sắc chỉ báo */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả ({exam.questions.length})
              </button>
              <button
                onClick={() => setFilter('correct')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === 'correct' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Đúng ({exam.questions.filter((q) => evaluation.results[q.id]?.isCorrect).length})</span>
              </button>
              <button
                onClick={() => setFilter('partial')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === 'partial' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Một phần ({exam.questions.filter((q) => evaluation.results[q.id]?.isPartiallyCorrect).length})</span>
              </button>
              <button
                onClick={() => setFilter('incorrect')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Sai ({exam.questions.filter((q) => !evaluation.results[q.id]?.isCorrect && !evaluation.results[q.id]?.isPartiallyCorrect).length})</span>
              </button>
            </div>

            <button
              onClick={expandAll}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Mở rộng
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>

        {/* Danh sách từng câu hỏi và lời giải chi tiết */}
        <div className="divide-y divide-slate-200">
          {filteredQuestions.map((q, idx) => {
            const res = evaluation.results[q.id];
            const isExpanded = expandedSolutions[q.id] ?? true;

            // Xác định màu sắc chỉ báo trực quan
            let statusBadge = {
              label: 'Chưa chính xác (0 điểm)',
              bg: 'bg-rose-50 text-rose-700 border-rose-200',
              icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
            };

            if (res.isCorrect) {
              statusBadge = {
                label: `Đúng hoàn toàn (+${res.earnedPoints.toFixed(2)} điểm)`,
                bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              };
            } else if (res.isPartiallyCorrect) {
              statusBadge = {
                label: `Đúng một phần (+${res.earnedPoints.toFixed(2)} / ${res.maxPoints} điểm)`,
                bg: 'bg-amber-50 text-amber-800 border-amber-200',
                icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              };
            }

            return (
              <div key={q.id} className="p-6 space-y-4 hover:bg-slate-50/40 transition">
                {/* Thanh trạng thái câu */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-base">
                      Câu {idx + 1}
                    </span>
                    <span className="text-2xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {q.part === 'Phần I' ? 'Phần I: Trắc nghiệm 4 lựa chọn' : q.part === 'Phần II' ? 'Phần II: Đúng/Sai' : 'Phần III: Trả lời ngắn'}
                    </span>
                    <span className="text-2xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {q.topic}
                    </span>

                    {/* Huy hiệu kết quả kèm màu sắc chuẩn */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-0.5 rounded-full border shadow-2xs ${statusBadge.bg}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => toggleExpand(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Đề bài câu hỏi với KaTeX */}
                <div className="text-sm text-slate-800 leading-relaxed font-medium">
                  <MathRenderer content={q.stem} />
                </div>

                {/* Sơ đồ véc-tơ hoặc hình ảnh nếu có hoặc khi có đề cập [Hình vẽ] */}
                {(() => {
                  const resolved = resolveQuestionDiagram(q);
                  const mentionsFig = FIGURE_MENTION_REGEX.test(q.stem);
                  if (!resolved && !mentionsFig) return null;
                  return (
                    <div className="max-w-2xl mx-auto my-3">
                      <DiagramViewer 
                        diagram={resolved} 
                        canEdit={false}
                        missingPrompt={resolved ? undefined : 'Đề bài có nhắc đến hình vẽ nhưng chưa nhúng tệp hình. Vui lòng xem trong tài liệu phát kèm.'}
                      />
                    </div>
                  );
                })()}

                {/* Chi tiết từng nhận định a, b, c, d của Phần II */}
                {q.type === 'true_false_cluster' && (
                  <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-700 mb-1">Chi tiết đánh giá 4 lệnh hỏi:</div>
                    {(q as any).items?.map((it: any) => {
                      const userTf = res.detail?.itemBreakdown?.[it.id]?.user;
                      const isMatch = res.detail?.itemBreakdown?.[it.id]?.match;
                      return (
                        <div key={it.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="font-bold uppercase text-slate-700 shrink-0 font-mono">{it.id})</span>
                            <div className="text-slate-800">
                              <MathRenderer content={it.statement} />
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5 font-bold">
                            <span className={`px-2 py-0.5 rounded text-3xs ${
                              it.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              Chuẩn: {it.correctAnswer ? 'ĐÚNG' : 'SAI'}
                            </span>
                            {userTf !== undefined && (
                              <span className={`px-2 py-0.5 rounded text-3xs flex items-center gap-1 ${
                                isMatch ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
                              }`}>
                                Bạn: {userTf ? 'Đ' : 'S'}
                                {isMatch ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-600" />}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hộp so sánh đáp án của học sinh và đáp án chính thức */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 block mb-1">Câu trả lời đã nộp:</span>
                    <span className={`font-mono font-bold text-sm ${res.isCorrect ? 'text-emerald-700' : res.isPartiallyCorrect ? 'text-amber-700' : 'text-rose-700'}`}>
                      {res.userAnswerSummary}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block mb-1">Đáp án chính thức:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      {res.correctAnswerSummary}
                    </span>
                  </div>
                </div>

                {/* Khối lời giải chi tiết và biến đổi KaTeX */}
                {isExpanded && q.explanation && (
                  <div className="mt-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>Hướng dẫn giải chi tiết & Các bước suy luận</span>
                    </div>

                    {q.explanation.overview && (
                      <p className="text-sm text-slate-700 leading-relaxed">
                        <MathRenderer content={q.explanation.overview} />
                      </p>
                    )}

                    {q.explanation.keyFormula && (
                      <div className="p-3 bg-white rounded-xl border border-indigo-200 text-center overflow-x-auto shadow-2xs">
                        <span className="text-2xs font-bold text-indigo-600 block uppercase mb-1">Công thức then chốt</span>
                        <MathRenderer content={`$$${q.explanation.keyFormula}$$`} />
                      </div>
                    )}

                    {q.explanation.stepByStep && q.explanation.stepByStep.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-2xs font-bold text-slate-600 uppercase">Các bước giải chi tiết:</span>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-indigo-100/70">
                          {q.explanation.stepByStep.map((step, sIdx) => (
                            <li key={sIdx} className="pl-1">
                              <MathRenderer content={step} />
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
