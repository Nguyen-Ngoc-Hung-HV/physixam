import React, { useState } from 'react';
import { 
  Maximize2, Play, ArrowLeft, ShieldCheck, ShieldAlert, 
  Clock, BookOpen, User, Lock, AlertTriangle, AlertCircle, FileText,
  Sparkles, CheckCircle2, KeyRound, Upload, Search, Smartphone, Shield
} from 'lucide-react';
import { Exam, AntiCheatConfig } from '../types/exam';
import { detectInAppOrRestrictedBrowser } from '../utils/safeStorage';
import { decompressExamFromHash } from '../utils/examShareUrl';
import { validateAndNormalizeExamJson } from '../utils/examSchemaNormalizer';

interface StudentExamLaunchProps {
  exam: Exam;
  activeCode: string;
  antiCheatConfig: AntiCheatConfig;
  onStartExam: (candidateInfo: { name: string; studentClass: string; candidateNumber: string }) => void;
  onStartWithoutFullscreen?: (candidateInfo: { name: string; studentClass: string; candidateNumber: string }) => void;
  onExitToTeacherMode: () => void;
  onLoadExamByCode?: (code: string) => boolean;
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
  onLoadCustomExam,
}) => {
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateClass, setCandidateClass] = useState<string>('');
  const [candidateNumber, setCandidateNumber] = useState<string>(() => `SBD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Trạng thái mở rộng "Nhập mã bài thi / Dán đề thi JSON"
  const [showCodeInputPanel, setShowCodeInputPanel] = useState<boolean>(false);
  const [inputExamCode, setInputExamCode] = useState<string>('');
  const [inputRawText, setInputRawText] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  // Nhận diện trình duyệt di động / Zalo / Safari
  const browserInfo = detectInAppOrRestrictedBrowser();

  const isNameValid = candidateName.trim().length >= 2;
  const isClassValid = candidateClass.trim().length >= 2;
  const isCandidateValid = isNameValid && isClassValid;

  const handleStart = async (withFullscreen: boolean = true) => {
    setHasAttemptedSubmit(true);
    if (!isCandidateValid) {
      setValidationAlert('Vui lòng nhập đầy đủ HỌ VÀ TÊN và LỚP (Ví dụ: Nguyễn Văn A - Lớp 12A1) để hệ thống ghi nhận kết quả.');
      return;
    }
    setValidationAlert(null);

    const candidate = {
      name: candidateName.trim(),
      studentClass: candidateClass.trim().toUpperCase(),
      candidateNumber: candidateNumber.trim() || 'SBD-001',
    };

    if (withFullscreen && antiCheatConfig.enabled && antiCheatConfig.requireFullscreen) {
      try {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request blocked or dismissed:', err);
      }
      onStartExam(candidate);
    } else {
      if (onStartWithoutFullscreen) {
        onStartWithoutFullscreen(candidate);
      } else {
        onStartExam(candidate);
      }
    }
  };

  // Xử lý nạp đề bằng mã rút gọn
  const handleApplyExamCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);
    const code = inputExamCode.trim();
    if (!code) {
      setCodeError('Vui lòng nhập mã đề bài thi (Ví dụ: 1201, 1001, PHY-...)');
      return;
    }

    if (onLoadExamByCode && onLoadExamByCode(code)) {
      setCodeSuccess(`Đã nạp thành công đề thi theo mã "${code}"!`);
      setInputExamCode('');
    } else {
      setCodeError(`Không tìm thấy đề thi với mã "${code}". Vui lòng kiểm tra lại hoặc dán JSON đề thi.`);
    }
  };

  // Xử lý nạp đề bằng chuỗi dán (Link #exam=... hoặc JSON)
  const handleApplyPastedExam = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);
    const raw = inputRawText.trim();
    if (!raw) {
      setCodeError('Vui lòng dán mã nén đề thi (#exam=...) hoặc JSON đề thi.');
      return;
    }

    try {
      // 1. Nếu là chuỗi nén URL Hash hoặc có chứa exam=
      if (raw.includes('exam=')) {
        const part = raw.split('exam=')[1]?.split('&')[0] || raw;
        const decompressed = decompressExamFromHash(part);
        if (decompressed && onLoadCustomExam) {
          onLoadCustomExam(decompressed);
          setCodeSuccess(`Đã nạp thành công đề thi: "${decompressed.title}"!`);
          setInputRawText('');
          return;
        }
      }

      // 2. Thử giải nén trực tiếp bằng decompressExamFromHash
      const directDecompressed = decompressExamFromHash(raw);
      if (directDecompressed && onLoadCustomExam) {
        onLoadCustomExam(directDecompressed);
        setCodeSuccess(`Đã nạp thành công đề thi: "${directDecompressed.title}"!`);
        setInputRawText('');
        return;
      }

      // 3. Nếu là chuỗi JSON trực tiếp
      const { exam: normalized } = validateAndNormalizeExamJson(raw);
      if (onLoadCustomExam) {
        onLoadCustomExam(normalized);
        setCodeSuccess(`Đã nạp thành công đề thi JSON: "${normalized.title}"!`);
        setInputRawText('');
      }
    } catch (err: any) {
      setCodeError(err?.message || 'Không thể đọc dữ liệu đề thi. Vui lòng kiểm tra định dạng.');
    }
  };

  // Xử lý tải file JSON từ máy
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { exam: normalized } = validateAndNormalizeExamJson(content);
        if (onLoadCustomExam) {
          onLoadCustomExam(normalized);
          setCodeSuccess(`Đã nạp thành công tệp: "${file.name}"!`);
        }
      } catch (err: any) {
        setCodeError(`Lỗi đọc tệp JSON: ${err?.message || 'Không hợp lệ'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Nút quay lại màn hình Giáo viên ở góc trên */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExitToTeacherMode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span>⬅ Trở về màn hình Giáo viên</span>
        </button>

        <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          Chế độ Học sinh làm bài
        </span>
      </div>

      {/* Thông báo chế độ Zero-Cookie độc lập trên Safari / Zalo / Di động */}
      {browserInfo.isInApp || browserInfo.isIosSafari ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5 shadow-2xs">
          <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Đang chạy chế độ Zero-Cookie ({browserInfo.browserName}): </span>
            <span>Hệ thống tự nạp đề độc lập, không yêu cầu phiên đăng nhập và không bị chặn bởi bảo mật Safari/iOS.</span>
          </div>
        </div>
      ) : null}

      {/* Thẻ chính chuẩn bị phòng thi */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        
        {/* Tiêu đề & Thông tin đề */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
            <BookOpen className="w-7 h-7" />
          </div>
          <span className="text-2xs uppercase tracking-wider font-bold text-indigo-600">
            Phòng thi khảo thí trực tuyến
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {exam.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {exam.subtitle ? exam.subtitle.replace(/\s*\(?Chương trình GDPT 2018\)?/gi, '').trim() : ''} • {exam.gradeLevel ? exam.gradeLevel.replace(/\s*\(?Chương trình GDPT 2018\)?/gi, '').trim() : 'Lớp 12'}
          </p>
        </div>

        {/* 3 Thông số nhanh */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-3xs text-slate-400 font-bold uppercase block">Thời gian thi</span>
            <div className="font-mono text-base font-black text-slate-800">
              {exam.durationMinutes} phút
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-3xs text-slate-400 font-bold uppercase block">Số lượng câu</span>
            <div className="font-mono text-base font-black text-slate-800">
              {exam.questions.length} câu
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-3xs text-slate-400 font-bold uppercase block">Mã đề bài thi</span>
            <div className="font-mono text-base font-black text-amber-600">
              {activeCode}
            </div>
          </div>
        </div>

        {/* Cảnh báo đỏ nếu thông tin thí sinh không hợp lệ */}
        {validationAlert && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-3 shadow-xs animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1 leading-snug">
              {validationAlert}
            </div>
          </div>
        )}

        {/* Thông tin định danh thí sinh */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between font-bold text-xs text-slate-700">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Thông tin thí sinh dự thi:</span>
            </div>
            <span className="text-3xs text-rose-600 font-semibold">* Bắt buộc nhập Họ tên & Lớp</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-3xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Họ và tên thí sinh:</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  if (validationAlert && e.target.value.trim().length >= 2 && candidateClass.trim().length >= 2) {
                    setValidationAlert(null);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold text-slate-800 outline-none transition ${
                  hasAttemptedSubmit && !isNameValid
                    ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {hasAttemptedSubmit && !isNameValid && (
                <span className="text-3xs text-rose-600 mt-0.5 block font-semibold">Tối thiểu 2 ký tự</span>
              )}
            </div>

            <div>
              <label className="block text-3xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Lớp học:</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 12A1"
                value={candidateClass}
                onChange={(e) => {
                  setCandidateClass(e.target.value);
                  if (validationAlert && candidateName.trim().length >= 2 && e.target.value.trim().length >= 2) {
                    setValidationAlert(null);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl bg-white border text-xs font-bold text-slate-800 outline-none transition ${
                  hasAttemptedSubmit && !isClassValid
                    ? 'border-rose-400 focus:border-rose-500 ring-2 ring-rose-100'
                    : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {hasAttemptedSubmit && !isClassValid && (
                <span className="text-3xs text-rose-600 mt-0.5 block font-semibold">Tối thiểu 2 ký tự</span>
              )}
            </div>

            <div>
              <label className="block text-3xs font-semibold text-slate-500 mb-1">Số báo danh (SBD):</label>
              <input
                type="text"
                value={candidateNumber}
                onChange={(e) => setCandidateNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Hộp thoại Quy chế & Giám sát phòng thi */}
        <div className="p-4 rounded-2xl border text-xs space-y-2 transition bg-indigo-50/60 border-indigo-200">
          <div className="flex items-center justify-between font-bold text-indigo-900">
            <div className="flex items-center gap-2">
              {antiCheatConfig.enabled ? (
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <Lock className="w-4 h-4 text-slate-500" />
              )}
              <span>Quy chế & Giám sát phòng thi trực tuyến:</span>
            </div>
            <span className="text-2xs px-2 py-0.5 rounded-full bg-white font-mono font-bold text-indigo-700 border border-indigo-200">
              {antiCheatConfig.enabled ? 'Hệ thống Giám sát: ĐANG BẬT' : 'Giám sát: TẮT'}
            </span>
          </div>

          {antiCheatConfig.enabled ? (
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-3xs sm:text-xs">
              {antiCheatConfig.requireFullscreen && (
                <li>
                  <strong className="text-slate-900">Chế độ Toàn màn hình:</strong> Kỳ thi yêu cầu toàn màn hình liên tục.
                </li>
              )}
              {antiCheatConfig.trackTabSwitching && (
                <li>
                  <strong className="text-slate-900">Giới hạn rời màn hình / chuyển tab:</strong> Tối đa{' '}
                  <span className="font-bold text-rose-600">{antiCheatConfig.maxViolations} lần</span>. Vượt quá sẽ tự động thu bài.
                </li>
              )}
              {antiCheatConfig.preventCopyAndShortcuts && (
                <li>
                  <strong className="text-slate-900">Bảo vệ nội dung:</strong> Khóa chuột phải, sao chép câu hỏi và phím tắt tra cứu (F12, Ctrl+C).
                </li>
              )}
            </ul>
          ) : (
            <p className="text-slate-600 text-3xs sm:text-xs">
              Kỳ thi mở không áp dụng bộ giám sát tự động. Thí sinh có thể làm bài tự do mà không bị ràng buộc chuyển tab.
            </p>
          )}
        </div>

        {/* Cụm nút Bắt đầu làm bài thi */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleStart(true)}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-2.5 ${
              isCandidateValid
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-pointer shadow-none'
            }`}
          >
            {antiCheatConfig.enabled && antiCheatConfig.requireFullscreen ? (
              <>
                <Maximize2 className="w-5 h-5" />
                <span>Vào thi & Bật toàn màn hình</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Bắt đầu tính giờ làm bài</span>
              </>
            )}
          </button>

          {!isCandidateValid && (
            <p className="text-center text-3xs font-bold text-rose-600">
              * Vui lòng điền đủ HỌ VÀ TÊN và LỚP (Ví dụ: Nguyễn Văn A - Lớp 12A1) để bắt đầu bài thi.
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleStart(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
            >
              ⚡ Bắt đầu làm bài mà không cần toàn màn hình (Dành cho Xem trước / Di động)
            </button>
          </div>
        </div>

        {/* MÃ ĐỀ RÚT GỌN / DÁN ĐỀ THI JSON BỔ TRỢ (FALLBACK OPTION THEO YÊU CẦU 3) */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowCodeInputPanel((prev) => !prev)}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Nhập mã bài thi khác / Dán tệp đề thi JSON (Fallback)</span>
            </span>
            <span className="text-2xs text-indigo-600 underline">
              {showCodeInputPanel ? 'Đóng tùy chọn' : 'Mở tùy chọn'}
            </span>
          </button>

          {showCodeInputPanel && (
            <div className="mt-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
              
              {codeError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  {codeError}
                </div>
              )}

              {codeSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{codeSuccess}</span>
                </div>
              )}

              {/* Lựa chọn A: Nhập mã bài thi rút gọn */}
              <form onSubmit={handleApplyExamCode} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  1. Nhập mã đề bài thi rút gọn do giáo viên cung cấp:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: 1001, 1101, 1201, hoặc mã bài thi..."
                    value={inputExamCode}
                    onChange={(e) => setInputExamCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Nạp đề</span>
                  </button>
                </div>
              </form>

              {/* Lựa chọn B: Dán liên kết hoặc mã JSON */}
              <form onSubmit={handleApplyPastedExam} className="space-y-2 pt-2 border-t border-slate-200/60">
                <label className="text-xs font-bold text-slate-700 block">
                  2. Hoặc dán mã nén đề thi (#exam=...) hoặc nội dung JSON:
                </label>
                <textarea
                  rows={3}
                  placeholder="Dán chuỗi link đầy đủ, mã nén URL (#exam=...) hoặc cấu trúc JSON đề thi tại đây..."
                  value={inputRawText}
                  onChange={(e) => setInputRawText(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-2xs bg-white border border-slate-200 font-mono text-slate-700 outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-2xs font-bold cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tải tệp JSON từ máy</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Áp dụng đề thi
                  </button>
                </div>
              </form>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};

