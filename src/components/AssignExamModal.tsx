import React, { useState, useEffect, useRef } from 'react';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';
import { compressExamToHash } from '../utils/examShareUrl';
import { syncAssignmentToCloud, syncExamPackageToCloud } from '../services/apiSync';
import { 
  X, Copy, Check, Users, ShieldAlert, 
  QrCode, Play, Send, Calendar, Clock, Lock, Shuffle, BookOpen
} from 'lucide-react';
import QRCode from 'qrcode';

interface AssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examPackage: ExamPackage | null;
  onAssign: (pkg: ExamPackage, assignment: ExamAssignmentInfo, switchToStudent: boolean) => void;
}

export const AssignExamModal: React.FC<AssignExamModalProps> = ({
  isOpen,
  onClose,
  examPackage,
  onAssign,
}) => {
  if (!isOpen || !examPackage) return null;

  // 1. Tùy chỉnh tên lớp nhận bài (gõ trực tiếp hoặc chọn nhanh)
  const [className, setClassName] = useState<string>('Lớp 12A1');

  // Hàm tạo chuỗi ngày giờ mặc định cho input datetime-local
  const getNowDateTimeString = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const getFutureDateTimeString = (daysAhead: number) => {
    const future = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
  };

  // 2. Tùy chỉnh thời gian mở bài & hạn chót
  const [openTime, setOpenTime] = useState<string>(getNowDateTimeString());
  const [deadline, setDeadline] = useState<string>(getFutureDateTimeString(2));
  const [noDeadline, setNoDeadline] = useState<boolean>(true);

  // 3. Cấu hình Giám sát thi (Anti-cheat) & Số lần vi phạm linh hoạt
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(true);
  const [requireFullscreen, setRequireFullscreen] = useState<boolean>(true);
  const [maxViolations, setMaxViolations] = useState<number>(3);
  const [preventCopyAndShortcuts, setPreventCopyAndShortcuts] = useState<boolean>(true);

  // 4. Cấu hình phương thức phân phối đề: Xáo ngẫu nhiên vs Giữ nguyên gốc
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);

  // Trạng thái copy & QR Code
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanCode = examPackage.code || '1202';
  const shortAccessCode = `PHY-${cleanCode}`;
  const currentOrigin = window.location.origin;
  const shortShareUrl = `${currentOrigin}/#code=${shortAccessCode}`;

  useEffect(() => {
    if (showQr && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shortShareUrl, { width: 170, margin: 2 }, (error: any) => {
        if (error) console.error('Lỗi tạo mã QR:', error);
      });
    }
  }, [showQr, shortShareUrl]);

  const formatDateTimeDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return isoStr;
    }
  };

  const buildAssignmentObject = (): ExamAssignmentInfo => ({
    id: `assign-${Date.now()}`,
    examId: examPackage.id,
    examTitle: examPackage.title,
    examCode: examPackage.code,
    grade: examPackage.grade,
    className,
    assignedAt: new Date().toLocaleString('vi-VN'),
    openTime: formatDateTimeDisplay(openTime),
    deadline: noDeadline ? 'Không thời hạn' : formatDateTimeDisplay(deadline),
    accessCode: shortAccessCode,
    antiCheatEnabled,
    requireFullscreen,
    maxViolations,
    preventCopyAndShortcuts,
    shuffleQuestions,
    status: 'active',
  });

  const triggerCloudSync = () => {
    const assignmentObj = buildAssignmentObject();
    syncAssignmentToCloud(assignmentObj);
    syncExamPackageToCloud(examPackage);
    return assignmentObj;
  };

  const handleCopyLink = () => {
    triggerCloudSync();
    navigator.clipboard.writeText(shortShareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyCode = () => {
    triggerCloudSync();
    navigator.clipboard.writeText(cleanCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleActivateAndSwitch = (switchToStudent: boolean) => {
    const assignmentObj = triggerCloudSync();
    onAssign(examPackage, assignmentObj, switchToStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 rounded-t-3xl relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-2xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
            Giao bài thi cho học sinh • Khối {examPackage.grade} - Mã {examPackage.code}
          </div>
          <h3 className="text-lg sm:text-xl font-black leading-snug line-clamp-2">
            {examPackage.title}
          </h3>
          <div className="text-xs text-indigo-200/80 mt-1">
            Thời lượng: {examPackage.examData.durationMinutes} phút • {examPackage.examData.questions.length} câu hỏi • Thang điểm 10đ
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 flex-1">
          {/* 1. Chọn hoặc nhập lớp */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Lớp nhận bài kiểm tra:
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Nhập tên lớp..."
                className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right w-40"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Lớp 12A1', 'Lớp 12A2', 'Lớp 12 Lý', 'Lớp 12 Hóa', 'Lớp 12 Chuyên'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setClassName(cls)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    className === cls 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Điều chỉnh thời gian mở bài & hạn chót */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <label className="text-slate-600 font-bold flex items-center gap-1 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Thời gian mở bài:
              </label>
              <input
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-lg p-1.5 bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-600 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Hạn chót nộp bài:
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-2xs text-indigo-700 font-bold">
                  <input
                    type="checkbox"
                    checked={noDeadline}
                    onChange={(e) => setNoDeadline(e.target.checked)}
                    className="rounded text-indigo-600 w-3 h-3"
                  />
                  Không hạn
                </label>
              </div>
              <input
                type="datetime-local"
                disabled={noDeadline}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full text-xs font-medium border rounded-lg p-1.5 ${
                  noDeadline 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                    : 'bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* 3. Chế độ phân phối đề thi (Xáo ngẫu nhiên vs Giữ nguyên gốc) */}
          <div className="p-3.5 rounded-2xl border bg-gradient-to-r from-amber-50/60 to-orange-50/60 border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">Phương thức phân phối đề:</span>
              </div>
              <div className="flex bg-slate-200/80 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-black transition-all ${
                    shuffleQuestions
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shuffle className="w-3 h-3" />
                  Xáo ngẫu nhiên
                </button>
                <button
                  type="button"
                  onClick={() => setShuffleQuestions(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-black transition-all ${
                    !shuffleQuestions
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  Giữ nguyên gốc
                </button>
              </div>
            </div>
            <div className="text-2xs text-slate-500 leading-relaxed">
              {shuffleQuestions 
                ? '• Chế độ Thi: Mỗi học sinh tự động nhận đề xáo trộn ngẫu nhiên thứ tự câu hỏi và đáp án A/B/C/D để chống trao đổi.'
                : '• Chế độ Ôn tập: Giữ nguyên thứ tự câu hỏi và đáp án của đề gốc để cả lớp theo dõi và chữa bài đồng bộ.'}
            </div>
          </div>

          {/* 4. Giám sát thi Anti-cheat & Chọn số lần vi phạm tối đa */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Giám sát thi trực tuyến (Anti-cheat)</span>
              </div>
              <input
                type="checkbox"
                checked={antiCheatEnabled}
                onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
            
            {antiCheatEnabled && (
              <div className="space-y-2 pt-1 border-t border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Số lần rời màn hình tối đa trước khi tự thu bài:</span>
                  <select
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(Number(e.target.value))}
                    className="text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={1}>1 lần (Nghiêm ngặt nhất)</option>
                    <option value={2}>2 lần</option>
                    <option value={3}>3 lần (Tiêu chuẩn)</option>
                    <option value={5}>5 lần (Linh hoạt)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-500">
                  <span>Bắt buộc toàn màn hình & Chặn sao chép phím tắt (Ctrl+C, Ctrl+V, F12)</span>
                  <span className="font-bold text-emerald-600">Đã kích hoạt</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Khung link & mã làm bài */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                Link làm bài trực tiếp cho Học sinh
              </span>
              <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Tự động lưu MongoDB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Đã sao chép Link!' : 'Sao chép Link làm bài cho Học sinh'}
              </button>

              <button
                onClick={() => {
                  triggerCloudSync();
                  setShowQr(!showQr);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                {showQr ? 'Ẩn mã QR' : 'Quét mã QR'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-xs">
              <span className="text-slate-600">
                Mã bài thi rút gọn: <strong className="text-indigo-900 font-mono text-sm">{cleanCode}</strong>
              </span>
              <button
                onClick={handleCopyCode}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-2xs flex items-center gap-1"
              >
                {copiedCode ? 'Đã sao chép!' : 'Sao chép mã rút gọn'}
              </button>
            </div>

            {showQr && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-indigo-200 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
                <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
                <span className="text-2xs text-slate-500 font-medium">
                  Học sinh dùng Zalo hoặc Camera điện thoại quét mã này để vào thi trực tiếp
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex items-center justify-end gap-3">
          <button
            onClick={() => handleActivateAndSwitch(false)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            Lưu & Tiếp tục ở Chế độ Giáo viên
          </button>

          <button
            onClick={() => handleActivateAndSwitch(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Play className="w-4 h-4 fill-white" />
            Kích hoạt & Chuyển sang Học sinh
          </button>
        </div>
      </div>
    </div>
  );
};