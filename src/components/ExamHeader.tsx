import React, { useState, useRef } from 'react';
import { 
  Timer, AlertTriangle, BookOpen, Calculator, CheckCircle2, 
  FileText, Printer, Shuffle, ChevronDown, Check, ShieldCheck, 
  ShieldAlert, ArrowLeft, Play, UserCheck, Shield, BookmarkCheck,
  Palette, Camera, Home, KeyRound, Sparkles
} from 'lucide-react';
import { Exam, StudentAnswers, AntiCheatConfig } from '../types/exam';
import { getSavedCustomLogo, saveCustomLogo } from '../utils/themeStorage';

interface ExamHeaderProps {
  exam: Exam;
  answers: StudentAnswers;
  timeRemainingSeconds: number;
  isPaused: boolean;
  onTogglePause?: () => void;
  onSubmit: () => void;
  onOpenCalculator: () => void;
  onOpenFormulaSheet: () => void;
  onOpenTeacherManagement: () => void;
  onOpenPrint: () => void;
  onOpenSaveToBank?: () => void;
  onOpenShareExam?: () => void;
  activeCode?: string;
  availableCodes?: string[];
  onSelectCode?: (code: string) => void;
  antiCheatConfig?: AntiCheatConfig;
  violationCount?: number;
  appRole?: 'teacher' | 'student';
  onChangeAppRole?: (role: 'teacher' | 'student') => void;
  onExitToTeacherMode?: () => void;
  hasStartedExam?: boolean;
  onOpenThemeModal?: () => void;
  onQuickAccessStudent?: (code: string) => void;
  onNavigateHome?: () => void;
  isHomeView?: boolean;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  exam,
  answers,
  timeRemainingSeconds,
  onSubmit,
  onOpenCalculator,
  onOpenFormulaSheet,
  onOpenTeacherManagement,
  onOpenPrint,
  onOpenSaveToBank,
  onOpenShareExam,
  activeCode,
  availableCodes,
  onSelectCode,
  antiCheatConfig,
  violationCount = 0,
  appRole = 'student',
  onChangeAppRole,
  onExitToTeacherMode,
  hasStartedExam = true,
  onOpenThemeModal,
  onQuickAccessStudent,
  onNavigateHome,
  isHomeView = false,
}) => {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [pendingCodeSwitch, setPendingCodeSwitch] = useState<string | null>(null);

  // Logo tùy chỉnh của giáo viên lưu trong safeStorage / localStorage
  const [customLogo, setCustomLogo] = useState<string | null>(() => getSavedCustomLogo());
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Ô nhập mã truy cập nhanh
  const [quickCode, setQuickCode] = useState<string>('');

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCustomLogo(dataUrl);
        saveCustomLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCode.trim()) return;
    if (onQuickAccessStudent) {
      onQuickAccessStudent(quickCode.trim());
      setQuickCode('');
    }
  };

  // Tính số câu đã hoàn thành
  const answeredCount = exam.questions.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'multiple_choice') return typeof a === 'string' && a.length > 0;
    if (q.type === 'true_false_cluster') {
      const obj = a as { [key: string]: boolean };
      return Object.keys(obj).length === 4;
    }
    if (q.type === 'short_answer') {
      const obj = a as { value: string; unit: string };
      return obj && obj.value && obj.value.trim().length > 0;
    }
    return false;
  }).length;

  const totalQuestions = exam.questions.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Định dạng mm:ss
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = timeRemainingSeconds < 300; // Dưới 5 phút

  const currentCode = exam.code || activeCode || '101';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo hình tròn & Tiêu đề thương hiệu hệ thống */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Vỏ bọc Logo tròn 48px - 56px với hiệu ứng tải ảnh */}
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-indigo-200/80 shadow-md relative group cursor-pointer overflow-hidden bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 flex items-center justify-center shrink-0 transition-transform hover:scale-105"
              title="Nhấp để tải lên Logo hình tròn của giáo viên (PNG, JPG, SVG)"
            >
              {customLogo ? (
                <img 
                  src={customLogo} 
                  alt="Logo Hệ Thống" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="text-white flex items-center justify-center relative w-full h-full">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 animate-[spin_12s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" transform="rotate(30 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" transform="rotate(90 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="currentColor" transform="rotate(150 12 12)" />
                  </svg>
                </div>
              )}

              {/* Lớp phủ camera khi rê chuột */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-full">
                <Camera className="w-4 h-4" />
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <div 
                onClick={onNavigateHome}
                className="cursor-pointer group flex items-center gap-1.5"
                title="Nhấp để trở về Trang chủ Portal"
              >
                <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition truncate max-w-[240px] sm:max-w-md lg:max-w-xl">
                  HỆ THỐNG KHẢO THÍ & HỌC TẬP VẬT LÍ TRỰC TUYẾN
                </h1>
              </div>

              <p className="text-3xs sm:text-2xs text-slate-500 font-medium truncate max-w-[260px] sm:max-w-lg mt-0.5">
                NĂM HỌC 2026 - 2027 • Bộ sách Kết nối tri thức với cuộc sống
              </p>
            </div>
          </div>

          {/* VÙNG ĐIỀU KHIỂN NHANH TRÊN HEADER */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-wrap">
            
            {/* Nút trở về Trang chủ nếu đang trong Workspace hoặc phòng thi */}
            {onNavigateHome && !isHomeView && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                title="Quay lại Trang chủ Portal"
              >
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            )}

            {/* Nút Đổi hình nền trang chủ */}
            {onOpenThemeModal && (
              <button
                type="button"
                onClick={onOpenThemeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shadow-2xs"
                title="Chọn giao diện hoặc tải ảnh nền trang chủ"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">🎨 Đổi hình nền</span>
              </button>
            )}

            {/* Ô Vào thi nhanh bằng mã đề */}
            {onQuickAccessStudent && (
              <form onSubmit={handleQuickSubmit} className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <KeyRound className="w-3 h-3 text-slate-400 ml-2" />
                <input
                  type="text"
                  placeholder="Mã bài thi..."
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  className="w-20 px-1.5 py-1 text-xs font-mono font-bold bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-3xs transition cursor-pointer shrink-0"
                >
                  Vào thi
                </button>
              </form>
            )}

            {/* BỘ CHUYỂN ĐỔI VAI TRÒ TRUNG TÂM (TOP ROLE SWITCHER) */}
            {onChangeAppRole && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => onChangeAppRole('teacher')}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    appRole === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👨‍🏫 Giáo viên</span>
                </button>
                <button
                  onClick={() => onChangeAppRole('student')}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    appRole === 'student'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👨‍🎓 Học sinh</span>
                </button>
              </div>
            )}

            {/* NÚT THAO TÁC KHI Ở CHẾ ĐỘ GIÁO VIÊN */}
            {appRole === 'teacher' && (
              <div className="hidden sm:flex items-center gap-1.5">
                {onOpenSaveToBank && (
                  <button
                    type="button"
                    onClick={onOpenSaveToBank}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                    title="Lưu đề thi hiện tại vào Ngân hàng đề thi GDPT 2018"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-indigo-100" />
                    <span>Lưu đề</span>
                  </button>
                )}
                {onOpenShareExam && (
            <button
              type="button"
              onClick={onOpenShareExam}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm transition"
              title="Chia sẻ mã phòng và mã QR cho học sinh"
            >
              <span>📱</span>
              <span>Chia sẻ đề & QR</span>
            </button>
          )}

                {onOpenTeacherManagement && (
                  <button
                    type="button"
                    onClick={onOpenTeacherManagement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Soạn & Nhập đề</span>
                  </button>
                )}

                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={onOpenPrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden xl:inline">In đề</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onChangeAppRole && onChangeAppRole('student')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden xl:inline">Xem trước đề</span>
                </button>
              </div>
            )}

            {/* NÚT THAO TÁC KHI Ở CHẾ ĐỘ HỌC SINH */}
            {appRole === 'student' && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Sổ tay công thức */}
                {onOpenFormulaSheet && (
                  <button
                    type="button"
                    onClick={onOpenFormulaSheet}
                    title="Sổ tay công thức Vật lí"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Công thức</span>
                  </button>
                )}

                {/* Máy tính bỏ túi */}
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={onOpenCalculator}
                    title="Máy tính khoa học Vật lí"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Máy tính</span>
                  </button>
                )}

                {/* In đề thi */}
                {onOpenPrint && (
                  <button
                    type="button"
                    onClick={onOpenPrint}
                    title="In đề thi / Xuất PDF"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden md:inline">In đề</span>
                  </button>
                )}

                {/* Đang làm bài: Đồng hồ đếm ngược và Nộp bài */}
                {hasStartedExam && (
                  <>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-2xs ${
                        isUrgent
                          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <Timer className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-600' : 'text-indigo-600'}`} />
                      <span>{timeFormatted}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSubmitConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Nộp bài</span>
                    </button>
                  </>
                )}

                {/* Nút thoát về chế độ giáo viên nếu có */}
                {onExitToTeacherMode && (
                  <button
                    type="button"
                    onClick={onExitToTeacherMode}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    title="Quay lại Bảng điều khiển Giáo viên"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span className="hidden xl:inline">Về Giáo viên</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Hộp thoại xác nhận nộp bài */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bạn có chắc chắn muốn nộp bài?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Sau khi nộp bài, hệ thống sẽ tự động chấm điểm và hiển thị toàn bộ đáp án kèm lời giải chi tiết.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600">Số câu đã hoàn thành:</span>
                    <span className="text-emerald-700">{answeredCount} trên {totalQuestions} câu</span>
                  </div>
                  {unansweredCount > 0 && (
                    <div className="flex justify-between font-semibold text-rose-600">
                      <span>Số câu chưa làm:</span>
                      <span>{unansweredCount} câu</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                    <span>Thời gian còn lại:</span>
                    <span>{timeFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  onSubmit();
                }}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận đổi mã đề thi */}
      {pendingCodeSwitch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <Shuffle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác nhận chuyển sang Mã đề {pendingCodeSwitch}?</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Đổi mã đề thi sẽ đặt lại các câu trả lời hiện tại để bạn bắt đầu làm đề thi theo thứ tự hoán vị và đáp án của <strong>Mã đề {pendingCodeSwitch}</strong>.
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Lưu ý: Bạn đã hoàn thành <strong>{answeredCount} câu</strong> ở mã đề hiện tại.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setPendingCodeSwitch(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (pendingCodeSwitch && onSelectCode) {
                    onSelectCode(pendingCodeSwitch);
                  }
                  setPendingCodeSwitch(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer"
              >
                Đổi sang Mã {pendingCodeSwitch}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
