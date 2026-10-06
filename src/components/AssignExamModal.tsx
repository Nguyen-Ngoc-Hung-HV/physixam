import React, { useState, useEffect, useRef } from 'react';
import { ExamPackage, ExamAssignmentInfo } from '../types/curriculum';
import { compressExamToHash } from '../utils/examShareUrl';
import { syncAssignmentToCloud, syncExamPackageToCloud } from '../services/apiSync';
import { 
  X, Copy, Check, Users, ShieldAlert, 
  QrCode, Play, Send, Calendar, Clock, Lock
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

  const [className, setClassName] = useState<string>('Lớp 12A1');
  const [openTime] = useState<string>('01:18 06/10/2026');
  const [deadline] = useState<string>('01:18 08/10/2026');
  const [noDeadline, setNoDeadline] = useState<boolean>(true);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(true);
  const [requireFullscreen, setRequireFullscreen] = useState<boolean>(true);
  const [maxViolations, setMaxViolations] = useState<number>(3);
  const [preventCopyAndShortcuts, setPreventCopyAndShortcuts] = useState<boolean>(true);

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mã truy cập bài thi dạng ngắn (VD: PHY-1202)
  const cleanCode = examPackage.code || '1202';
  const shortAccessCode = `PHY-${cleanCode}`;

  const currentOrigin = window.location.origin;
  const shortShareUrl = `${currentOrigin}/#code=${shortAccessCode}`;
  
  // Link nén zero-cookie tự chứa toàn bộ dữ liệu đề thi
  const compressedHash = compressExamToHash(examPackage.examData);
  const fullPayloadShareUrl = `${currentOrigin}/#exam=${compressedHash}`;

  // Vẽ mã QR khi mở hộp thoại hoặc bật xem QR
  useEffect(() => {
    if (showQr && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shortShareUrl, { width: 170, margin: 2 }, (error: any) => {
        if (error) console.error('Lỗi tạo mã QR:', error);
      });
    }
  }, [showQr, shortShareUrl]);

  const buildAssignmentObject = (): ExamAssignmentInfo => ({
    id: `assign-${Date.now()}`,
    examId: examPackage.id,
    examTitle: examPackage.title,
    examCode: examPackage.code,
    grade: examPackage.grade,
    className,
    assignedAt: new Date().toLocaleString('vi-VN'),
    deadline: noDeadline ? 'Không thời hạn' : deadline,
    accessCode: shortAccessCode,
    antiCheatEnabled,
    requireFullscreen,
    maxViolations,
    preventCopyAndShortcuts,
    status: 'active',
  });

  // Tự động đẩy dữ liệu lên MongoDB Atlas
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
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Chọn lớp nhận bài */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Chọn lớp nhận bài kiểm tra:
            </label>
            <div className="flex flex-wrap gap-2">
              {['Lớp 12A1', 'Lớp 12A2', 'Lớp 12 Lý', 'Lớp 12 Hóa', 'Lớp 12 Chuyên'].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setClassName(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    className === cls 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Thời gian mở bài:
              </span>
              <strong className="text-slate-700 font-mono text-2xs">{openTime}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Hạn chót nộp bài:
              </span>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="noDeadlineCheck" 
                  checked={noDeadline} 
                  onChange={(e) => setNoDeadline(e.target.checked)} 
                  className="rounded text-indigo-600 w-3.5 h-3.5"
                />
                <label htmlFor="noDeadlineCheck" className="text-2xs text-slate-700 font-bold cursor-pointer">
                  Không hạn
                </label>
              </div>
            </div>
          </div>

          {/* Giám sát thi Anti-cheat */}
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
            <div className="text-2xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Bắt buộc chế độ toàn màn hình (Fullscreen)</span>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Số lần thoát màn hình tối đa trước khi tự nộp:</span>
                <span className="font-bold text-slate-700">3 lần (Tiêu chuẩn)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Chặn sao chép đề & phím tắt (Ctrl+C, Ctrl+V, F12)</span>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* KHUNG LINK LÀM BÀI TRỰC TIẾP */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                Link làm bài trực tiếp cho Học sinh
              </span>
              <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Zero-Cookie Mode
              </span>
            </div>

            <p className="text-2xs text-slate-500">
              Link đã tự động lưu gói đề lên MongoDB Atlas. Học sinh mở trên điện thoại hay Zalo sẽ vào thẳng phòng thi.
            </p>

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
                {showQr ? 'Ẩn mã QR' : 'Quét mã QR để vào thi'}
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

            {/* Mã QR Code hiển thị qua thẻ canvas */}
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