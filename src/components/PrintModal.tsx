import React, { useState, useEffect } from 'react';
import { 
  X, Printer, FileText, CheckCircle2, Award, Clock, 
  HelpCircle, Sparkles, BookOpen, Layers, Check, Download,
  Table, Shuffle
} from 'lucide-react';
import { Exam, StudentAnswers, ExamEvaluation, ExamVariantBundle } from '../types/exam';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { resolveQuestionDiagram, FIGURE_MENTION_REGEX } from '../utils/diagramResolver';
import { exportScoreReportToCSV, StudentInfo } from '../utils/exportCsv';
import { exportAnswerMatrixToCSV, exportBundleToJson } from '../utils/shuffler';
import { 
  getQuestionCognitiveLevel, 
  getStatementCognitiveLevel, 
  CognitiveLevelBadge, 
  stripCognitiveLevelPrefix 
} from '../utils/cognitiveLevel';

export type PrintMode = 'exam_only' | 'exam_with_solutions' | 'student_report' | 'all_variants_with_matrix';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  mode?: PrintMode;
  evaluation?: ExamEvaluation | null;
  answers?: StudentAnswers;
  bundle?: ExamVariantBundle | null;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  exam,
  mode = 'exam_only',
  evaluation = null,
  bundle = null,
}) => {
  const [selectedMode, setSelectedMode] = useState<PrintMode>(mode);
  const [schoolName, setSchoolName] = useState('SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG - TRƯỜNG THPT HÙNG VƯƠNG');
  const [studentName, setStudentName] = useState('Nguyễn Văn A');
  const [studentClass, setStudentClass] = useState('12A1');
  const [candidateNumber, setCandidateNumber] = useState('120456');
  const [examCode, setExamCode] = useState(exam.code || '101');

  useEffect(() => {
    if (mode) setSelectedMode(mode);
    if (exam.code) setExamCode(exam.code);
  }, [mode, exam.code, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!evaluation) return;
    const info: StudentInfo = {
      name: studentName.trim() || 'Thí sinh',
      studentClass: studentClass.trim() || '12A1',
      candidateNumber: candidateNumber.trim() || examCode
    };
    exportScoreReportToCSV(exam, evaluation, info);
  };

  /**
   * Hàm kết xuất mẫu đề thi A4 chính thức cho một biến thể hoặc đề gốc
   */
  const renderExamPaper = (
    paperExam: Exam,
    codeLabel: string,
    withSolutions: boolean,
    studentLineInfo?: { name: string; stClass: string; sbd: string }
  ) => {
    const p1 = paperExam.questions.filter((q) => q.part === 'Phần I');
    const p2 = paperExam.questions.filter((q) => q.part === 'Phần II');
    const p3 = paperExam.questions.filter((q) => q.part === 'Phần III');

    const displayName = studentLineInfo?.name || studentName;
    const displayClass = studentLineInfo?.stClass || studentClass;
    const displaySbd = studentLineInfo?.sbd || candidateNumber;

    return (
      <div className="space-y-6">
        {/* TIÊU ĐỀ ĐỀ THI CHUẨN BỘ GD&ĐT */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="grid grid-cols-12 gap-2 text-center text-xs sm:text-sm font-sans">
            <div className="col-span-5 border-r border-slate-300 pr-2">
              <div className="font-bold uppercase tracking-tight text-2xs sm:text-xs">SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG</div>
              <div className="font-extrabold uppercase text-slate-900 text-xs sm:text-sm">TRƯỜNG THPT HÙNG VƯƠNG</div>
              <div className="text-2xs text-slate-400 font-mono">-----------------------</div>
              <div className="font-medium text-slate-600 text-2xs">ĐỀ THI CHÍNH THỨC</div>
              <div className="text-3xs text-slate-500 italic mt-0.5">(Đề thi có {paperExam.questions.length} câu)</div>
            </div>

            <div className="col-span-7 pl-2">
              <div className="font-extrabold uppercase text-slate-900 tracking-wide text-xs sm:text-sm md:text-base">
                KIỂM TRA ĐÁNH GIÁ NĂNG LỰC VẬT LÝ
              </div>
              <div className="font-semibold text-slate-700 text-2xs mt-0.5">
                NĂM HỌC 2026 - 2027
              </div>
              <div className="font-bold text-indigo-900 text-xs mt-0.5">
                Môn: VẬT LÍ - {paperExam.gradeLevel ? paperExam.gradeLevel.replace(/\s*\(?Chương trình GDPT 2018\)?/gi, '').trim() : 'Lớp 12'}
              </div>
              <div className="text-2xs text-slate-700 italic mt-0.5">
                Thời gian làm bài: {paperExam.durationMinutes || 45} phút (không kể phát đề)
              </div>
            </div>
          </div>

          {/* KHUNG ĐIỀN THÔNG TIN THÍ SINH */}
          <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs font-sans gap-y-1">
            <div>
              Họ và tên thí sinh: <span className="font-bold font-mono text-slate-900 underline underline-offset-2">{displayName}</span>
            </div>
            <div>
              Lớp: <span className="font-bold font-mono text-slate-900">{displayClass}</span>
            </div>
            <div>
              Số báo danh: <span className="font-bold font-mono text-slate-900">{displaySbd}</span>
            </div>
            <div className="border-2 border-slate-900 px-2.5 py-0.5 font-bold font-mono text-sm bg-slate-50">
              Mã đề: {codeLabel}
            </div>
          </div>
        </div>

        {/* ================= PHẦN I ================= */}
        {p1.length > 0 && (
          <div className="space-y-4">
            <div className="font-sans font-bold text-sm bg-slate-100 p-2 rounded border border-slate-300">
              PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
              <span className="font-normal text-xs block text-slate-700 mt-0.5">
                Thí sinh trả lời từ câu 1 đến câu {p1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
              </span>
            </div>

            <div className="space-y-6">
              {p1.map((q, idx) => {
                const mcq = q as any;
                return (
                  <div key={q.id} className="print-avoid-break space-y-2 text-justify">
                    <div className="font-medium text-slate-900">
                      <span className="font-bold font-sans">Câu {idx + 1}: </span>
                      {withSolutions && (
                        <CognitiveLevelBadge level={getQuestionCognitiveLevel(q)} showFullName={false} className="mr-1.5" />
                      )}
                      <MathRenderer content={withSolutions ? q.stem : stripCognitiveLevelPrefix(q.stem)} inline={true} />
                    </div>

                    {(() => {
                      const resolved = resolveQuestionDiagram(q);
                      const mentionsFig = FIGURE_MENTION_REGEX.test(q.stem);
                      if (!resolved && !mentionsFig) return null;
                      return (
                        <div className="my-2 max-w-md mx-auto text-center print-avoid-break">
                          <DiagramViewer 
                            diagram={resolved} 
                            allowZoom={false} 
                            printMode={true} 
                            missingPrompt={resolved ? undefined : 'Hình vẽ mô tả đính kèm trong tài liệu'}
                          />
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-xs sm:text-sm font-sans">
                      {mcq.options?.map((opt: any) => {
                        const isCorrect = withSolutions && opt.id === mcq.correctAnswer;
                        return (
                          <div 
                            key={opt.id} 
                            className={`flex items-start gap-1.5 p-1 rounded ${
                              isCorrect ? 'bg-amber-100 font-bold border border-amber-400' : ''
                            }`}
                          >
                            <span className="font-bold min-w-[20px]">{opt.id}.</span>
                            <div>
                              <MathRenderer content={opt.text} inline={true} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {withSolutions && q.explanation && (
                      <div className="mt-2 p-2.5 bg-slate-50 border-l-4 border-indigo-600 rounded text-xs font-sans text-slate-700 space-y-1">
                        <div className="font-bold text-indigo-900">
                          Đáp án đúng: {mcq.correctAnswer}
                        </div>
                        {q.explanation.keyFormula && (
                          <div>
                            Công thức: <MathRenderer content={`$${q.explanation.keyFormula}$`} inline={true} />
                          </div>
                        )}
                        {q.explanation.overview && (
                          <div><MathRenderer content={q.explanation.overview} /></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PHẦN II ================= */}
        {p2.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-300">
            <div className="font-sans font-bold text-sm bg-slate-100 p-2 rounded border border-slate-300">
              PHẦN II. Câu trắc nghiệm đúng sai.
              <span className="font-normal text-xs block text-slate-700 mt-0.5">
                Thí sinh trả lời từ câu {p1.length + 1} đến câu {p1.length + p2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
              </span>
            </div>

            <div className="space-y-6">
              {p2.map((q, idx) => {
                const tf = q as any;
                return (
                  <div key={q.id} className="print-avoid-break space-y-2 text-justify">
                    <div className="font-medium text-slate-900">
                      <span className="font-bold font-sans">Câu {p1.length + idx + 1}: </span>
                      {withSolutions && (
                        <CognitiveLevelBadge level={getQuestionCognitiveLevel(q)} showFullName={false} className="mr-1.5" />
                      )}
                      <MathRenderer content={withSolutions ? q.stem : stripCognitiveLevelPrefix(q.stem)} inline={true} />
                    </div>

                    {(() => {
                      const resolved = resolveQuestionDiagram(q);
                      const mentionsFig = FIGURE_MENTION_REGEX.test(q.stem);
                      if (!resolved && !mentionsFig) return null;
                      return (
                        <div className="my-2 max-w-md mx-auto text-center print-avoid-break">
                          <DiagramViewer 
                            diagram={resolved} 
                            allowZoom={false} 
                            printMode={true} 
                            missingPrompt={resolved ? undefined : 'Hình vẽ mô tả đính kèm trong tài liệu'}
                          />
                        </div>
                      );
                    })()}

                    <div className="space-y-1.5 pt-1 text-xs sm:text-sm font-sans">
                      {tf.items?.map((item: any, sIdx: number) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 p-1 border-b border-slate-100">
                          <div className="flex items-start gap-1.5 flex-1">
                            <span className="font-bold min-w-[20px]">{item.id})</span>
                            {withSolutions && (
                              <CognitiveLevelBadge level={getStatementCognitiveLevel(item, sIdx)} showFullName={false} className="mr-1" />
                            )}
                            <div><MathRenderer content={withSolutions ? item.statement : stripCognitiveLevelPrefix(item.statement)} inline={true} /></div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2 text-xs font-mono font-bold">
                            {withSolutions ? (
                              <span className={`px-2 py-0.5 rounded text-2xs ${item.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                [{item.correctAnswer ? 'ĐÚNG' : 'SAI'}]
                              </span>
                            ) : (
                              <div className="flex items-center gap-3 text-slate-500">
                                <span>[ ] Đúng</span>
                                <span>[ ] Sai</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {withSolutions && q.explanation && (
                      <div className="mt-2 p-2.5 bg-slate-50 border-l-4 border-indigo-600 rounded text-xs font-sans text-slate-700 space-y-1">
                        <div className="font-bold text-indigo-900">Hướng dẫn giải:</div>
                        {q.explanation.stepByStep?.map((s: string, sIdx: number) => (
                          <div key={sIdx} className="text-2xs"><MathRenderer content={s} /></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PHẦN III ================= */}
        {p3.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-300">
            <div className="font-sans font-bold text-sm bg-slate-100 p-2 rounded border border-slate-300">
              PHẦN III. Câu trắc nghiệm trả lời ngắn.
              <span className="font-normal text-xs block text-slate-700 mt-0.5">
                Thí sinh trả lời từ câu {p1.length + p2.length + 1} đến câu {paperExam.questions.length}. Điền kết quả số học vào ô trống.
              </span>
            </div>

            <div className="space-y-6">
              {p3.map((q, idx) => {
                const sa = q as any;
                return (
                  <div key={q.id} className="print-avoid-break space-y-2 text-justify">
                    <div className="font-medium text-slate-900">
                      <span className="font-bold font-sans">
                        Câu {p1.length + p2.length + idx + 1}:{' '}
                      </span>
                      {withSolutions && (
                        <CognitiveLevelBadge level={getQuestionCognitiveLevel(q)} showFullName={false} className="mr-1.5" />
                      )}
                      <MathRenderer content={withSolutions ? q.stem : stripCognitiveLevelPrefix(q.stem)} inline={true} />
                    </div>

                    {(() => {
                      const resolved = resolveQuestionDiagram(q);
                      const mentionsFig = FIGURE_MENTION_REGEX.test(q.stem);
                      if (!resolved && !mentionsFig) return null;
                      return (
                        <div className="my-2 max-w-md mx-auto text-center print-avoid-break">
                          <DiagramViewer 
                            diagram={resolved} 
                            allowZoom={false} 
                            printMode={true} 
                            missingPrompt={resolved ? undefined : 'Hình vẽ mô tả đính kèm trong tài liệu'}
                          />
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-dashed border-slate-300 rounded font-sans text-xs">
                      <div>
                        <span className="font-semibold text-slate-600">Đơn vị: </span>
                        <span className="font-mono">{sa.unitHint || 'Chuẩn SI'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Đáp số:</span>
                        {withSolutions ? (
                          <span className="font-bold font-mono text-indigo-700 text-sm px-3 py-0.5 bg-amber-100 border border-amber-300 rounded">
                            {sa.correctValue} {sa.unitHint || ''}
                          </span>
                        ) : (
                          <span className="inline-block w-36 border-b-2 border-dotted border-slate-800"></span>
                        )}
                      </div>
                    </div>

                    {withSolutions && q.explanation && (
                      <div className="mt-2 p-2.5 bg-slate-50 border-l-4 border-indigo-600 rounded text-xs font-sans text-slate-700 space-y-1">
                        <div className="font-bold text-indigo-900">Hướng dẫn giải:</div>
                        {q.explanation.keyFormula && (
                          <div>Công thức: <MathRenderer content={`$${q.explanation.keyFormula}$`} inline={true} /></div>
                        )}
                        {q.explanation.overview && (
                          <div><MathRenderer content={q.explanation.overview} /></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BẢNG ĐÁP ÁN NHANH NẾU IN KÈM ĐÁP ÁN */}
        {withSolutions && (
          <div className="print-page-break pt-6 border-t-2 border-slate-900 space-y-4 font-sans">
            <h3 className="text-center font-bold text-base uppercase text-slate-900">
              BẢNG ĐÁP ÁN MÃ ĐỀ: {codeLabel}
            </h3>
            
            <div className="space-y-1">
              <div className="font-bold text-xs">PHẦN I (0,25đ / câu):</div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center text-xs">
                {p1.map((q, idx) => (
                  <div key={q.id} className="border border-slate-300 p-1 rounded bg-slate-50">
                    <div className="text-3xs text-slate-500">C{idx + 1}</div>
                    <div className="font-bold text-indigo-700 font-mono">{(q as any).correctAnswer}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="font-bold text-xs">PHẦN II (Đúng / Sai):</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {p2.map((q, idx) => (
                  <div key={q.id} className="border border-slate-300 p-2 rounded bg-slate-50">
                    <div className="font-bold text-slate-800 text-2xs mb-1">
                      Câu {p1.length + idx + 1}:
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono font-bold text-2xs">
                      {(q as any).items?.map((it: any) => (
                        <div key={it.id} className={it.correctAnswer ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}>
                          {it.id}: {it.correctAnswer ? 'Đ' : 'S'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="font-bold text-xs">PHẦN III (Trả lời ngắn):</div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                {p3.map((q, idx) => (
                  <div key={q.id} className="border border-slate-300 p-2 rounded bg-slate-50 text-center">
                    <div className="text-3xs text-slate-500">
                      Câu {p1.length + p2.length + idx + 1}
                    </div>
                    <div className="font-bold text-indigo-700 font-mono">
                      {(q as any).correctValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs font-sans text-slate-500 pt-6 border-t border-slate-300 italic">
          ---------- HẾT MÃ ĐỀ {codeLabel} ----------<br />
          (Cán bộ coi thi không giải thích gì thêm)
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[94vh] overflow-hidden border border-slate-200">
        
        {/* THANH ĐIỀU KHIỂN ĐẦU HỘP THOẠI (ẨN KHI IN) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">In Đề Thi & Xuất Tệp PDF Chuẩn Bộ GD&ĐT</h2>
              <p className="text-xs text-slate-400">
                Tối ưu hóa ngắt trang tự động, công thức KaTeX sắc nét và đồ thị vector chuẩn A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In ngay / Lưu PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BẢNG CẤU HÌNH TÙY CHỌN BẢN IN (ẨN KHI IN) */}
        <div className="no-print p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0">
          
          {/* Lựa chọn loại tài liệu cần in */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chế độ in:</span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex-wrap">
                <button
                  onClick={() => setSelectedMode('exam_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMode === 'exam_only'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 Đề thi học sinh (Mã {examCode})
                </button>

                <button
                  onClick={() => setSelectedMode('exam_with_solutions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMode === 'exam_with_solutions'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Đề thi kèm Đáp án & Lời giải
                </button>

                {bundle && bundle.variants.length > 0 && (
                  <button
                    onClick={() => setSelectedMode('all_variants_with_matrix')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedMode === 'all_variants_with_matrix'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-500" />
                    <span>📚 Tất cả {bundle.variants.length} mã đề & Ma trận đáp án</span>
                  </button>
                )}

                {evaluation && (
                  <button
                    onClick={() => setSelectedMode('student_report')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedMode === 'student_report'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏆 Phiếu báo điểm kết quả học sinh
                  </button>
                )}
              </div>
            </div>

            {selectedMode === 'all_variants_with_matrix' && bundle && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAnswerMatrixToCSV(bundle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tải ma trận (Excel)</span>
                </button>
                <button
                  onClick={() => exportBundleToJson(bundle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải bộ mã (.json)</span>
                </button>
              </div>
            )}

            {evaluation && selectedMode === 'student_report' && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-2xs"
                title="Tải bảng điểm Excel mã hóa UTF-8 BOM hiển thị tiếng Việt chuẩn"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải bảng điểm (Excel / CSV)</span>
              </button>
            )}
          </div>

          {/* Các trường nhập thông tin tùy biến trên tiêu đề bản in */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Tên trường / Đơn vị:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Họ và tên thí sinh:</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Lớp / Số báo danh:</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Lớp"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={candidateNumber}
                  onChange={(e) => setCandidateNumber(e.target.value)}
                  placeholder="SBD"
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-500 mb-1">Mã đề in:</label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="text-2xs text-slate-500 flex items-center gap-1.5 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Mẹo: Trong hộp thoại in của trình duyệt (Ctrl+P / Command+P), chọn <strong>"Save as PDF"</strong>, khổ giấy <strong>A4</strong>, tỷ lệ <strong>Mặc định (100%)</strong> và bật tùy chọn <strong>"Background graphics"</strong> để có bản in đẹp nhất.</span>
          </div>
        </div>

        {/* VÙNG NỘI DUNG XEM TRƯỚC VÀ TRANG IN CHÍNH THỨC */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/60 print:bg-white print:p-0">
          
          <div className="bg-white max-w-[210mm] mx-auto p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 font-serif leading-relaxed text-[11pt]">
            
            {/* TRƯỜNG HỢP 1 & 2: IN 1 MÃ ĐỀ (ĐỀ HỌC SINH HOẶC KÈM ĐÁP ÁN) */}
            {(selectedMode === 'exam_only' || selectedMode === 'exam_with_solutions') && (
              renderExamPaper(exam, examCode, selectedMode === 'exam_with_solutions')
            )}

            {/* TRƯỜNG HỢP 3: IN TRỌN BỘ CÁC MÃ ĐỀ + BẢNG MA TRẬN ĐÁP ÁN TOÀN BỘ */}
            {selectedMode === 'all_variants_with_matrix' && bundle && (
              <div className="space-y-12">
                {/* Lần lượt in từng mã đề trên từng trang riêng biệt */}
                {bundle.variants.map((v, vIdx) => (
                  <div key={v.code || vIdx} className={vIdx > 0 ? 'print-page-break pt-8 border-t-2 border-slate-300 border-dashed' : ''}>
                    {renderExamPaper(v, v.code || String(101 + vIdx), false, {
                      name: '....................................................',
                      stClass: '...............',
                      sbd: '...............'
                    })}
                  </div>
                ))}

                {/* BẢNG MA TRẬN ĐÁP ÁN TOÀN BỘ CÁC MÃ ĐỀ Ở TRANG CUỐI */}
                <div className="print-page-break pt-8 border-t-4 border-slate-900 font-sans space-y-5">
                  <div className="border-b-2 border-slate-900 pb-3 text-center">
                    <div className="text-xs uppercase font-bold text-slate-600">{schoolName}</div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 mt-1">
                      BẢNG MA TRẬN ĐÁP ÁN TOÀN BỘ CÁC MÃ ĐỀ THI
                    </h2>
                    <div className="text-xs text-slate-600 mt-1">
                      Kỳ thi: <strong>{bundle.originalExam.title}</strong> • Năm học 2025 - 2026
                    </div>
                    <div className="text-2xs text-slate-500 italic mt-0.5">
                      Bao gồm các mã đề: {bundle.variants.map((v) => `Mã ${v.code}`).join(' • ')}
                    </div>
                  </div>

                  {/* Bảng ma trận đối chiếu từng câu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-2xs uppercase font-bold">
                          <th className="border border-slate-400 p-2 text-center w-12">Câu</th>
                          <th className="border border-slate-400 p-2 w-24">Phần thi</th>
                          <th className="border border-slate-400 p-2">Chủ đề câu hỏi</th>
                          <th className="border border-slate-400 p-2 text-center w-24 bg-slate-200">Đề gốc</th>
                          {bundle.variants.map((v) => (
                            <th key={v.code} className="border border-slate-400 p-2 text-center w-24 bg-indigo-50 font-bold font-mono text-indigo-900">
                              Mã {v.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bundle.matrix.map((row) => (
                          <tr key={row.originalIndex} className="hover:bg-slate-50">
                            <td className="border border-slate-400 p-1.5 text-center font-bold">
                              {row.originalIndex}
                            </td>
                            <td className="border border-slate-400 p-1.5 text-2xs">
                              {row.part}
                            </td>
                            <td className="border border-slate-400 p-1.5 text-2xs truncate max-w-xs">
                              {row.topic}
                            </td>
                            <td className="border border-slate-400 p-1.5 text-center font-mono font-bold bg-slate-50">
                              {row.answersByCode['Gốc']}
                            </td>
                            {bundle.variants.map((v) => (
                              <td key={v.code} className="border border-slate-400 p-1.5 text-center font-mono font-bold text-xs bg-indigo-50/30">
                                {row.answersByCode[v.code || ''] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Chữ ký cán bộ làm đề */}
                  <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">TỔ TRƯỞNG CHUYÊN MÔN</div>
                      <div className="text-slate-400 italic text-2xs mt-0.5">(Ký và ghi rõ họ tên)</div>
                      <div className="h-16"></div>
                      <div className="font-medium text-slate-700">Tổ Vật lí</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">CÁN BỘ RA ĐỀ & TRỘN ĐỀ</div>
                      <div className="text-slate-400 italic text-2xs mt-0.5">(Ký và ghi rõ họ tên)</div>
                      <div className="h-16"></div>
                      <div className="font-medium text-slate-700">Ban Khảo thí THPT</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 4: IN PHIẾU BÁO ĐIỂM HỌC SINH */}
            {selectedMode === 'student_report' && evaluation && (
              <div className="space-y-6 font-sans">
                
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <div className="text-xs uppercase font-bold text-slate-600">{schoolName}</div>
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">
                    PHIẾU BÁO ĐIỂM KHẢO THÍ MÔN VẬT LÍ
                  </h1>
                  <div className="text-xs text-slate-600 mt-1">
                    Kỳ thi: <strong>{exam.title}</strong> • Năm học: 2025 - 2026
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-300">
                  <div className="sm:col-span-2 space-y-1.5 text-xs">
                    <div>Họ và tên thí sinh: <strong className="text-sm text-slate-900 font-serif">{studentName}</strong></div>
                    <div>Lớp: <strong className="font-mono">{studentClass}</strong> • SBD: <strong className="font-mono">{candidateNumber}</strong> • Mã đề: <strong className="font-mono text-indigo-700">{examCode}</strong></div>
                    <div>Thời gian nộp bài: <span>{evaluation.submittedAt}</span></div>
                    <div>Thời gian làm bài: <span>{Math.floor(evaluation.timeSpentSeconds / 60)} phút {evaluation.timeSpentSeconds % 60} giây</span></div>
                    {evaluation.auditLog && (
                      <div className="pt-1 text-[11px] text-slate-700 border-t border-slate-200 mt-1">
                        <span>Giám sát thi: </span>
                        <strong className={evaluation.auditLog.violationCount > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                          {evaluation.auditLog.violationCount > 0 
                            ? `Ghi nhận ${evaluation.auditLog.violationCount}/${evaluation.auditLog.maxAllowedViolations} lần rời màn hình (${evaluation.auditLog.submissionReason === 'violation_limit_exceeded' ? 'Bị đình chỉ / Thu bài sớm' : 'Đã cảnh báo'})`
                            : 'Không vi phạm quy chế (Tuyệt đối tuân thủ)'}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-300 text-center">
                    <span className="text-3xs uppercase tracking-wider font-bold text-slate-500">TỔNG ĐIỂM</span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-indigo-700">
                      {evaluation.totalScore.toFixed(2)}
                      <span className="text-sm font-normal text-slate-500">/{evaluation.maxScore.toFixed(2)}</span>
                    </span>
                    <span className="text-2xs font-bold text-slate-600 mt-0.5">
                      Đạt {evaluation.percentage}% tối đa
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <div className="text-3xs text-slate-500 font-bold uppercase">Phần I (Trắc nghiệm)</div>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                      {evaluation.partScores['Phần I']?.earned || 0} / {evaluation.partScores['Phần I']?.max || 0}đ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <div className="text-3xs text-slate-500 font-bold uppercase">Phần II (Đúng/Sai)</div>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                      {evaluation.partScores['Phần II']?.earned || 0} / {evaluation.partScores['Phần II']?.max || 0}đ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50">
                    <div className="text-3xs text-slate-500 font-bold uppercase">Phần III (Trả lời ngắn)</div>
                    <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                      {evaluation.partScores['Phần III']?.earned || 0} / {evaluation.partScores['Phần III']?.max || 0}đ
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase text-slate-800">
                    Bảng đối chiếu chi tiết bài làm của học sinh
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-2xs uppercase">
                        <th className="border border-slate-300 p-1.5 text-center w-10">STT</th>
                        <th className="border border-slate-300 p-1.5 w-20">Phần</th>
                        <th className="border border-slate-300 p-1.5">Nội dung câu hỏi</th>
                        <th className="border border-slate-300 p-1.5 text-center w-24">Bài làm</th>
                        <th className="border border-slate-300 p-1.5 text-center w-24">Đáp án chuẩn</th>
                        <th className="border border-slate-300 p-1.5 text-center w-20">Kết quả</th>
                        <th className="border border-slate-300 p-1.5 text-right w-16">Điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.questions.map((q, idx) => {
                        const res = evaluation.results[q.id];
                        return (
                          <tr key={q.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 p-1.5 text-center font-bold">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 text-2xs">{q.part}</td>
                            <td className="border border-slate-300 p-1.5 font-medium truncate max-w-xs">{q.title}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-2xs">
                              {res.userAnswerSummary || 'Chưa làm'}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-indigo-700 text-2xs">
                              {res.correctAnswerSummary}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-center text-2xs">
                              {res.isCorrect ? (
                                <span className="text-emerald-700 font-bold">Đúng</span>
                              ) : res.isPartiallyCorrect ? (
                                <span className="text-amber-700 font-bold">1 phần</span>
                              ) : (
                                <span className="text-rose-700">Sai</span>
                              )}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                              +{res.earnedPoints.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs">
                  <div>
                    <div className="font-bold text-slate-800">THÍ SINH</div>
                    <div className="text-slate-400 italic text-2xs mt-0.5">(Ký và ghi rõ họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-medium text-slate-700">{studentName}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">GIÁO VIÊN CHẤM THI</div>
                    <div className="text-slate-400 italic text-2xs mt-0.5">(Ký và ghi rõ họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-medium text-slate-700">Tổ bộ môn Vật lí</div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
