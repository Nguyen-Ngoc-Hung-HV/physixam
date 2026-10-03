import React, { useState } from 'react';
import { 
  X, Upload, FileText, CheckCircle2, AlertCircle, 
  Sparkles, Code, Check, RotateCcw, Loader2
} from 'lucide-react';
import { ExamPackage, CurriculumChapter, CurriculumLesson, GradeLevel } from '../types/curriculum';
import { Exam } from '../types/exam';
import { parseWordPhysicsExam } from '../utils/wordExamParser';
import { validateAndNormalizeExamJson } from '../utils/examSchemaNormalizer';

interface UploadLessonExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetGrade: GradeLevel;
  targetChapter: CurriculumChapter | null;
  targetLesson: CurriculumLesson | null;
  onSavePackage: (newPackage: ExamPackage) => void;
}

export const UploadLessonExamModal: React.FC<UploadLessonExamModalProps> = ({
  isOpen,
  onClose,
  targetGrade,
  targetChapter,
  targetLesson,
  onSavePackage,
}) => {
  if (!isOpen) return null;

  const [examTitle, setExamTitle] = useState<string>(() => {
    if (targetLesson) return `Đề luyện tập: ${targetLesson.title}`;
    if (targetChapter) return `Đề đánh giá: ${targetChapter.title}`;
    return `Đề kiểm tra Vật lí ${targetGrade}`;
  });

  const [examCode, setExamCode] = useState<string>(() => {
    return `${targetGrade}${Math.floor(10 + Math.random() * 90)}`;
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(45);

  const sampleJsonTemplate: Exam = {
    id: `exam-${Date.now()}`,
    code: examCode,
    title: examTitle,
    subtitle: `Chương trình GDPT 2018 - Lớp ${targetGrade} • ${targetChapter?.title || ''}`,
    gradeLevel: `Lớp ${targetGrade} (Chương trình GDPT 2018)`,
    durationMinutes: durationMinutes,
    totalPoints: 10,
    instructions: [
      'Phần I: Câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D). Mỗi câu đúng 0,25đ.',
      'Phần II: Câu trắc nghiệm Đúng/Sai lũy tiến. Mỗi câu 4 ý a, b, c, d.',
      'Phần III: Câu hỏi trả lời ngắn điền số nguyên hoặc số thập phân.'
    ],
    questions: [
      {
        id: `q-${Date.now()}-1`,
        type: 'multiple_choice',
        part: 'Phần I',
        topic: 'Nhiệt học & Thuyết động học',
        title: 'Câu 1: Câu hỏi trắc nghiệm minh họa',
        points: 0.25,
        stem: 'Nội dung câu hỏi trắc nghiệm có kèm công thức toán: $x = A\\cos(\\omega t + \\varphi)$.',
        options: [
          { id: 'A', text: 'Phương án A đúng' },
          { id: 'B', text: 'Phương án B' },
          { id: 'C', text: 'Phương án C' },
          { id: 'D', text: 'Phương án D' }
        ],
        correctAnswer: 'A',
        explanation: {
          overview: 'Hướng dẫn giải chi tiết cho câu hỏi.',
          stepByStep: ['Bước 1: Áp dụng công thức cơ bản.', 'Bước 2: Chọn phương án A.']
        }
      }
    ]
  };

  const [jsonText, setJsonText] = useState<string>(JSON.stringify(sampleJsonTemplate, null, 2));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isProcessingWord, setIsProcessingWord] = useState<boolean>(false);
  const [wordProgressText, setWordProgressText] = useState<string>('');

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingWord(true);
      setErrorMessage(null);
      setSuccessInfo(null);
      setWordProgressText('Đang đọc tệp Word...');

      const result = await parseWordPhysicsExam(file, (step) => {
        setWordProgressText(step);
      });

      setJsonText(JSON.stringify(result.exam, null, 2));
      if (result.exam.title) setExamTitle(result.exam.title);
      if (result.exam.code) setExamCode(result.exam.code);
      if (result.exam.durationMinutes) setDurationMinutes(result.exam.durationMinutes);
      
      setSuccessInfo(`Đã trích xuất thành công ${result.summary.totalQuestions} câu hỏi (P.I: ${result.summary.part1Count}, P.II: ${result.summary.part2Count}, P.III: ${result.summary.part3Count}) từ tệp Word "${file.name}"!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi trích xuất dữ liệu từ tệp Word.');
    } finally {
      setIsProcessingWord(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { exam, summary } = validateAndNormalizeExamJson(content);
        setJsonText(JSON.stringify(exam, null, 2));
        if (exam.title) setExamTitle(exam.title);
        if (exam.code) setExamCode(exam.code);
        if (exam.durationMinutes) setDurationMinutes(exam.durationMinutes);
        setErrorMessage(null);
        setSuccessInfo(`Đã đọc và nhận diện thành công tệp "${file.name}"! (${summary.totalQuestions} câu hỏi)`);
      } catch (err: any) {
        setErrorMessage(`Tệp JSON không hợp lệ: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyTemplate = () => {
    setJsonText(JSON.stringify(sampleJsonTemplate, null, 2));
    setErrorMessage(null);
    setSuccessInfo('Đã nạp mẫu đề thi chuẩn định dạng!');
  };

  const handleSave = () => {
    try {
      setErrorMessage(null);
      const { exam } = validateAndNormalizeExamJson(jsonText);

      exam.id = exam.id || `exam-${Date.now()}`;
      exam.code = examCode || exam.code || `${targetGrade}01`;
      exam.title = examTitle || exam.title;
      exam.gradeLevel = `Lớp ${targetGrade} (Chương trình GDPT 2018)`;
      exam.durationMinutes = durationMinutes || exam.durationMinutes || 45;

      const svgCount = exam.questions.filter((q) => q.diagram && q.diagram.type === 'svg').length;
      const katexCount = exam.questions.filter((q) => q.stem && q.stem.includes('$')).length;

      const newPackage: ExamPackage = {
        id: `pkg-${Date.now()}`,
        grade: targetGrade,
        category: targetLesson ? 'lesson' : 'chapter',
        categoryLabel: targetLesson ? 'Luyện tập theo Bài' : 'Đánh giá theo Chương',
        chapterId: targetChapter?.id || `${targetGrade}-c1`,
        chapterTitle: targetChapter?.title || 'Chương tổng hợp',
        lessonId: targetLesson?.id,
        lessonTitle: targetLesson?.title,
        code: exam.code,
        title: exam.title,
        subtitle: exam.subtitle || `Lớp ${targetGrade} • ${targetChapter?.title || ''}`,
        durationMinutes: exam.durationMinutes,
        totalPoints: exam.totalPoints || 10,
        difficulty: 'Chuẩn Bộ GD&ĐT',
        tags: [
          `Lớp ${targetGrade}`,
          targetChapter ? targetChapter.chapterNumber : '',
          targetLesson ? `Bài ${targetLesson.lessonNumber}` : 'Chuyên đề',
          svgCount > 0 ? 'SVG' : ''
        ].filter(Boolean),
        svgCount,
        katexCount,
        examData: exam,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      onSavePackage(newPackage);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi phân tích cú pháp JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Tải lên đề thi mới cho bài học
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/30 text-emerald-200">
              Khối {targetGrade}
            </span>
          </div>

          <h3 className="text-lg font-black text-white">
            {targetLesson ? targetLesson.title : targetChapter ? targetChapter.title : `Chương trình Vật lí ${targetGrade}`}
          </h3>

          <p className="text-xs text-slate-300 mt-1">
            Gắn đề thi trực tiếp vào cây thư mục phân phối chương trình GDPT 2018
          </p>
        </div>

        {/* Nội dung */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Tên gói đề thi:</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mã đề:</label>
              <input
                type="text"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 font-mono font-bold focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Công cụ import file hoặc dùng template */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                <span>📄 Tải tệp Word (.docx / .doc)</span>
                <input
                  type="file"
                  accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleWordUpload}
                  className="hidden"
                />
              </label>

              <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn tệp .json</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleApplyTemplate}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Nạp mẫu chuẩn</span>
              </button>
            </div>

            <span className="text-3xs text-slate-500">
              Định dạng chuẩn 3 phần theo Bộ GD&ĐT
            </span>
          </div>

          {/* Tiến trình đọc Word nếu có */}
          {isProcessingWord && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />
              <span>{wordProgressText || 'Đang xử lý tệp Word...'}</span>
            </div>
          )}

          {/* Báo lỗi / thành công */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Ô nhập mã JSON */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Nội dung cấu trúc đề thi (JSON):</span>
              <span className="text-3xs text-slate-400 font-normal">Hỗ trợ KaTeX, đồ thị SVG, barem điểm</span>
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setErrorMessage(null);
              }}
              rows={12}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-2xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Dán mã JSON đề thi vào đây..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu vào Ngân hàng bài học</span>
          </button>
        </div>

      </div>
    </div>
  );
};
