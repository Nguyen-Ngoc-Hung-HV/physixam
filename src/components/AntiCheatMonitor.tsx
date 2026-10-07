import React, { useEffect, useState, useRef } from 'react';
import { AntiCheatConfig, ViolationEvent } from '../types/exam';
import { ShieldAlert, AlertTriangle, Maximize2 } from 'lucide-react';

interface AntiCheatMonitorProps {
  config: AntiCheatConfig;
  isActive: boolean;
  hasStarted: boolean;
  onStartExamFullscreen: () => void;
  onExitToTeacherMode: () => void;
  violationCount: number;
  onRecordViolation: (event: ViolationEvent) => void;
  onAutoSubmitExam: (reason: 'violation_limit_exceeded') => void;
}

export const AntiCheatMonitor: React.FC<AntiCheatMonitorProps> = ({
  config,
  isActive,
  hasStarted,
  violationCount,
  onRecordViolation,
  onAutoSubmitExam,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const violationCountRef = useRef(violationCount);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  useEffect(() => {
    if (!config.enabled || !isActive || !hasStarted) return;

    const handleViolation = (desc: string) => {
      if (isSubmittingRef.current) return;

      const nextCount = violationCountRef.current + 1;
      const event: ViolationEvent = {
        id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        reason: desc,
      };

      // 1. Luôn ghi nhận sự kiện vi phạm đầy đủ vào nhật ký
      onRecordViolation(event);

      // 2. Hiển thị cảnh báo trực quan trên màn hình
      setWarningMessage(`Cảnh báo vi phạm (${nextCount}/${config.maxViolations}): ${desc}`);
      setTimeout(() => setWarningMessage(null), 4000);

      // 3. Nếu số lần vi phạm đã chạm ngưỡng tối đa -> kích hoạt cưỡng chế nộp bài
      if (nextCount >= config.maxViolations) {
        isSubmittingRef.current = true;
        setTimeout(() => {
          onAutoSubmitExam('violation_limit_exceeded');
        }, 300);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Mất tiêu điểm cửa sổ thi (Window blur) / Chuyển tab');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Mất tiêu điểm cửa sổ thi (Window blur)');
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && config.requireFullscreen) {
        handleViolation('Thoát chế độ toàn màn hình');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!config.preventCopyAndShortcuts) return;

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))
      ) {
        e.preventDefault();
        handleViolation('Cố gắng mở công cụ kiểm tra (DevTools)');
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 'p')) {
        e.preventDefault();
        handleViolation(`Cố gắng dùng phím tắt Ctrl+${e.key.toUpperCase()}`);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config, isActive, hasStarted, onRecordViolation, onAutoSubmitExam]);

  if (!isActive || !hasStarted) return null;

  return (
    <>
      {warningMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white/30">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-200" />
          <span className="text-xs sm:text-sm font-black">{warningMessage}</span>
        </div>
      )}

      {config.requireFullscreen && !isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Cảnh báo: Bạn đã rời Toàn màn hình!</h3>
            <p className="text-xs text-slate-500">
              Quy chế thi yêu cầu làm bài liên tục ở chế độ toàn màn hình. Vi phạm thêm sẽ bị hệ thống tự động thu bài.
            </p>
            <button
              onClick={() => {
                document.documentElement.requestFullscreen().catch(() => {});
                setIsFullscreen(true);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Maximize2 className="w-4 h-4" /> Quay lại chế độ Toàn màn hình
            </button>
          </div>
        </div>
      )}
    </>
  );
};