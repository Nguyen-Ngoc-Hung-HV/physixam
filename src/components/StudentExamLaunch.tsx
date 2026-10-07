import React, { useState } from 'react';
import { Exam, AntiCheatConfig } from '../types/exam';
import { 
  User, BookOpen, Clock, ShieldCheck, 
  Sparkles, CheckCircle2, AlertTriangle, KeyRound
} from 'lucide-react';

interface StudentExamLaunchProps {
  exam: Exam;
  activeCode: string;
  antiCheatConfig: AntiCheatConfig;
  onStartExam: (info: { name: string; studentClass: string; candidateNumber: string }) => void;
  onStartWithoutFullscreen: (info: { name: string; studentClass: string; candidateNumber: string }) => void;
  onExitToTeacherMode: () => void;
  onLoadExamByCode: (code: string) => boolean;
  onLoadCustomExam?: (exam: Exam) => void;
}

export const StudentExamLaunch: React.FC<StudentExamLaunchProps> = ({
  exam,
  activeCode,
  antiCheatConfig,
  onStartExam,
  onStartWithoutFullscreen,
  onExitToTeacherMode,
  onLoadExamByCode,
}) => {
  const [name, setName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('12A1');
  const [candidateNumber, setCandidateNumber] = useState<string>(() => `SBD-${Math.floor(10000 + Math.random() * 90000)}`);
  
  const [inputCode, setInputCode] = useState<string>('');
  const [codeMessage, setCodeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const ok = onLoadExamByCode(inputCode.trim());
    if (ok) {
      setCodeMessage({ text: 'Đã nạp đề thi thành công!', type: 'success' });
      setInputCode('');
    } else {
      setCodeMessage({ text: 'Không tìm thấy bài thi với mã này.', type: 'error' });
    }
    setTimeout(() => setCodeMessage(null), 3500);
  };

  const handleStart = (withFullscreen: boolean) => {
    if (!name.trim()) {
      alert('Vui lòng nhập họ và tên thí sinh trước khi vào thi!');
      return;
    }
    if (!studentClass.trim()) {
      alert('Vui lòng nhập lớp học của thí sinh!');
      return;
    }

    const info = {
      name: name.trim(),
      studentClass: studentClass.trim(),
      candidateNumber: candidateNumber.trim() || `SBD-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    if (withFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      onStartExam(info);
    } else {
      onStartWithoutFullscreen(info);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-6 animate-in fade-in duration-300">
      
      {/* Thẻ nạp mã đề thủ công */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          <span>Bạn có mã bài thi khác từ Giáo viên?</span>
        </div>
        <form onSubmit={handleApplyCode} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Nhập mã (VD: 1202, PHY-1202)..."
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono font-bold w-full sm:w-48"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Vào thi
          </button>
        </form>
      </div>

      {codeMessage && (
        <div className={`p-3 rounded-xl text-xs font-bold text-center border ${
          codeMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {codeMessage.text}
        </div>
      )}

      {/* Thẻ thông tin bài thi hiện tại */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-2xs font-black uppercase tracking-wider mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Phòng thi đã sẵn sàng
        </div>

        <h1 className="text-xl sm:text-2xl font-black leading-snug tracking-tight mb-4">
          {exam.title}
        </h1>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-center">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-2xs font-bold uppercase flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Thời gian
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">{exam.durationMinutes} phút</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-2xs font-bold uppercase flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-400" /> Số câu hỏi
            </div>
            <div className="text-sm sm:text-base font-black text-white mt-0.5">{exam.questions.length} câu</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-slate-400 text-2xs font-bold uppercase flex items-center justify-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-400" /> Mã đề
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-400 font-mono mt-0.5">{activeCode}</div>
          </div>
        </div>
      </div>

      {/* Thẻ nhập thông tin thí sinh */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          Thông tin thí sinh dự thi:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              Họ và tên thí sinh: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              Lớp học: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="Ví dụ: 12A1"
              className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              Số báo danh (SBD):
            </label>
            <input
              type="text"
              value={candidateNumber}
              onChange={(e) => setCandidateNumber(e.target.value)}
              placeholder="SBD-12345"
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-indigo-700 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Thẻ Quy chế & Giám sát thi Anti-cheat - Đồng bộ số lần vi phạm thực tế */}
      <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Quy chế & Giám sát phòng thi trực tuyến:
          </span>
          <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
            antiCheatConfig.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
          }`}>
            {antiCheatConfig.enabled ? 'Hệ thống giám sát: ĐANG BẬT' : 'Hệ thống giám sát: ĐANG TẮT'}
          </span>
        </div>

        <ul className="space-y-1.5 text-2xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span><strong>Chế độ Toàn màn hình:</strong> Kỳ thi yêu cầu toàn màn hình liên tục để chống gian lận.</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>
              <strong>Giới hạn rời màn hình / chuyển tab:</strong> Tối đa <strong className="text-rose-600 font-bold">{antiCheatConfig.maxViolations} lần</strong>. Vượt quá sẽ tự động thu bài.
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span><strong>Bảo vệ nội dung:</strong> Khóa chuột phải, sao chép câu hỏi và phím tắt tra cứu (F12, Ctrl+C).</span>
          </li>
        </ul>
      </div>

      {/* Nút bấm bắt đầu thi */}
      <div className="space-y-3 pt-2">
        <button
          onClick={() => handleStart(true)}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-black text-sm shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          Vào thi & Bật toàn màn hình
        </button>

        <div className="flex items-center justify-center gap-4 text-2xs text-slate-400">
          <button
            onClick={() => handleStart(false)}
            className="hover:text-slate-600 underline transition-colors"
          >
            Bắt đầu làm bài mà không cần toàn màn hình (Dành cho Xem trước / Di động)
          </button>
          <span>•</span>
          <button
            onClick={onExitToTeacherMode}
            className="hover:text-indigo-600 font-bold transition-colors"
          >
            Chuyển sang Chế độ Giáo viên
          </button>
        </div>
      </div>

    </div>
  );
};