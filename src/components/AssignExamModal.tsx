import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Send, ShieldCheck, ShieldAlert, Clock, Calendar, 
  Copy, Check, Sparkles, Users, Lock, AlertCircle, Share2, Play,
  QrCode, Smartphone, Download, ExternalLink, CheckCircle2, Shield
} from 'lucide-react';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';
import { AntiCheatConfig } from '../types/exam';
import { generateStudentShareUrl, generateExamQRCode } from '../utils/examShareUrl';

interface AssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examPackage: ExamPackage | null;
  onConfirmAssignment: (assignment: ExamAssignmentInfo, switchToStudentMode: boolean) => void;
  currentAntiCheatConfig: AntiCheatConfig;
}

export const AssignExamModal: React.FC<AssignExamModalProps> = ({
  isOpen,
  onClose,
  examPackage,
  onConfirmAssignment,
  currentAntiCheatConfig,
}) => {
  if (!isOpen || !examPackage) return null;

  // Preset lớp học theo khối
  const classPresets = examPackage.grade === 12 
    ? ['12A1', '12A2', '12 Lý', '12 Hóa', '12 Chuyên']
    : examPackage.grade === 11 
    ? ['11A1', '11A2', '11 Lý', '11 Tự Nhiên']
    : ['10A1', '10A2', '10 Chuyên Lý', '10 Tự Nhiên'];

  const [targetClass, setTargetClass] = useState<string>(classPresets[0]);
  const [customClass, setCustomClass] = useState<string>('');

  // Thời gian
  const todayStr = new Date().toISOString().slice(0, 16);
  const tomorrowDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [assignedAt, setAssignedAt] = useState<string>(todayStr);
  const [deadline, setDeadline] = useState<string>(tomorrowDate);
  const [noDeadline, setNoDeadline] = useState<boolean>(false);

  // Cấu hình giám sát
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(currentAntiCheatConfig.enabled);
  const [requireFullscreen, setRequireFullscreen] = useState<boolean>(currentAntiCheatConfig.requireFullscreen);
  const [maxViolations, setMaxViolations] = useState<number>(currentAntiCheatConfig.maxViolations || 3);
  const [preventCopy, setPreventCopy] = useState<boolean>(currentAntiCheatConfig.preventCopyAndShortcuts);

  // Mã bài thi ngẫu nhiên duy nhất
  const [accessCode] = useState<string>(() => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PHY-${examPackage.code || examPackage.grade}-${randomHex}`;
  });

  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // 1. Tạo Link làm bài trực tiếp cho học sinh (Tự chứa toàn bộ dữ liệu đề thi, không cần cookie/server session)
  const studentDirectLink = useMemo(() => {
    return generateStudentShareUrl(examPackage.examData);
  }, [examPackage]);

  // Sinh mã QR khi mở hộp thoại
  useEffect(() => {
    let isMounted = true;
    setIsGeneratingQr(true);
    generateExamQRCode(studentDirectLink)
      .then((url) => {
        if (isMounted) {
          setQrCodeDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tạo mã QR:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentDirectLink]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const handleCopyStudentLink = () => {
    navigator.clipboard.writeText(studentDirectLink);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `QR-De-Thi-${examPackage.code || 'PHY'}.png`;
    a.click();
  };

  const handleExecute = (switchStudent: boolean) => {
    const finalClass = customClass.trim() ? customClass.trim() : targetClass;
    const assignment: ExamAssignmentInfo = {
      id: `assign-${Date.now()}`,
      examId: examPackage.id,
      examCode: examPackage.code,
      examTitle: examPackage.title,
      grade: examPackage.grade,
      className: finalClass,
      assignedAt,
      deadline: noDeadline ? 'Không giới hạn' : deadline,
      accessCode,
      shareUrl: studentDirectLink,
      antiCheatEnabled,
      requireFullscreen: antiCheatEnabled && requireFullscreen,
      maxViolations,
      preventCopyAndShortcuts: antiCheatEnabled && preventCopy,
      status: 'active',
      submissionCount: 0,
    };

    onConfirmAssignment(assignment, switchStudent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Giao bài thi cho học sinh
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
              Lớp {examPackage.grade} • Mã {examPackage.code}
            </span>
          </div>

          <h3 className="text-lg font-black text-white leading-snug">
            {examPackage.title}
          </h3>

          <p className="text-xs text-indigo-200 mt-1">
            Thời lượng: <strong>{examPackage.durationMinutes} phút</strong> • Thang điểm: <strong>{examPackage.totalPoints}đ</strong> • {examPackage.categoryLabel}
          </p>
        </div>

        {/* Nội dung cấu hình giao đề */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Lớp nhận bài thi */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Chọn lớp nhận bài kiểm tra:
            </label>
            <div className="flex flex-wrap gap-2">
              {classPresets.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setTargetClass(cls);
                    setCustomClass('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    targetClass === cls && !customClass
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Lớp {cls}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Hoặc nhập tên lớp khác (ví dụ: 12A8, Đội tuyển HSG...)"
              value={customClass}
              onChange={(e) => setCustomClass(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Thời hạn nộp bài */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Thời gian mở bài:
              </label>
              <input
                type="datetime-local"
                value={assignedAt}
                onChange={(e) => setAssignedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  Hạn chót nộp bài:
                </label>
                <label className="text-3xs text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noDeadline}
                    onChange={(e) => setNoDeadline(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                  <span>Không hạn</span>
                </label>
              </div>
              <input
                type="datetime-local"
                disabled={noDeadline}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 outline-none ${
                  noDeadline ? 'opacity-40 cursor-not-allowed' : 'focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Cấu hình Giám sát thi & Chống gian lận (Anti-cheat) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${antiCheatEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-black text-slate-800">Giám sát thi trực tuyến (Anti-cheat)</h4>
                  <p className="text-3xs text-slate-500">Ghi nhận vi phạm thoát tab, bắt buộc toàn màn hình</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiCheatEnabled}
                  onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {antiCheatEnabled && (
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span className="font-medium">Bắt buộc chế độ toàn màn hình (Fullscreen)</span>
                  <input
                    type="checkbox"
                    checked={requireFullscreen}
                    onChange={(e) => setRequireFullscreen(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                </label>

                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium">Số lần thoát màn hình tối đa trước khi tự nộp:</span>
                  <select
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={1}>1 lần (Rất nghiêm)</option>
                    <option value={2}>2 lần</option>
                    <option value={3}>3 lần (Tiêu chuẩn)</option>
                    <option value={5}>5 lần (Linh hoạt)</option>
                  </select>
                </div>

                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
                  <span className="font-medium">Chặn sao chép đề & phím tắt (Ctrl+C, Ctrl+V, F12)</span>
                  <input
                    type="checkbox"
                    checked={preventCopy}
                    onChange={(e) => setPreventCopy(e.target.checked)}
                    className="rounded text-indigo-600 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* KHỐI GIAO BÀI & CHIA SẺ TRỰC TIẾP KHÔNG PHỤ THUỘC COOKIE/SERVER */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-emerald-50/50 border-2 border-indigo-200/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">
                    Link làm bài trực tiếp cho Học sinh (Không cần đăng nhập)
                  </h4>
                  <p className="text-3xs text-slate-500">
                    Nén tự chứa toàn bộ đề thi • Không bị chặn bởi Cookie Safari/iOS/Zalo
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-3xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Zero-Cookie Mode
              </span>
            </div>

            {/* Nút hành động chính: Sao chép link làm bài & Mở QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyStudentLink}
                className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                title="Sao chép link làm bài trực tiếp cho học sinh (hoạt động trên mọi thiết bị và ứng dụng)"
              >
                {isCopiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedLink ? '✓ Đã sao chép link!' : '📋 Sao chép Link làm bài cho Học sinh'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrCode((prev) => !prev)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-indigo-200 shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>{showQrCode ? 'Ẩn mã QR' : 'Quét mã QR để vào thi ngay'}</span>
              </button>
            </div>

            {/* Vùng hiển thị mã QR Code khi bấm nút */}
            {showQrCode && (
              <div className="p-4 bg-white rounded-2xl border border-indigo-200 text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    Quét mã QR để vào thi ngay trên điện thoại:
                  </span>
                  {qrCodeDataUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="text-3xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải ảnh QR</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center py-1">
                  {isGeneratingQr ? (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                      Đang tạo mã QR sắc nét...
                    </div>
                  ) : qrCodeDataUrl ? (
                    <div className="p-2.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-sm inline-block">
                      <img
                        src={qrCodeDataUrl}
                        alt="Mã QR làm bài thi"
                        className="w-48 h-48 object-contain mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-rose-500">Không thể tạo ảnh QR.</p>
                  )}
                  <p className="text-3xs text-slate-500 mt-2">
                    Học sinh dùng Camera iPhone / Android hoặc ứng dụng Zalo quét mã này để vào thi trực tiếp.
                  </p>
                </div>
              </div>
            )}

            {/* Thông tin Mã đề rút gọn bổ trợ */}
            <div className="pt-2 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2 text-2xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>Mã bài thi rút gọn:</span>
                <span className="font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {examPackage.code || accessCode}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="text-3xs font-semibold text-slate-500 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                {isCopiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{isCopiedCode ? 'Đã chép mã' : 'Sao chép mã rút gọn'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={() => handleExecute(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Lưu & Tiếp tục ở Chế độ Giáo viên</span>
          </button>

          <button
            type="button"
            onClick={() => handleExecute(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Kích hoạt & Chuyển sang Học sinh</span>
          </button>
        </div>

      </div>
    </div>
  );
};
