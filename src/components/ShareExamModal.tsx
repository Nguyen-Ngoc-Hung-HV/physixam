import React, { useState } from 'react';

interface ShareExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  roomCode: string;
  examId?: string;
}

export const ShareExamModal: React.FC<ShareExamModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  roomCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Đường link làm bài ngắn gọn
  const shareUrl = `${window.location.origin}/?code=${encodeURIComponent(roomCode)}`;
  
  // Tạo ảnh QR chất lượng cao từ link ngắn
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    shareUrl
  )}&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
        {/* Tiêu đề Modal */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg">Chia sẻ đề thi cho Học sinh</h3>
            <p className="text-xs text-indigo-100 line-clamp-1 mt-0.5">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 text-center space-y-5">
          {/* 1. Mã phòng thi / Mã đề (Room Code) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Mã phòng thi (Room Code)
            </span>
            <div className="font-mono text-3xl font-black text-indigo-600 tracking-widest select-all">
              {roomCode}
            </div>
            <p className="text-2xs text-slate-400 mt-1">
              Học sinh chỉ cần vào trang chủ và nhập mã này để làm bài
            </p>
          </div>

          {/* 2. Mã QR tinh gọn */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm">
              <img
                src={qrImageUrl}
                alt="Mã QR bài thi"
                className="w-48 h-48 rounded-lg object-contain"
              />
            </div>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              Quét bằng máy ảnh điện thoại hoặc Zalo để vào thi ngay
            </span>
          </div>

          {/* 3. Link ngắn trực tiếp kèm nút Copy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 font-mono flex-1 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>

        {/* Nút đóng */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};