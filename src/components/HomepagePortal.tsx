import React, { useState, useMemo } from 'react';
import { 
  BookOpen, FileEdit, Sparkles, Shuffle, ShieldCheck, 
  BarChart3, Users, Printer, FileDown, ArrowRight, 
  Search, CheckCircle2, BookmarkCheck, Play, Award, 
  Layers, ChevronRight, Hash, Clock, FolderTree, KeyRound,
  Wand2, Settings, ShieldAlert, FileText, Send, Eye,
  Image as ImageIcon, Palette
} from 'lucide-react';
import { Exam } from '../types/exam';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';
import { StudentSubmission } from '../types/exam';
import { PanoBackgroundModal } from './PanoBackgroundModal';
import { PanoBackground, getSavedPanoBg, savePanoBg } from '../utils/themeStorage';

export type PanelId = 'panel1' | 'panel2' | 'panel3' | 'panel4' | 'panel5' | 'panel6';

interface HomepagePortalProps {
  exam: Exam;
  examPackages: ExamPackage[];
  assignments: ExamAssignmentInfo[];
  submissions: StudentSubmission[];
  onNavigateToPanel: (panel: PanelId, subtabIndex?: number) => void;
  onSelectExamPackage: (pkg: ExamPackage) => void;
  onOpenSaveToBank: () => void;
  onPreviewAsStudent: () => void;
  onQuickAccessStudent?: (code: string) => void;
  onOpenThemeModal?: () => void;
}

export const HomepagePortal: React.FC<HomepagePortalProps> = ({
  exam,
  examPackages,
  assignments,
  submissions,
  onNavigateToPanel,
  onSelectExamPackage,
  onOpenSaveToBank,
  onPreviewAsStudent,
  onQuickAccessStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickCodeInput, setQuickCodeInput] = useState<string>('');
  const [quickCodeError, setQuickCodeError] = useState<string | null>(null);

  // Hình nền Pano Banner tùy biến (Lưu vĩnh viễn trong localStorage physixam_pano_bg)
  const [panoBg, setPanoBg] = useState<PanoBackground>(() => getSavedPanoBg());
  const [isPanoModalOpen, setIsPanoModalOpen] = useState<boolean>(false);

  // Thống kê nhanh toàn hệ thống
  const stats = useMemo(() => {
    const totalExams = examPackages.length;
    const g10 = examPackages.filter((p) => p.grade === 10).length;
    const g11 = examPackages.filter((p) => p.grade === 11).length;
    const g12 = examPackages.filter((p) => p.grade === 12).length;
    const totalSvgs = examPackages.reduce((sum, p) => sum + (p.svgCount || 0), 0);
    const totalSubmissions = submissions.length;
    const totalAssignments = assignments.length;

    return { totalExams, g10, g11, g12, totalSvgs, totalSubmissions, totalAssignments };
  }, [examPackages, submissions, assignments]);

  // Lọc đề thi theo tìm kiếm nhanh
  const searchedExams = useMemo(() => {
    if (!searchQuery.trim()) return examPackages.slice(0, 4);
    const q = searchQuery.toLowerCase().trim();
    return examPackages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.chapterTitle.toLowerCase().includes(q) ||
        (p.lessonTitle && p.lessonTitle.toLowerCase().includes(q)) ||
        p.code.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [examPackages, searchQuery]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim()) {
      setQuickCodeError('Vui lòng nhập mã đề bài thi.');
      return;
    }
    setQuickCodeError(null);
    if (onQuickAccessStudent) {
      onQuickAccessStudent(quickCodeInput.trim());
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: CHÀO MỪNG, TÌM KIẾM & CHỈ SỐ KHẢO THÍ TỔNG QUAN           */}
      {/* ========================================================================= */}
      <section 
        className={`relative overflow-hidden rounded-3xl text-white py-5 sm:py-6 px-5 sm:px-8 shadow-2xl border border-indigo-500/20 w-full transition-all duration-300 ${
          panoBg.type === 'preset' ? (panoBg.cssClass || 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900') : 'bg-slate-950'
        }`}
        style={
          panoBg.type === 'custom' && panoBg.imageUrl
            ? { backgroundImage: `url(${panoBg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {/* Lớp phủ chống lóa chữ khi dùng ảnh nền tùy chỉnh */}
        {panoBg.type === 'custom' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none" />
        )}

        {/* Họa tiết trang trí công nghệ & vật lí */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-4">
          
          {/* Hàng trên cùng: Badge định hướng GDPT 2018 & Nút đổi ảnh nền Pano */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-2xs sm:text-xs font-bold border border-indigo-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chương trình GDPT 2018 • Chuẩn cấu trúc đề thi 3 phần Bộ GD&ĐT 2025</span>
            </div>

            {/* Nút đổi ảnh nền Pano theo yêu cầu của giáo viên */}
            <button
              type="button"
              onClick={() => setIsPanoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-2xs sm:text-xs font-bold border border-white/25 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title="Đổi ảnh nền hoặc chọn gradient học thuật cho khu vực Pano banner này"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>🖼️ Đổi ảnh nền Pano</span>
            </button>
          </div>

          {/* Tiêu đề & Giới thiệu ngắn gọn (Chiều cao thu gọn ~50%) */}
          <div className="text-center sm:text-left space-y-1.5">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
              Hệ Thống Khảo Thí & Học Tập{' '}
              <span className="bg-gradient-to-r from-sky-300 via-indigo-200 to-amber-300 bg-clip-text text-transparent">
                Vật Lí THPT Toàn Diện
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Soạn thảo, bóc tách đề từ file Word, dựng đồ thị vector SVG sắc nét, trộn mã đề chuẩn ma trận và khảo thí trực tuyến không phụ thuộc cookie.
            </p>
          </div>

          {/* Thanh tìm kiếm nhanh đề thi */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm đề thi, bài học, chương kiến thức hoặc mã đề (1001, 1201...)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 text-white placeholder-slate-400 border border-white/20 focus:border-indigo-500 outline-none text-xs sm:text-sm font-medium transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* 4 Thống kê tổng quan dạng Pills ngang gọn gàng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-left">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition">
              <span className="text-3xs text-slate-400 font-bold uppercase block">Ngân hàng đề thi</span>
              <div className="text-base sm:text-xl font-black text-white mt-0.5">
                {stats.totalExams} <span className="text-3xs sm:text-xs text-indigo-300 font-normal">đề chuẩn</span>
              </div>
              <span className="text-3xs text-slate-400 mt-0.5 block truncate">K10: {stats.g10} · K11: {stats.g11} · K12: {stats.g12}</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition">
              <span className="text-3xs text-slate-400 font-bold uppercase block">Đồ thị vector SVG</span>
              <div className="text-base sm:text-xl font-black text-amber-300 mt-0.5">
                {stats.totalSvgs} <span className="text-3xs sm:text-xs text-amber-200 font-normal">sơ đồ</span>
              </div>
              <span className="text-3xs text-slate-400 mt-0.5 block truncate">Hiển thị sắc nét không vỡ</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition">
              <span className="text-3xs text-slate-400 font-bold uppercase block">Bài thi đã giao</span>
              <div className="text-base sm:text-xl font-black text-emerald-400 mt-0.5">
                {stats.totalAssignments} <span className="text-3xs sm:text-xs text-emerald-200 font-normal">lượt</span>
              </div>
              <span className="text-3xs text-slate-400 mt-0.5 block truncate">Link trực tiếp & QR Code</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition">
              <span className="text-3xs text-slate-400 font-bold uppercase block">Lượt nộp bài</span>
              <div className="text-base sm:text-xl font-black text-sky-400 mt-0.5">
                {stats.totalSubmissions} <span className="text-3xs sm:text-xs text-sky-200 font-normal">bài nộp</span>
              </div>
              <span className="text-3xs text-slate-400 mt-0.5 block truncate">Chấm điểm & nhật ký thi</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ĐỀ THI HIỆN TẠI ĐANG NẠP (ACTIVE EXAM CARD)                            */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Đề thi đang nạp trong phiên
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700">
              Mã đề: {exam.code || '101'}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
              {exam.gradeLevel}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug truncate">
            {exam.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <strong>{exam.durationMinutes} phút</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <strong>{exam.questions.length} câu hỏi</strong> (Phần I, II, III)
            </span>
            <span>•</span>
            <span>{exam.subtitle}</span>
          </div>
        </div>

        {/* Nút hành động cho đề đang nạp */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenSaveToBank}
            className="py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Lưu cấu trúc đề thi này vào Ngân hàng đề GDPT 2018"
          >
            <BookmarkCheck className="w-4 h-4 text-amber-600" />
            <span>💾 Lưu vào Ngân hàng đề</span>
          </button>

          <button
            type="button"
            onClick={onPreviewAsStudent}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Chuyển sang Chế độ Học sinh làm bài trực tiếp"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Xem trước đề (Học sinh)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToPanel('panel2', 0)}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chỉnh sửa đề</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LƯỚI 5 PANEL CHỨC NĂNG CHUYÊN SÂU (FEATURE PANELS GRID)                */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Không Gian Quản Trị & Khảo Thí (5 Panel Trung Tâm)
            </h2>
            <p className="text-xs text-slate-500">
              Bấm vào từng Panel để mở không gian làm việc chuyên biệt kèm các Subtab tương ứng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* ------------------------------------------------------------- */}
          {/* PANEL 1: NGÂN HÀNG ĐỀ THI & PHÂN PHỐI CT 2018                 */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel1')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition duration-200 shadow-2xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Panel 1
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition">
                  Ngân Hàng Đề Thi & Phân Phối CT 2018
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Kho đề thi chuẩn hóa phân phối theo cây chương trình GDPT 2018 (Khối 10, 11, 12).
                </p>
              </div>

              {/* Danh sách 3 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span><strong>Tab 1.1:</strong> Cây phân phối chương trình (Khối 10, 11, 12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span><strong>Tab 1.2:</strong> Lọc đề theo Bài / Chương / Định kỳ (GHK, CHK, TN)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span><strong>Tab 1.3:</strong> Đề thi đã lưu & Quản lý tệp JSON đề thi</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Ngân hàng đề thi</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 2: SOẠN THẢO & BÓC TÁCH ĐỀ THÔNG MINH                   */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel2')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-sky-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition duration-200 shadow-2xs">
                  <FileEdit className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Panel 2
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition">
                  Soạn Thảo & Bóc Tách Đề Thông Minh
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Bóc tách tự động tệp Word (.docx), soạn thảo trực quan KaTeX & Gemini AI sinh đề.
                </p>
              </div>

              {/* Danh sách 3 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span><strong>Tab 2.1:</strong> Nhập đề từ tệp Word (.docx / .doc) sang JSON</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span><strong>Tab 2.2:</strong> Trình soạn thảo trực quan (Phần I, II, III, KaTeX)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span><strong>Tab 2.3:</strong> AI Quét ảnh trang sách & Tự sinh câu hỏi (Gemini)</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Bộ soạn thảo & Bóc tách</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 3: CẤU HÌNH KỲ THI & TRỘN MÃ ĐỀ                         */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel3')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition duration-200 shadow-2xs">
                  <Shuffle className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Panel 3
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition">
                  Cấu Hình Kỳ Thi & Trộn Mã Đề
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Trộn câu hỏi và phương án, sinh ma trận đáp án 101-104 và thiết lập bảo mật.
                </p>
              </div>

              {/* Danh sách 3 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>Tab 3.1:</strong> Trộn đề tự động & Sinh ma trận đáp án (101-104)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>Tab 3.2:</strong> Giám sát thi & Chống gian lận (Toàn màn hình, tab)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>Tab 3.3:</strong> Cài đặt thời gian, ngày mở/đóng và mật khẩu</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Cấu hình & Trộn đề</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 4: GIÁM SÁT PHÒNG THI & BẢNG ĐIỂM                       */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel4')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition duration-200 shadow-2xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Panel 4
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition">
                  Giám Sát Phòng Thi & Bảng Điểm
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Theo dõi bài nộp thời gian thực, nhật ký vi phạm, phổ điểm và xuất Excel/CSV UTF-8.
                </p>
              </div>

              {/* Danh sách 3 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Tab 4.1:</strong> Danh sách bài nộp & Nhật ký vi phạm thời gian thực</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Tab 4.2:</strong> Thống kê phổ điểm & Phân tích câu sai năng lực</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span><strong>Tab 4.3:</strong> Xuất bảng điểm chi tiết (CSV UTF-8) & In phiếu điểm</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Giám sát & Bảng điểm</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 5: TRUNG TÂM IN ẤN & XUẤT BẢN PDF                       */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel5')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-purple-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition duration-200 shadow-2xs">
                  <Printer className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Panel 5
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition">
                  Trung Tâm In Ấn & Xuất Bản PDF
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Xuất bản đề thi giấy khổ A4 chuẩn Bộ GD&ĐT, bảo toàn công thức KaTeX & sơ đồ SVG.
                </p>
              </div>

              {/* Danh sách 2 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span><strong>Tab 5.1:</strong> In đề thi học sinh (chuẩn A4 Bộ GD&ĐT sắc nét)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span><strong>Tab 5.2:</strong> In đề thi kèm lời giải chi tiết & Bảng ma trận đáp án</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Trung tâm In ấn</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* PANEL 6: QUẢN TRỊ HỆ THỐNG & PHÂN QUYỀN                       */}
          {/* ------------------------------------------------------------- */}
          <div 
            onClick={() => onNavigateToPanel('panel6')}
            className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-rose-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white transition duration-200 shadow-2xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Panel 6
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition">
                  Quản Trị Hệ Thống & Phân Quyền
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Phân quyền Giáo viên - Học sinh, quản lý danh sách lớp và nhập khẩu hàng loạt từ Excel.
                </p>
              </div>

              {/* Danh sách 3 Subtab */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-2xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span><strong>Tab 6.1:</strong> Danh sách Giáo viên & Đồng nghiệp (Nhập Excel)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span><strong>Tab 6.2:</strong> Danh sách Học sinh theo Lớp (Lọc lớp, Excel)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span><strong>Tab 6.3:</strong> Phân quyền & Phê duyệt đề thi (Workflow 3 cấp)</span>
                </div>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-between text-xs font-bold text-rose-600 group-hover:translate-x-1 transition duration-150">
              <span>Mở Quản trị & Phân quyền</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. KHU VỰC ĐỀ THI TIÊU BIỂU / KẾT QUẢ TÌM KIẾM NHANH                     */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}":` : 'Đề thi tiêu biểu GDPT 2018:'}
            </h3>
            <p className="text-xs text-slate-500">
              Nhấp trực tiếp để nạp đề vào phiên thi hiện hành
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToPanel('panel1')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Xem toàn bộ {examPackages.length} đề thi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {searchedExams.map((pkg) => {
            const isActive = pkg.code === exam.code || pkg.title === exam.title;
            return (
              <div
                key={pkg.id}
                onClick={() => onSelectExamPackage(pkg)}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 text-3xs">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      Khối {pkg.grade}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">Mã: {pkg.code}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {pkg.title}
                  </h4>

                  <p className="text-3xs text-slate-500 line-clamp-1">
                    {pkg.chapterTitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-3xs mt-3">
                  <span className="text-slate-500">{pkg.durationMinutes} phút</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <span>Nạp đề này</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hộp thoại tùy biến ảnh nền Pano */}
      <PanoBackgroundModal
        isOpen={isPanoModalOpen}
        onClose={() => setIsPanoModalOpen(false)}
        currentPanoBg={panoBg}
        onSavePanoBg={(newBg) => setPanoBg(newBg)}
      />

    </div>
  );
};
