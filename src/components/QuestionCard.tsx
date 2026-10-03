import React, { useEffect } from 'react';
import { Flag, ArrowLeft, ArrowRight, Check, X, Info } from 'lucide-react';
import { Question, StudentAnswers, MultipleChoiceQuestion, TrueFalseClusterQuestion, ShortAnswerQuestion, DiagramData } from '../types/exam';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { resolveQuestionDiagram, FIGURE_MENTION_REGEX } from '../utils/diagramResolver';
import { stripCognitiveLevelPrefix } from '../utils/cognitiveLevel';

interface QuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  answers: StudentAnswers;
  onAnswerChange: (questionId: string, answer: any) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  onUpdateQuestionDiagram?: (questionId: string, diagram: DiagramData | null) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  answers,
  onAnswerChange,
  isFlagged,
  onToggleFlag,
  onPrev,
  onNext,
  onUpdateQuestionDiagram,
}) => {
  const currentAnswer = answers[question.id];
  const resolvedDiagram = resolveQuestionDiagram(question);
  const mentionsFigure = FIGURE_MENTION_REGEX.test(question.stem) || Boolean((question as any).needs_diagram || (question as any).missingPrompt);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (question.type === 'multiple_choice') {
        const key = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(key)) {
          onAnswerChange(question.id, key);
        } else if (key === '1') onAnswerChange(question.id, 'A');
        else if (key === '2') onAnswerChange(question.id, 'B');
        else if (key === '3') onAnswerChange(question.id, 'C');
        else if (key === '4') onAnswerChange(question.id, 'D');
      }

      if (e.key === 'ArrowRight' && index < totalQuestions - 1) {
        onNext();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, index, totalQuestions, onAnswerChange, onNext, onPrev]);

  const handleSelectMCQ = (optionId: string) => {
    onAnswerChange(question.id, optionId);
  };

  const handleToggleTF = (subItemId: string, value: boolean) => {
    const existing = (currentAnswer && typeof currentAnswer === 'object' && !('value' in currentAnswer))
      ? (currentAnswer as { [key: string]: boolean })
      : {};
    
    onAnswerChange(question.id, {
      ...existing,
      [subItemId]: value,
    });
  };

  const handleShortAnswerChange = (field: 'value' | 'unit', val: string) => {
    const existing = (currentAnswer && typeof currentAnswer === 'object' && 'value' in currentAnswer)
      ? (currentAnswer as { value: string; unit: string })
      : { value: '', unit: '' };

    onAnswerChange(question.id, {
      ...existing,
      [field]: val,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[580px]">
      
      {/* Tiêu đề câu hỏi */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-2xs">
            Câu {index + 1} / {totalQuestions}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {question.part === 'Phần I' ? 'Phần I: Trắc nghiệm 4 lựa chọn' : question.part === 'Phần II' ? 'Phần II: Đúng/Sai' : 'Phần III: Trả lời ngắn'}
          </span>
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-200/70 text-slate-700">
            {question.topic}
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {question.points} Điểm
          </span>
        </div>

        <button
          onClick={onToggleFlag}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
            isFlagged
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
          <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
        </button>
      </div>

      {/* Nội dung đề bài câu hỏi */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        
        {/* Tiêu đề câu */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {question.title}
        </h2>

        {/* Lời dẫn đề bài với KaTeX (ẩn thẻ mức độ nhận thức trong chế độ học sinh làm bài) */}
        <div className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-2">
          <MathRenderer content={stripCognitiveLevelPrefix(question.stem)} />
        </div>

        {/* Khối hiển thị sơ đồ hoặc hình vẽ nếu có hoặc khi có đề cập [Hình vẽ] */}
        {(resolvedDiagram || mentionsFigure) && (
          <div className="my-3">
            <DiagramViewer 
              diagram={resolvedDiagram} 
              questionId={question.id}
              questionStem={question.stem}
              questionTitle={question.title}
              questionTopic={question.topic}
              onAttachDiagram={(newDiag) => onUpdateQuestionDiagram?.(question.id, newDiag)}
              onRemoveDiagram={() => onUpdateQuestionDiagram?.(question.id, null)}
              canEdit={Boolean(onUpdateQuestionDiagram)}
              missingPrompt={resolvedDiagram ? undefined : 'Đề bài có nhắc đến hình vẽ nhưng chưa nhúng tệp hình. Bạn có thể tải ảnh hoặc nhờ AI tạo đồ thị SVG ngay bên dưới.'}
            />
          </div>
        )}

        {/* Vùng chọn / nhập câu trả lời theo từng dạng bài */}
        <div className="pt-2">

          {/* PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN */}
          {question.type === 'multiple_choice' && (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chọn phương án trả lời đúng nhất:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {(question as MultipleChoiceQuestion).options.map((option) => {
                  const isSelected = currentAnswer === option.id;

                  return (
                    <label
                      key={option.id}
                      onClick={() => handleSelectMCQ(option.id)}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {option.id}
                      </div>

                      <div className="text-sm sm:text-base text-slate-800 pt-0.5 flex-1">
                        <MathRenderer content={option.text} />
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="text-2xs text-slate-400 italic pt-1">
                Mẹo: Bạn có thể nhấn các phím số [1-4] hoặc chữ cái [A-D] trên bàn phím để chọn nhanh đáp án.
              </div>
            </div>
          )}

          {/* PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI */}
          {question.type === 'true_false_cluster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Đánh giá từng nhận định là Đúng hoặc Sai:
                </span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Chấm điểm cụm 4 lệnh hỏi
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                {(question as TrueFalseClusterQuestion).items.map((subItem) => {
                  const userTf = (currentAnswer && typeof currentAnswer === 'object' && !('value' in currentAnswer))
                    ? (currentAnswer as { [key: string]: boolean })[subItem.id]
                    : undefined;

                  return (
                    <div
                      key={subItem.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                          {subItem.id}
                        </span>
                        <div className="text-sm text-slate-800 leading-relaxed">
                          <MathRenderer content={stripCognitiveLevelPrefix(subItem.statement)} />
                        </div>
                      </div>

                      {/* Nút bấm chọn Đúng / Sai */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTF(subItem.id, true)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            userTf === true
                              ? 'bg-emerald-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Đúng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleTF(subItem.id, false)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            userTf === false
                              ? 'bg-rose-600 text-white shadow-xs scale-102'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          <span>Sai</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Quy định chấm điểm Phần II: Đúng 1 lệnh = 0,10 điểm | Đúng 2 lệnh = 0,25 điểm | Đúng 3 lệnh = 0,50 điểm | Đúng cả 4 lệnh = 1,00 điểm.
                </span>
              </div>
            </div>
          )}

          {/* PHẦN III: TRẢ LỜI NGẮN */}
          {question.type === 'short_answer' && (
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nhập kết quả số học đã tính toán kèm theo đơn vị đo vật lý (SI):
              </div>

              <div className="max-w-xl bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Ô nhập giá trị số */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Giá trị số tính được (chấp nhận cả dấu chấm hoặc dấu phẩy):
                    </label>
                    <input
                      type="text"
                      placeholder={(question as ShortAnswerQuestion).placeholder || 'ví dụ: 1296'}
                      value={(currentAnswer as any)?.value || ''}
                      onChange={(e) => handleShortAnswerChange('value', e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-2xs"
                    />
                  </div>

                  {/* Ô nhập đơn vị */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Đơn vị đo:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={(question as ShortAnswerQuestion).unitHint || 'ví dụ: J'}
                        value={(currentAnswer as any)?.unit || ''}
                        onChange={(e) => handleShortAnswerChange('unit', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Các đơn vị gợi ý */}
                {(question as ShortAnswerQuestion).acceptedUnits?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <span>Đơn vị được chấp nhận:</span>
                    {(question as ShortAnswerQuestion).acceptedUnits.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleShortAnswerChange('unit', u)}
                        className="px-2 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-mono font-semibold transition cursor-pointer"
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hộp xem trước kết quả đã lưu */}
                {(currentAnswer as any)?.value && (
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kết quả đã ghi nhận:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      {(currentAnswer as any)?.value} {(currentAnswer as any)?.unit || ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Thanh điều hướng chân trang */}
      <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            index === 0
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'text-slate-700 hover:bg-slate-200/70 border border-slate-300 bg-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <div className="text-xs text-slate-400 hidden sm:block">
          Sử dụng phím mũi tên [←] [→] để chuyển câu hỏi nhanh
        </div>

        <button
          onClick={onNext}
          disabled={index === totalQuestions - 1}
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
            index === totalQuestions - 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
          }`}
        >
          <span>Câu tiếp</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
