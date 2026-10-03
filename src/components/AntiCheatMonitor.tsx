import React, { useEffect, useState, useRef } from 'react';
import { 
  Maximize2, AlertTriangle, ShieldAlert, Lock, 
  RotateCcw, EyeOff, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { AntiCheatConfig, ViolationEvent } from '../types/exam';
import { createViolationEntry } from '../utils/antiCheat';

interface AntiCheatMonitorProps {
  config: AntiCheatConfig;
  isActive: boolean; // chỉ kích hoạt khi appMode === 'student' && mode === 'student_taking'
  hasStarted: boolean; // chỉ kích hoạt sau khi học sinh bấm bắt đầu làm bài
  onStartExamFullscreen: () => void;
  onExitToTeacherMode?: () => void;
  violationCount: number;
  onRecordViolation: (event: ViolationEvent, isLimitReached: boolean) => void;
  onAutoSubmitExam: (reason: 'violation_limit_exceeded') => void;
}

export const AntiCheatMonitor: React.FC<AntiCheatMonitorProps> = ({
  config,
  isActive,
  hasStarted,
  onStartExamFullscreen,
  onExitToTeacherMode,
  violationCount,
  onRecordViolation,
  onAutoSubmitExam,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
  });
  const [showExitFullscreenBanner, setShowExitFullscreenBanner] = useState<boolean>(false);
  const [activeWarningToast, setActiveWarningToast] = useState<{
    show: boolean;
    count: number;
    max: number;
    reason: string;
  } | null>(null);

  // Tự động dọn dẹp các thông báo khi không ở trong chế độ học sinh đang làm bài
  useEffect(() => {
    if (!isActive || !hasStarted) {
      setShowExitFullscreenBanner(false);
      setActiveWarningToast(null);
    }
  }, [isActive, hasStarted]);

  // Tránh ghi nhận trùng lặp sự kiện rời tab và blur trong vòng 1.2 giây
  const lastViolationTimeRef = useRef<number>(0);
  const hasTriggeredLimitRef = useRef<boolean>(false);

  // Kiểm tra trạng thái toàn màn hình
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen && config.enabled && config.requireFullscreen && hasStarted && isActive) {
        setShowExitFullscreenBanner(true);
        triggerViolation('Thoát chế độ toàn màn hình khi đang làm bài');
      } else if (isNowFullscreen) {
        setShowExitFullscreenBanner(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [config.enabled, config.requireFullscreen, hasStarted, isActive, violationCount]);

  // Hàm kích hoạt ghi nhận vi phạm
  const triggerViolation = (reason: string) => {
    if (!config.enabled || !hasStarted || !isActive) return;
    
    const now = Date.now();
    // Bỏ qua nếu xảy ra quá gần nhau (dưới 1200ms) để không bị đúp giữa blur và visibilitychange
    if (now - lastViolationTimeRef.current < 1200) {
      return;
    }
    lastViolationTimeRef.current = now;

    const nextCount = violationCount + 1;
    const isLimitReached = nextCount >= config.maxViolations;
    const event = createViolationEntry(reason);

    onRecordViolation(event, isLimitReached);

    if (isLimitReached) {
      if (!hasTriggeredLimitRef.current) {
        hasTriggeredLimitRef.current = true;
        setActiveWarningToast({
          show: true,
          count: nextCount,
          max: config.maxViolations,
          reason: 'Đã vượt quá số lần vi phạm cho phép. Hệ thống đang tiến hành khóa và nộp bài thi ngay lập tức!',
        });
        setTimeout(() => {
          onAutoSubmitExam('violation_limit_exceeded');
        }, 1800);
      }
    } else {
      setActiveWarningToast({
        show: true,
        count: nextCount,
        max: config.maxViolations,
        reason,
      });
    }
  };

  // Giám sát chuyển tab (visibilitychange) và mất tiêu điểm (window.blur)
  useEffect(() => {
    if (!config.enabled || !config.trackTabSwitching || !hasStarted || !isActive) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Chuyển sang tab hoặc cửa sổ khác (Tab switching)');
      }
    };

    const handleWindowBlur = () => {
      // Khi mất tiêu điểm (ví dụ mở ứng dụng khác, click ra ngoài trình duyệt)
      triggerViolation('Mất tiêu điểm cửa sổ thi (Window blur)');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [config.enabled, config.trackTabSwitching, hasStarted, isActive, violationCount]);

  // Chặn chuột phải và các phím tắt sao chép / kiểm tra mã nguồn
  useEffect(() => {
    if (!config.enabled || !config.preventCopyAndShortcuts || !hasStarted || !isActive) {
      return;
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Chặn Ctrl+C / Cmd+C (Copy)
      if (isCtrlOrCmd && key === 'c') {
        e.preventDefault();
        return false;
      }

      // Chặn Ctrl+U (Xem mã nguồn)
      if (isCtrlOrCmd && key === 'u') {
        e.preventDefault();
        return false;
      }

      // Chặn Ctrl+S (Lưu trang)
      if (isCtrlOrCmd && key === 's') {
        e.preventDefault();
        return false;
      }

      // Chặn Ctrl+P (In ấn khi đang thi)
      if (isCtrlOrCmd && key === 'p') {
        e.preventDefault();
        return false;
      }

      // Chặn F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Chặn Ctrl+Shift+I / Cmd+Option+I (Inspect element)
      if (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config.enabled, config.preventCopyAndShortcuts, hasStarted, isActive]);

  // Hành động kích hoạt toàn màn hình
  const requestFullscreen = async () => {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowExitFullscreenBanner(false);
    } catch (err) {
      console.warn('Không thể bật toàn màn hình (trình duyệt có thể đang chặn):', err);
      // Vẫn cho phép học sinh làm bài nếu trình duyệt không hỗ trợ toàn quyền
      setIsFullscreen(true);
      setShowExitFullscreenBanner(false);
    }
  };

  const handleStartExamWithFullscreen = async () => {
    if (config.requireFullscreen) {
      await requestFullscreen();
    }
    onStartExamFullscreen();
  };

  // MÀN HÌNH CHUẨN BỊ: YÊU CẦU BẬT TOÀN MÀN HÌNH ĐỂ BẮT ĐẦU BÀI THI
  if (config.enabled && config.requireFullscreen && !hasStarted && isActive) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in fade-in zoom-in-95">
          
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Maximize2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kỳ thi có Giám sát Trực tuyến
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              Yêu cầu Chế độ Toàn màn hình
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kỳ thi yêu cầu làm bài ở chế độ toàn màn hình để đảm bảo tính công bằng và minh bạch. 
              Vui lòng không chuyển tab hoặc rời khỏi cửa sổ thi trong suốt quá trình làm bài.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Lock className="w-4 h-4 text-blue-600" />
              Quy chế phòng thi trực tuyến:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Duy trì toàn màn hình trong suốt thời gian làm bài.</li>
              {config.trackTabSwitching && (
                <li>
                  Số lần rời màn hình thi tối đa: <span className="font-bold text-rose-600">{config.maxViolations} lần</span>. Vượt quá sẽ tự động thu bài.
                </li>
              )}
              {config.preventCopyAndShortcuts && (
                <li>Khóa thao tác sao chép nội dung câu hỏi và chuột phải.</li>
              )}
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleStartExamWithFullscreen}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-5 h-5" />
              Vào thi & Bật toàn màn hình
            </button>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onStartExamFullscreen()}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Bỏ qua chế độ toàn màn hình để xem trước giao diện thi"
              >
                ⚡ Xem trước (Không khóa)
              </button>

              {onExitToTeacherMode && (
                <button
                  onClick={onExitToTeacherMode}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer border border-rose-200"
                >
                  ⬅ Trở về Giáo viên
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <>
      {/* BANNER KHÓA KHI HỌC SINH THOÁT TOÀN MÀN HÌNH (NON-DISMISSIBLE) */}
      {showExitFullscreenBanner && config.enabled && config.requireFullscreen && isActive && (
        <div className="fixed inset-0 z-50 bg-rose-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border-2 border-rose-500 animate-bounce-short">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 px-3 py-1 rounded-full bg-rose-100">
                Vi phạm quy chế thi
              </span>
              <h3 className="text-lg font-black text-slate-800">
                Bạn đã thoát chế độ Toàn màn hình!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống yêu cầu duy trì toàn màn hình để đảm bảo tính minh bạch của bài thi. Sự kiện này đã được ghi vào Nhật ký giám sát.
              </p>
              {config.trackTabSwitching && (
                <div className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  Số lần vi phạm hiện tại: {violationCount} / {config.maxViolations} lần
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={requestFullscreen}
                className="w-full py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                Quay lại toàn màn hình để tiếp tục
              </button>

              {onExitToTeacherMode && (
                <button
                  onClick={onExitToTeacherMode}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  ⬅ Thoát ra Chế độ Giáo viên (Kết thúc xem thử)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP CẢNH BÁO KHI RỜI TAB HOẶC MẤT FOCUS */}
      {activeWarningToast && activeWarningToast.show && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900/95 text-white rounded-2xl p-4 shadow-2xl border border-amber-400/40 backdrop-blur-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Cảnh báo giám sát thi
                </span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  Vi phạm: {activeWarningToast.count} / {activeWarningToast.max}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                {activeWarningToast.count >= activeWarningToast.max
                  ? activeWarningToast.reason
                  : `Bạn vừa rời khỏi màn hình làm bài (${activeWarningToast.reason}). Nếu vượt quá ${activeWarningToast.max} lần, bài thi sẽ tự động bị khóa và nộp ngay lập tức!`}
              </p>
              {activeWarningToast.count < activeWarningToast.max && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveWarningToast(null)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
                  >
                    Đã hiểu & Tiếp tục làm bài
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
