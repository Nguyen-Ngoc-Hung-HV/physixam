import React, { useState } from 'react';
import { 
  SlidersHorizontal, Code, RefreshCw, CheckCircle2, 
  AlertCircle, Download, Copy, ArrowRight, BookmarkCheck
} from 'lucide-react';
import { Exam } from '../types/exam';
import { MathRenderer } from './MathRenderer';
import { sampleExamsList } from '../data/sampleExams';
import { validateAndNormalizeExamJson } from '../utils/examSchemaNormalizer';

interface TeacherEditorProps {
  currentExam: Exam;
  onUpdateExam: (newExam: Exam) => void;
  onExitToStudentMode: () => void;
  onOpenSaveToBank?: () => void;
}

export const TeacherEditor: React.FC<TeacherEditorProps> = ({
  currentExam,
  onUpdateExam,
  onExitToStudentMode,
  onOpenSaveToBank,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'json'>('editor');
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(currentExam, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<boolean>(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // Mẫu SVG đồ thị vật lí có sẵn cho giáo viên
  const SVG_TEMPLATES = [
    {
      name: 'Đồ thị sóng hình sin (u-x)',
      svg: `<svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="200" fill="#ffffff" />
  <line x1="20" y1="100" x2="480" y2="100" stroke="#334155" stroke-width="2"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#334155" stroke-width="2"/>
  <text x="470" y="90" font-family="sans-serif" font-size="12">x (m)</text>
  <text x="55" y="30" font-family="sans-serif" font-size="12">u (cm)</text>
  <path d="M 50 100 Q 100 20 150 100 T 250 100 T 350 100 T 450 100" fill="none" stroke="#2563eb" stroke-width="3"/>
  <circle cx="150" cy="100" r="4" fill="#dc2626"/>
  <text x="140" y="125" font-family="sans-serif" font-size="11" font-weight="bold">Nút sóng</text>
</svg>`
    },
    {
      name: 'Mạch điện R-L-C',
      svg: `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" fill="#ffffff" rx="8"/>
  <rect x="50" y="30" width="400" height="120" fill="none" stroke="#334155" stroke-width="2.5"/>
  <circle cx="50" cy="90" r="18" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
  <text x="43" y="95" font-family="sans-serif" font-size="14" font-weight="bold">~</text>
  <rect x="150" y="20" width="40" height="20" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
  <text x="160" y="15" font-family="sans-serif" font-size="11" font-weight="bold">R</text>
  <circle cx="270" cy="30" r="12" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
  <text x="267" y="15" font-family="sans-serif" font-size="11" font-weight="bold">L</text>
  <line x1="375" y1="15" x2="375" y2="45" stroke="#7c3aed" stroke-width="2.5"/>
  <line x1="385" y1="15" x2="385" y2="45" stroke="#7c3aed" stroke-width="2.5"/>
  <text x="375" y="10" font-family="sans-serif" font-size="11" font-weight="bold">C</text>
</svg>`
    },
    {
      name: 'Chu trình P-V (Nhiệt học)',
      svg: `<svg viewBox="0 0 450 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="220" fill="#ffffff"/>
  <line x1="50" y1="180" x2="400" y2="180" stroke="#334155" stroke-width="2"/>
  <line x1="50" y1="180" x2="50" y2="30" stroke="#334155" stroke-width="2"/>
  <text x="390" y="200" font-family="sans-serif" font-size="12">V (m³)</text>
  <text x="20" y="35" font-family="sans-serif" font-size="12">P (Pa)</text>
  <polygon points="120,60 300,120 120,120" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <text x="110" y="55" font-family="sans-serif" font-size="12" font-weight="bold">(1)</text>
  <text x="305" y="125" font-family="sans-serif" font-size="12" font-weight="bold">(2)</text>
  <text x="110" y="135" font-family="sans-serif" font-size="12" font-weight="bold">(3)</text>
</svg>`
    }
  ];

  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const { exam } = validateAndNormalizeExamJson(jsonText);
      onUpdateExam(exam);
      setJsonText(JSON.stringify(exam, null, 2));
      setSelectedQuestionIndex(0);
      setJsonSuccess(true);
      setTimeout(() => setJsonSuccess(false), 3000);
    } catch (err: any) {
      setJsonError(err.message || 'Mã nguồn JSON bị lỗi cú pháp');
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const found = sampleExamsList.find((e) => e.id === sampleId);
    if (found) {
      onUpdateExam(found);
      setJsonText(JSON.stringify(found, null, 2));
      setSelectedQuestionIndex(0);
    }
  };

  const currentQuestion = currentExam.questions[selectedQuestionIndex] || currentExam.questions[0];

  const updateCurrentQuestionField = (field: string, value: any) => {
    const updatedQuestions = [...currentExam.questions];
    updatedQuestions[selectedQuestionIndex] = {
      ...updatedQuestions[selectedQuestionIndex],
      [field]: value,
    };
    const updatedExam = { ...currentExam, questions: updatedQuestions };
    onUpdateExam(updatedExam);
    setJsonText(JSON.stringify(updatedExam, null, 2));
  };

  const updateDiagramContent = (content: string) => {
    const updatedQuestions = [...currentExam.questions];
    const q = updatedQuestions[selectedQuestionIndex];
    updatedQuestions[selectedQuestionIndex] = {
      ...q,
      diagram: {
        type: 'svg',
        content,
        caption: q.diagram?.caption || 'Hình vẽ sơ đồ',
      },
    };
    const updatedExam = { ...currentExam, questions: updatedQuestions };
    onUpdateExam(updatedExam);
    setJsonText(JSON.stringify(updatedExam, null, 2));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Banner chế độ Giáo viên */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Không gian Soạn thảo & Tạo đề thi Vật lí</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Biên soạn Đề kiểm tra & Sơ đồ Vật lí THPT</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Biên soạn công thức toán học KaTeX, thiết kế sơ đồ vector SVG tương tác trực tiếp hoặc nhập/xuất đề thi qua chuẩn JSON.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitToStudentMode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
          >
            <span>Xem lại ở giao diện Học sinh</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thanh chọn đề thi mẫu & Tab điều hướng */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Bộ chọn đề thi có sẵn */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Tải đề thi mẫu:</span>
          <select
            value={currentExam.id}
            onChange={(e) => handleLoadSample(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {sampleExamsList.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.questions.length} câu)
              </option>
            ))}
          </select>
        </div>

        {/* Tab chuyển đổi chế độ soạn thảo */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'editor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Soạn thảo trực quan & Sơ đồ</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'json' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chỉnh sửa mã nguồn JSON</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SOẠN THẢO TRỰC QUAN */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Cột trái: Danh sách câu hỏi */}
          <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              <span>Danh sách câu hỏi</span>
              <span>{currentExam.questions.length} câu</span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {currentExam.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                    selectedQuestionIndex === idx
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Câu {idx + 1} • {q.part === 'Phần I' ? 'Phần I: Trắc nghiệm 4 lựa chọn' : q.part === 'Phần II' ? 'Phần II: Đúng/Sai' : 'Phần III: Trả lời ngắn'}</span>
                    <span className="text-3xs px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                      {q.type === 'multiple_choice' ? 'Trắc nghiệm 4 lựa chọn' : q.type === 'true_false_cluster' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                    </span>
                  </div>
                  <div className="truncate text-slate-500">{q.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cột phải: Form biên soạn & xem trước */}
          <div className="lg:col-span-9 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    Đang chỉnh sửa Câu {selectedQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{currentQuestion.id}</span>
                </div>
                <span className="text-xs text-slate-400">Tự động cập nhật thay đổi</span>
              </div>

              {/* Tiêu đề câu và chủ đề */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Tiêu đề câu hỏi:</label>
                  <input
                    type="text"
                    value={currentQuestion.title}
                    onChange={(e) => updateCurrentQuestionField('title', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Chủ đề Vật lí:</label>
                  <input
                    type="text"
                    value={currentQuestion.topic}
                    onChange={(e) => updateCurrentQuestionField('topic', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Đề bài câu hỏi với KaTeX */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">
                    Nội dung đề bài & Công thức (KaTeX $inline$ hoặc $$display$$):
                  </label>
                  <span className="text-3xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                    Hỗ trợ KaTeX
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={currentQuestion.stem}
                  onChange={(e) => updateCurrentQuestionField('stem', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />

                {/* Hộp xem trước trực tiếp công thức */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="text-2xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Xem trước công thức KaTeX trực tiếp:
                  </div>
                  <div className="text-sm text-slate-800">
                    <MathRenderer content={currentQuestion.stem} />
                  </div>
                </div>
              </div>

              {/* Soạn thảo & Xem trước mã nguồn SVG */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>Mã nguồn SVG đồ thị vector</span>
                  </label>

                  {/* Chèn mẫu SVG nhanh */}
                  <div className="flex items-center gap-1 text-2xs">
                    <span className="text-slate-400">Chèn mẫu nhanh:</span>
                    {SVG_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.name}
                        onClick={() => updateDiagramContent(tmpl.svg)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition cursor-pointer"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      rows={8}
                      value={currentQuestion.diagram?.content || ''}
                      onChange={(e) => updateDiagramContent(e.target.value)}
                      placeholder="<svg viewBox='0 0 500 200' ...>...</svg>"
                      className="w-full p-2.5 text-xs font-mono bg-slate-900 text-sky-300 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 overflow-x-auto"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center min-h-[160px]">
                    <span className="text-2xs font-bold text-slate-400 uppercase mb-2">Xem trước sơ đồ trực tiếp</span>
                    {currentQuestion.diagram?.content ? (
                      <div
                        className="w-full max-w-[340px] flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.diagram.content }}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Không có sơ đồ gắn kèm</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chi tiết đáp án theo từng dạng câu hỏi */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cấu hình đáp án & Nhận định ({currentQuestion.part})
                  </span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {currentQuestion.type === 'multiple_choice' ? 'Trắc nghiệm 4 lựa chọn' : currentQuestion.type === 'true_false_cluster' ? 'Trắc nghiệm Đúng/Sai' : 'Trả lời ngắn'}
                  </span>
                </div>

                {/* Phần I: Phương án A, B, C, D */}
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">Chọn phương án đúng và chỉnh sửa nội dung:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(currentQuestion as any).options?.map((opt: any, optIdx: number) => {
                        const isCorrect = (currentQuestion as any).correctAnswer === opt.id;
                        return (
                          <div 
                            key={opt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {opt.id}
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => {
                                  const updatedOpts = [...(currentQuestion as any).options];
                                  updatedOpts[optIdx] = { ...opt, text: e.target.value };
                                  updateCurrentQuestionField('options', updatedOpts);
                                }}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => updateCurrentQuestionField('correctAnswer', opt.id)}
                              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition shrink-0 cursor-pointer ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              }`}
                            >
                              {isCorrect ? '✓ ĐÚNG' : 'Chọn đúng'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phần II: Đúng / Sai 4 nhận định a, b, c, d */}
                {currentQuestion.type === 'true_false_cluster' && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">Đánh dấu chính xác trạng thái ĐÚNG hoặc SAI cho từng nhận định:</div>
                    <div className="space-y-2">
                      {(currentQuestion as any).items?.map((item: any, itIdx: number) => {
                        const isTrue = item.correctAnswer === true;
                        return (
                          <div 
                            key={item.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isTrue ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                {item.id}
                              </span>
                              <input
                                type="text"
                                value={item.statement}
                                onChange={(e) => {
                                  const updatedItems = [...(currentQuestion as any).items];
                                  updatedItems[itIdx] = { ...item, statement: e.target.value };
                                  updateCurrentQuestionField('items', updatedItems);
                                }}
                                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = [...(currentQuestion as any).items];
                                  updatedItems[itIdx] = { ...item, correctAnswer: true };
                                  updateCurrentQuestionField('items', updatedItems);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isTrue ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                ĐÚNG
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = [...(currentQuestion as any).items];
                                  updatedItems[itIdx] = { ...item, correctAnswer: false };
                                  updateCurrentQuestionField('items', updatedItems);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  !isTrue ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                SAI
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Phần III: Trả lời ngắn */}
                {currentQuestion.type === 'short_answer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900">Giá trị số đáp án:</label>
                      <input
                        type="text"
                        value={(currentQuestion as any).correctValue}
                        onChange={(e) => updateCurrentQuestionField('correctValue', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900">Gợi ý đơn vị đo:</label>
                      <input
                        type="text"
                        value={(currentQuestion as any).unitHint || ''}
                        onChange={(e) => updateCurrentQuestionField('unitHint', e.target.value)}
                        placeholder="ví dụ: J hoặc m/s"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lời giải chi tiết */}
              {currentQuestion.explanation && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700">
                    Lời giải chi tiết & Công thức KaTeX then chốt:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Công thức then chốt (ví dụ: \lambda = v / f)"
                      value={currentQuestion.explanation.keyFormula || ''}
                      onChange={(e) => {
                        const updated = { ...currentQuestion.explanation, keyFormula: e.target.value };
                        updateCurrentQuestionField('explanation', updated);
                      }}
                      className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Tóm tắt tổng quan..."
                      value={currentQuestion.explanation.overview || ''}
                      onChange={(e) => {
                        const updated = { ...currentQuestion.explanation, overview: e.target.value };
                        updateCurrentQuestionField('explanation', updated);
                      }}
                      className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* TAB 2: CHỈNH SỬA MÃ NGUỒN JSON */}
      {activeTab === 'json' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Mã nguồn cấu trúc đề thi (JSON)</h2>
              <p className="text-xs text-slate-500">
                Dán trực tiếp cấu trúc đề thi từ file ngoài, xuất file JSON hoặc lưu trữ bản thảo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonText);
                  alert('Đã sao chép mã nguồn đề thi JSON vào bộ nhớ đệm!');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép JSON</span>
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([jsonText], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `de-thi-vat-li-${currentExam.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất tệp JSON</span>
              </button>

              {onOpenSaveToBank && (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyJson();
                    onOpenSaveToBank();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer"
                  title="Lưu cấu trúc đề thi này vào Ngân hàng đề thi GDPT 2018"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>💾 Lưu vào Ngân hàng đề</span>
                </button>
              )}

              <button
                onClick={handleApplyJson}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white shadow-2xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kiểm tra cú pháp & Áp dụng JSON</span>
              </button>
            </div>
          </div>

          {/* Thông báo kết quả kiểm tra JSON */}
          {jsonError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Lỗi định dạng JSON: {jsonError}</span>
            </div>
          )}

          {jsonSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cấu trúc đề thi đã được kiểm tra hợp lệ và áp dụng thành công!</span>
            </div>
          )}

          <textarea
            rows={22}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed overflow-x-auto"
          />
        </div>
      )}

    </div>
  );
};
