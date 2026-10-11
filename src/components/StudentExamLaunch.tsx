import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Clock, Send, 
  ChevronLeft, ChevronRight, Bookmark
} from 'lucide-react';
import { Exam, StudentAnswers, AntiCheatConfig, ViolationEvent } from '../types/exam';
import { QuestionCard } from './QuestionCard';
import { QuestionPalette } from './QuestionPalette';

interface StudentExamLaunchProps {
  exam: Exam;
  antiCheatConfig: AntiCheatConfig;
  candidateInfo: {
    name: string;
    studentClass: string;
    candidateNumber: string;
  };
  timeRemainingSeconds: number;
  onAnswerChange: (questionId: string, answer: any) => void;
  answers: StudentAnswers;
  flaggedQuestionIds: Set<string>;
  onToggleFlag: (questionId: string) => void;
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onSubmitExam: () => void;
  onRecordViolation: (event: ViolationEvent) => void;
}

export const StudentExamLaunch: React.FC<StudentExamLaunchProps> = ({
  exam,
  antiCheatConfig,
  candidateInfo,
  timeRemainingSeconds,
  onAnswerChange,
  answers,
  flaggedQuestionIds,
  onToggleFlag,
  currentQuestionIndex,
  onSelectQuestion,
  onSubmitExam,
  onRecordViolation,
}) => {
  const maxViolations = Math.max(1, Number(antiCheatConfig.maxViolations || 5));
  const [violationCount, setViolationCount] = useState<number>(0);
  const lastViolationTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!antiCheatConfig.enabled) return;

    const handleViolation = (reason: string) => {
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 1200) {
        return;
      }
      lastViolationTimeRef.current = now;

      setViolationCount((prev) => {
        const nextCount = prev + 1;

        onRecordViolation({
          id: `v-${Date.now()}`,
          timestamp: new Date().toISOString(),
          reason: reason,
        });

        if (nextCount >= maxViolations) {
          alert(`CẢNH BÁO: Thí sinh đã vi phạm quy chế thi ${nextCount}/${maxViolations} lần. Hệ thống tiến hành cưỡng chế thu bài!`);
          onSubmitExam();
        } else {
          alert(`CẢNH BÁO VI PHẠM: ${reason} (Lần ${nextCount}/${maxViolations})`);
        }

        return nextCount;
      });
    };

    const onBlur = () => handleViolation('Mất tiêu điểm cửa sổ thi (Window blur)');
    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Chuyển tab hoặc ẩn trình duyệt thi');
      }
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [antiCheatConfig.enabled, maxViolations, onSubmitExam, onRecordViolation]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Thanh thông tin thí sinh và đồng hồ đếm ngược (ĐÃ BỎ HOÀN TOÀN NÚT IN ĐỀ ĐỂ BẢO MẬT ĐÁP ÁN) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-indigo-600 font-black text-xs uppercase">
            {exam.code || '101'}
          </div>
          <div>
            <div className="font-bold text-sm text-white">{candidateInfo.name || 'Thí sinh'}</div>
            <div className="text-2xs text-slate-400">
              Lớp: {candidateInfo.studentClass} | SBD: {candidateInfo.candidateNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {antiCheatConfig.enabled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Vi phạm: {violationCount}/{maxViolations}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Thầy/Cô và học sinh chắc chắn muốn nộp bài thi ngay bây giờ?')) {
                onSubmitExam();
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </div>

      {/* Vùng làm bài thi */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-4">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              index={currentQuestionIndex}
              totalQuestions={exam.questions.length}
              answers={answers}
              onAnswerChange={onAnswerChange}
              isFlagged={flaggedQuestionIds.has(currentQuestion.id)}
              onToggleFlag={() => onToggleFlag(currentQuestion.id)}
              onPrev={() => onSelectQuestion(Math.max(0, currentQuestionIndex - 1))}
              onNext={() => onSelectQuestion(Math.min(exam.questions.length - 1, currentQuestionIndex + 1))}
            />
          )}
        </div>

        {/* Bảng danh sách câu hỏi (Palette) tương thích an toàn */}
        <div className="lg:col-span-1">
          {React.createElement(QuestionPalette as any, {
            questions: exam.questions,
            totalQuestions: exam.questions.length,
            currentIndex: currentQuestionIndex,
            answers: answers,
            flaggedIds: flaggedQuestionIds,
            onSelect: onSelectQuestion
          })}
        </div>
      </div>

    </div>
  );
};