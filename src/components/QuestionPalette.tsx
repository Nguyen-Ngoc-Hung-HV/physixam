import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { Exam, StudentAnswers } from '../types/exam';

interface QuestionPaletteProps {
  exam: Exam;
  currentQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  answers: StudentAnswers;
  flaggedQuestionIds: Set<string>;
  onToggleFlag: (questionId: string) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  exam,
  currentQuestionIndex,
  onSelectQuestion,
  answers,
  flaggedQuestionIds,
  onToggleFlag,
}) => {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'unanswered'>('all');

  const isQuestionAnswered = (questionId: string, type: string) => {
    const a = answers[questionId];
    if (!a) return false;
    if (type === 'multiple_choice') return typeof a === 'string' && a.length > 0;
    if (type === 'true_false_cluster') {
      const obj = a as { [key: string]: boolean };
      return Object.keys(obj).length === 4;
    }
    if (type === 'short_answer') {
      const obj = a as { value: string; unit: string };
      return obj && obj.value && obj.value.trim().length > 0;
    }
    return false;
  };

  const parts = ['Phần I', 'Phần II', 'Phần III'] as const;

  const getQuestionStatus = (qId: string, type: string) => {
    const isAnswered = isQuestionAnswered(qId, type);
    const isFlagged = flaggedQuestionIds.has(qId);
    return { isAnswered, isFlagged };
  };

  const answeredCount = exam.questions.filter((q) => isQuestionAnswered(q.id, q.type)).length;
  const flaggedCount = flaggedQuestionIds.size;
  const unansweredCount = exam.questions.length - answeredCount;

  return (
    <aside className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-full">
      {/* Tiêu đề & Tổng quan trạng thái */}
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <span>Bảng điều hướng câu hỏi</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {answeredCount}/{exam.questions.length} Đã làm
          </span>
        </h2>

        {/* Chú giải trạng thái */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 text-2xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5 p-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Đã làm ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
            <Flag className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
            <span>Đánh dấu ({flaggedCount})</span>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Chưa làm ({unansweredCount})</span>
          </div>
        </div>

        {/* Bộ lọc nhanh */}
        <div className="flex items-center gap-1 mt-2.5 bg-slate-100/70 p-0.5 rounded-lg text-2xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded-md transition cursor-pointer ${filter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('flagged')}
            className={`flex-1 py-1 rounded-md transition cursor-pointer ${filter === 'flagged' ? 'bg-white shadow-2xs text-amber-700' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Đánh dấu
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`flex-1 py-1 rounded-md transition cursor-pointer ${filter === 'unanswered' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Chưa làm
          </button>
        </div>
      </div>

      {/* Danh sách các câu hỏi theo từng phần thi */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {parts.map((part) => {
          const partQuestions = exam.questions
            .map((q, idx) => ({ ...q, globalIndex: idx }))
            .filter((q) => q.part === part)
            .filter((q) => {
              if (filter === 'flagged') return flaggedQuestionIds.has(q.id);
              if (filter === 'unanswered') return !isQuestionAnswered(q.id, q.type);
              return true;
            });

          if (partQuestions.length === 0) return null;

          const partTitle = 
            part === 'Phần I' ? 'Phần I: Trắc nghiệm 4 lựa chọn' :
            part === 'Phần II' ? 'Phần II: Đúng/Sai' :
            'Phần III: Trả lời ngắn';

          return (
            <div key={part} className="space-y-1.5">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-1 flex justify-between">
                <span>{partTitle}</span>
                <span>{partQuestions.length} câu</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
                {partQuestions.map((q) => {
                  const { isAnswered, isFlagged } = getQuestionStatus(q.id, q.type);
                  const isCurrent = q.globalIndex === currentQuestionIndex;

                  let bgClasses = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                  if (isAnswered) {
                    bgClasses = 'bg-emerald-500 border-emerald-600 text-white font-bold hover:bg-emerald-600';
                  }
                  if (isCurrent) {
                    bgClasses += ' ring-2 ring-indigo-500 ring-offset-2 shadow-sm font-extrabold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => onSelectQuestion(q.globalIndex)}
                      className={`relative h-11 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${bgClasses}`}
                    >
                      {/* Biểu tượng lá cờ đánh dấu */}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-xs border border-white">
                          <Flag className="w-2 h-2 fill-white text-white" />
                        </span>
                      )}

                      <span className="text-xs">Câu {q.globalIndex + 1}</span>
                      <span className={`text-3xs leading-none opacity-80 ${isAnswered ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {q.points}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút đánh dấu xem lại cho câu hiện tại */}
      <div className="pt-3 border-t border-slate-100">
        {exam.questions[currentQuestionIndex] && (
          <button
            onClick={() => onToggleFlag(exam.questions[currentQuestionIndex].id)}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              flaggedQuestionIds.has(exam.questions[currentQuestionIndex].id)
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${flaggedQuestionIds.has(exam.questions[currentQuestionIndex].id) ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>
              {flaggedQuestionIds.has(exam.questions[currentQuestionIndex].id)
                ? 'Đã đánh dấu xem lại (Hủy bỏ)'
                : 'Đánh dấu xem lại'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
