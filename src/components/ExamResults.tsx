import React, { useState } from 'react';
import { 
  Award, Clock, CheckCircle2, XCircle, RotateCcw, 
  Printer, Download, ShieldAlert, ArrowLeft, Eye, X
} from 'lucide-react';
import { Exam, StudentAnswers, ExamEvaluation } from '../types/exam';
import { MathRenderer } from './MathRenderer';

export type PrintMode = 'exam_only' | 'exam_with_key' | 'key_only' | string;

interface ExamResultsProps {
  exam: Exam;
  answers: StudentAnswers;
  evaluation: any;
  candidateInfo?: {
    name?: string;
    studentClass?: string;
    candidateNumber?: string;
  };
  timeRemainingSeconds?: number;
  auditLog?: any;
  onRetake: () => void;
  onOpenTeacherMode?: () => void;
  onBackToPortal?: () => void;
  onOpenPrint?: (printMode: any) => void;
  onPrintExamOnly?: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  answers,
  evaluation,
  candidateInfo = {},
  auditLog,
  onRetake,
  onOpenTeacherMode,
  onBackToPortal,
  onOpenPrint,
}) => {
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  const totalScore = Number(evaluation?.totalScore ?? 0);
  const maxScore = Number(exam.totalPoints || 10);
  const percentage = Math.round((totalScore / (maxScore || 10)) * 100);
  
  const feedbackList: any[] = evaluation?.detailedFeedback || evaluation?.itemResults || [];
  const correctCount = feedbackList.filter((f: any) => Boolean(f?.isCorrect)).length;
  const totalQuestions = exam.questions?.length || 0;

  const handleExit = () => {
    if (onOpenTeacherMode) {
      onOpenTeacherMode();
    } else if (onBackToPortal) {
      onBackToPortal();
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['SBD', 'Họ và tên', 'Lớp', 'Mã đề', 'Điểm số', 'Tỉ lệ', 'Số câu đúng', 'Số lần vi phạm'];
      const row = [
        candidateInfo.candidateNumber || 'N/A',
        `"${candidateInfo.name || 'Thí sinh'}"`,
        `"${candidateInfo.studentClass || 'N/A'}"`,
        exam.code || '101',
        totalScore.toFixed(2),
        `${percentage}%`,
        `${correctCount}/${totalQuestions}`,
        auditLog?.violations?.length ?? 0
      ];

      const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ket_Qua_${candidateInfo.candidateNumber || 'ThiSinh'}_${exam.code || '101'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Không thể xuất file bảng điểm.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Banner điểm số */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <Award className="w-9 h-9 text-indigo-400" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-2xs font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Đã hoàn thành bài thi
                </span>
                <h1 className="text-xl sm:text-2xl font-black mt-1 text-white">
                  {candidateInfo.name || 'Thí sinh'}
                </h1>
                <p className="text-xs text-slate-300">
                  Lớp: <strong className="text-white">{candidateInfo.studentClass || 'N/A'}</strong> | SBD: <strong className="text-amber-300">{candidateInfo.candidateNumber || 'N/A'}</strong> | Mã đề: <strong className="text-white">{exam.code || '101'}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                {totalScore.toFixed(2)}
                <span className="text-sm font-semibold text-slate-300">/{maxScore}</span>
              </div>
              <span className="text-2xs font-bold text-slate-200 mt-0.5">
                Đạt {percentage}% tổng điểm
              </span>
            </div>
          </div>
        </div>

        {/* Nhật ký giám sát vi phạm */}
        {auditLog && auditLog.violations && auditLog.violations.length > 0 && (
          <div className="p-4 sm:p-6 bg-rose-50/50 border-b border-rose-200/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs sm:text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Nhật ký giám sát quy chế phòng thi:</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-200 text-rose-900">
                Số lần vi phạm: {auditLog.violations.length} lần
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {auditLog.violations.map((v: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-200 text-xs">
                  <span className="text-rose-700 font-medium">
                    ⚠️ Lần {index + 1}: {v.reason || 'Mất tiêu điểm cửa sổ / Chuyển tab'}
                  </span>
                  <span className="text-slate-400 font-mono text-2xs">
                    {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thanh tác vụ */}
        <div className="p-4 sm:p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Xem lại bài làm</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải bảng điểm (CSV/Excel)</span>
            </button>

            {onOpenPrint && (
              <button
                type="button"
                onClick={() => onOpenPrint('exam_with_key')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-600/20 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu kết quả thi</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài thi</span>
          </button>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Trở về màn hình Giáo viên (Yêu cầu mã PIN)</span>
        </button>
      </div>

      {/* Modal đối chiếu xem lại bài làm an toàn */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Xem lại chi tiết bài làm</h3>
                  <p className="text-2xs text-slate-400">
                    Đối chiếu câu trả lời của thí sinh và đáp án
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50">
              {exam.questions?.map((q: any, idx: number) => {
                const userAns = answers[q.id];
                const fb = feedbackList.find((f: any) => f?.questionId === q.id);

                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <span className="font-black text-xs text-indigo-600 uppercase">
                        {q.title || `Câu ${idx + 1}`} ({q.part})
                      </span>
                      {fb ? (
                        fb.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đúng ({fb.pointsAwarded ?? fb.score ?? 0}đ)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                            <XCircle className="w-3.5 h-3.5" /> Sai ({fb.pointsAwarded ?? fb.score ?? 0}đ)
                          </span>
                        )
                      ) : null}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800">
                      <MathRenderer content={q.stem} />
                    </div>

                    {q.diagram?.url && (
                      <div className="my-2 flex justify-center">
                        <img src={q.diagram.url} alt="Sơ đồ" className="max-h-48 rounded-lg" />
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="text-slate-600 font-semibold">
                        Bài làm của thí sinh:{' '}
                        <strong className="text-slate-900">
                          {typeof userAns === 'object' && userAns !== null
                            ? JSON.stringify(userAns)
                            : (userAns || 'Chưa trả lời')}
                        </strong>
                      </div>

                      {q.correctAnswer && (
                        <div className="text-emerald-700 font-bold">
                          Đáp án đúng: {String(q.correctAnswer)}
                        </div>
                      )}

                      {q.correctValue && (
                        <div className="text-emerald-700 font-bold">
                          Đáp số chuẩn: {String(q.correctValue)} {q.acceptedUnits?.[0] || ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
              >
                Đóng xem lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};