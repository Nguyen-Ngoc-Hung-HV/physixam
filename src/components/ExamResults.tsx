import React, { useState } from 'react';
import { Exam, StudentAnswers, ExamEvaluation } from '../types/exam';
import { 
  CheckCircle2, XCircle, RotateCcw, 
  ArrowLeft, Award, Eye, FileText, 
  Download, Printer, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { PrintMode } from './PrintModal';

interface ExamResultsProps {
  exam: Exam;
  answers: StudentAnswers;
  evaluation: ExamEvaluation;
  onRetake: () => void;
  onOpenTeacherMode: () => void;
  onOpenPrint: (mode: PrintMode) => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  answers,
  evaluation,
  onRetake,
  onOpenTeacherMode,
  onOpenPrint,
}) => {
  const [showReview, setShowReview] = useState<boolean>(false);

  // Đọc thông tin thí sinh thực tế khi bắt đầu làm bài (Không còn bị gán Nguyễn Văn A)
  const candidateName = (evaluation as any).candidateName || 'Thí sinh';
  const studentClass = (evaluation as any).studentClass || '12A1';
  const candidateNumber = (evaluation as any).candidateNumber || 'SBD-12345';

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
  };

  const handleExportCSV = () => {
    const headers = ['Họ và tên', 'Lớp', 'SBD', 'Bài thi', 'Mã đề', 'Điểm số', 'Điểm tối đa', 'Tỷ lệ %', 'Thời gian làm bài', 'Thời điểm nộp'];
    const row = [
      `"${candidateName}"`,
      `"${studentClass}"`,
      `"${candidateNumber}"`,
      `"${exam.title}"`,
      `"${exam.code || '101'}"`,
      evaluation.totalScore.toFixed(2),
      evaluation.maxScore.toFixed(2),
      `${evaluation.percentage.toFixed(1)}%`,
      `"${formatTimeSpent(evaluation.timeSpentSeconds)}"`,
      `"${new Date().toLocaleString('vi-VN')}"`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ket_qua_${candidateNumber}_${studentClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Thẻ điểm tổng kết & thông tin định danh thí sinh */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/30 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-2xs font-black uppercase tracking-wider mb-4">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          Đã hoàn thành bài thi môn Vật lí
        </div>

        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
          Điểm tổng kết bài thi
        </div>
        <div className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300 tracking-tight">
          {evaluation.totalScore.toFixed(2)}
          <span className="text-xl sm:text-2xl text-slate-400 font-normal"> / {evaluation.maxScore.toFixed(2)}</span>
        </div>
        <div className="text-xs font-bold text-indigo-300 mt-2">
          Đạt {evaluation.percentage.toFixed(1)}% số điểm tối đa • Thời gian làm bài: {formatTimeSpent(evaluation.timeSpentSeconds)}
        </div>

        {/* Khung thông tin thí sinh thực tế */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Thí sinh:</span>
            <strong className="text-white font-bold">{candidateName}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Lớp:</span>
            <strong className="text-sky-300 font-bold">{studentClass}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">SBD:</span>
            <strong className="text-amber-400 font-mono font-bold">{candidateNumber}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Mã đề:</span>
            <strong className="text-emerald-400 font-mono font-bold">{exam.code || '101'}</strong>
          </div>
        </div>
      </div>

      {/* 2. Thống kê giám sát quy chế phòng thi */}
      {evaluation.auditLog && (
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Nhật ký giám sát quy chế phòng thi:
            </span>
            <span className={`text-2xs font-bold px-2.5 py-1 rounded-full ${
              evaluation.auditLog.violationCount > 0 
                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              Số lần vi phạm: {evaluation.auditLog.violationCount} lần
            </span>
          </div>

          {evaluation.auditLog.violationCount > 0 && evaluation.auditLog.violations && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {evaluation.auditLog.violations.map((v: any, i: number) => (
                <div key={v.id || i} className="text-2xs p-2 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between text-rose-900">
                  <span className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Lần {i + 1}: {v.reason || v.description || 'Vi phạm quy chế'}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">{v.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Các nút thao tác kết quả */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setShowReview(!showReview)}
          className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {showReview ? 'Ẩn chi tiết bài làm' : 'Xem lại bài làm'}
        </button>

        <button
          onClick={handleExportCSV}
          className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Tải bảng điểm (CSV/Excel)
        </button>

        <button
          onClick={() => onOpenPrint('exam_only')}
          className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" />
          In phiếu kết quả thi
        </button>

        <button
          onClick={onRetake}
          className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Làm lại bài thi
        </button>
      </div>

      {/* Nút quay lại màn hình Giáo viên (Yêu cầu mã PIN) */}
      <div className="text-center pt-2">
        <button
          onClick={onOpenTeacherMode}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Trở về màn hình Giáo viên (Yêu cầu mã PIN)
        </button>
      </div>

      {/* 4. Khung chi tiết xem lại câu trả lời */}
      {showReview && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-indigo-600" />
            Chi tiết từng câu hỏi & Đối chiếu kết quả:
          </h3>

          <div className="space-y-3">
            {exam.questions.map((q: any, idx: number) => {
              // Hỗ trợ cả trường hợp evaluation.results là Object hoặc Array
              const evalResults = evaluation.results as any;
              const evalItem = Array.isArray(evalResults)
                ? evalResults.find((r: any) => r.questionId === q.id)
                : evalResults?.[q.id];

              const isCorrect = evalItem ? evalItem.isCorrect : false;
              const earnedScore = evalItem ? evalItem.scoreEarned : 0;

              return (
                <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Câu {idx + 1}:
                    </span>
                    <span className={`inline-flex items-center gap-1 font-bold text-2xs px-2 py-0.5 rounded-full ${
                      isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {earnedScore !== undefined ? earnedScore.toFixed(2) : '0.00'} điểm
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium">{q.content}</p>

                  {/* Hiển thị options nếu là trắc nghiệm */}
                  {q.options && Array.isArray(q.options) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-2xs">
                      {q.options.map((opt: any) => {
                        const studentAns = answers[q.id];
                        const isStudentChoice = studentAns === opt.key;
                        const isCorrectKey = q.correctKey === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2 rounded-xl border flex items-start gap-2 ${
                              isCorrectKey
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                : isStudentChoice
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-mono font-bold uppercase">{opt.key}.</span>
                            <span>{opt.content}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lời giải chi tiết */}
                  {q.explanation && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-2xs text-indigo-950 mt-1">
                      <strong className="text-indigo-800">Lời giải chi tiết: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};