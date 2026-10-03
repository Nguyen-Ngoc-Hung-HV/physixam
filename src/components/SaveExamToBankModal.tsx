import React, { useState, useMemo } from 'react';
import { 
  X, BookmarkCheck, CheckCircle2, Sparkles, BookOpen, 
  FolderTree, Layers, Clock, Hash, Tag, FileText, Check, AlertCircle 
} from 'lucide-react';
import { Exam, DiagramData } from '../types/exam';
import { 
  ExamPackage, GradeLevel, ExamCategory, CurriculumChapter, CurriculumLesson 
} from '../types/curriculum';
import { CURRICULUM_CHAPTERS } from '../data/curriculumData';
import { resolveQuestionDiagram } from '../utils/diagramResolver';

interface SaveExamToBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExam: Exam;
  onSaveExamToBank: (newPkg: ExamPackage) => void;
  existingPackage?: ExamPackage | null;
}

const CATEGORY_OPTIONS: { id: ExamCategory; label: string; badge: string }[] = [
  { id: 'lesson', label: 'Luyện tập theo Bài', badge: 'Bài học' },
  { id: 'chapter', label: 'Đánh giá theo Chương', badge: 'Chương' },
  { id: 'midterm1', label: 'Kiểm tra Giữa Học kỳ I (GHK1)', badge: 'GHK1' },
  { id: 'final1', label: 'Kiểm tra Cuối Học kỳ I (CHK1)', badge: 'CHK1' },
  { id: 'midterm2', label: 'Kiểm tra Giữa Học kỳ II (GHK2)', badge: 'GHK2' },
  { id: 'final2', label: 'Kiểm tra Cuối Học kỳ II (CHK2)', badge: 'CHK2' },
  { id: 'survey', label: 'Khảo sát / Thi thử Tốt nghiệp THPT', badge: 'Thi thử' },
];

export const SaveExamToBankModal: React.FC<SaveExamToBankModalProps> = ({
  isOpen,
  onClose,
  currentExam,
  onSaveExamToBank,
  existingPackage,
}) => {
  if (!isOpen) return null;

  // Khởi tạo khối lớp ban đầu
  const initialGrade: GradeLevel = useMemo(() => {
    if (existingPackage?.grade) return existingPackage.grade;
    const lower = (currentExam.gradeLevel + ' ' + currentExam.title + ' ' + currentExam.subtitle).toLowerCase();
    if (lower.includes('10') || lower.includes('lớp 10')) return 10;
    if (lower.includes('11') || lower.includes('lớp 11')) return 11;
    return 12;
  }, [currentExam, existingPackage]);

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(initialGrade);
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory>(
    existingPackage?.category || 'chapter'
  );

  // Tên đề thi
  const [examTitle, setExamTitle] = useState<string>(() => {
    if (existingPackage?.title) return existingPackage.title;
    return currentExam.title || 'Đề kiểm tra môn Vật lí THPT (GDPT 2018)';
  });

  // Mã đề thi
  const [examCode, setExamCode] = useState<string>(() => {
    if (existingPackage?.code) return existingPackage.code;
    return currentExam.code || `${selectedGrade}01`;
  });

  // Thời gian làm bài (phút)
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    return existingPackage?.durationMinutes || currentExam.durationMinutes || 45;
  });

  // Mức độ nhận thức
  const [difficulty, setDifficulty] = useState<'Cơ bản' | 'Thông hiểu' | 'Vận dụng' | 'Chuẩn Bộ GD&ĐT'>(
    existingPackage?.difficulty || 'Chuẩn Bộ GD&ĐT'
  );

  // Ghi chú của giáo viên / phụ đề
  const [teacherNote, setTeacherNote] = useState<string>(() => {
    if (existingPackage?.subtitle) return existingPackage.subtitle;
    return currentExam.subtitle || '';
  });

  // Danh sách các chương của khối lớp đang chọn
  const chaptersForGrade = useMemo(() => {
    return CURRICULUM_CHAPTERS.filter((c) => c.grade === selectedGrade);
  }, [selectedGrade]);

  // Chương được chọn
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    if (existingPackage && existingPackage.grade === selectedGrade) {
      return existingPackage.chapterId;
    }
    return chaptersForGrade[0]?.id || '12-c1';
  });

  // Cập nhật selectedChapterId nếu khối lớp thay đổi và chương hiện tại không thuộc khối đó
  const activeChapter = useMemo(() => {
    const found = chaptersForGrade.find((c) => c.id === selectedChapterId);
    return found || chaptersForGrade[0] || null;
  }, [chaptersForGrade, selectedChapterId]);

  // Danh sách bài học của chương đang chọn
  const lessonsForChapter = useMemo(() => {
    return activeChapter ? activeChapter.lessons : [];
  }, [activeChapter]);

  // Bài học được chọn (nếu có)
  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    if (existingPackage && existingPackage.lessonId) return existingPackage.lessonId;
    return '';
  });

  // Thống kê câu hỏi & tài nguyên của đề thi hiện tại
  const examStats = useMemo(() => {
    const questions = currentExam.questions || [];
    const p1Count = questions.filter((q) => q.part === 'Phần I').length;
    const p2Count = questions.filter((q) => q.part === 'Phần II').length;
    const p3Count = questions.filter((q) => q.part === 'Phần III').length;
    
    let svgCount = 0;
    let imageCount = 0;
    let katexCount = 0;

    questions.forEach((q) => {
      const diag = resolveQuestionDiagram(q);
      if (diag?.type === 'svg') svgCount++;
      else if (diag?.type === 'image') imageCount++;

      if (q.stem && q.stem.includes('$')) katexCount++;
    });

    return {
      total: questions.length,
      p1Count,
      p2Count,
      p3Count,
      svgCount,
      imageCount,
      katexCount,
    };
  }, [currentExam]);

  // Xử lý xác nhận lưu đề vào Ngân hàng đề thi
  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!examTitle.trim()) {
      alert('Vui lòng nhập tiêu đề cho đề thi!');
      return;
    }

    if (!activeChapter) {
      alert('Vui lòng chọn một chương kiến thức thuộc chương trình GDPT 2018!');
      return;
    }

    const selectedLesson = lessonsForChapter.find((l) => l.id === selectedLessonId) || null;
    const catObj = CATEGORY_OPTIONS.find((c) => c.id === selectedCategory);
    const categoryLabel = catObj?.label || 'Luyện tập theo Bài';

    // Đóng gói toàn bộ câu hỏi và đảm bảo diagram/sơ đồ được bảo toàn
    const packagedQuestions = currentExam.questions.map((q) => {
      const resolved = resolveQuestionDiagram(q);
      if (resolved && !q.diagram) {
        return {
          ...q,
          diagram: resolved,
        };
      }
      return q;
    });

    const packagedExamData: Exam = {
      ...currentExam,
      title: examTitle.trim(),
      subtitle: teacherNote.trim() || `${activeChapter.chapterNumber}: ${activeChapter.title}`,
      code: examCode.trim() || `${selectedGrade}01`,
      gradeLevel: `Lớp ${selectedGrade} (Chương trình GDPT 2018)`,
      durationMinutes: Number(durationMinutes) || 45,
      questions: packagedQuestions,
    };

    const newPackage: ExamPackage = {
      id: existingPackage?.id || `pkg-${Date.now()}`,
      grade: selectedGrade,
      category: selectedCategory,
      categoryLabel,
      chapterId: activeChapter.id,
      chapterTitle: `${activeChapter.chapterNumber}: ${activeChapter.title}`,
      lessonId: selectedLesson?.id,
      lessonTitle: selectedLesson?.title,
      code: examCode.trim() || `${selectedGrade}01`,
      title: examTitle.trim(),
      subtitle: teacherNote.trim() || `${activeChapter.title} • Thời gian: ${durationMinutes} phút`,
      durationMinutes: Number(durationMinutes) || 45,
      totalPoints: currentExam.totalPoints || 10,
      difficulty,
      tags: [
        `Khối ${selectedGrade}`,
        catObj?.badge || '',
        activeChapter.title,
        ...(selectedLesson ? [selectedLesson.title] : []),
      ].filter(Boolean),
      svgCount: examStats.svgCount,
      katexCount: examStats.katexCount,
      examData: packagedExamData,
      createdAt: existingPackage?.createdAt || new Date().toISOString().slice(0, 10),
    };

    onSaveExamToBank(newPackage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BookmarkCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Lưu trữ lâu dài
                </span>
                <span className="text-2xs text-slate-300">
                  Khảo thí GDPT 2018
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Lưu Đề Thi Vào Ngân Hàng Dữ Liệu
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Đóng gói cấu trúc đề thi, công thức KaTeX và đồ thị vector SVG vào Ngân hàng đề thi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung form */}
        <form onSubmit={handleConfirmSave} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Tiêu đề đề thi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Tên đề thi hiển thị: *</span>
              <span className="text-3xs text-slate-400 font-normal">Sẽ hiển thị trên thẻ ngân hàng và phiếu in</span>
            </label>
            <input
              type="text"
              required
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="ví dụ: Đề ôn tập: Bài 5. Nhiệt nóng chảy riêng"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {/* 2. Chọn Khối lớp (Khối 10 | Khối 11 | Khối 12) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Khối lớp theo Chương trình GDPT 2018: *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 11, 12].map((g) => {
                const isSelected = selectedGrade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(g as GradeLevel);
                      // Tự động gán chương đầu tiên của khối đó
                      const chaps = CURRICULUM_CHAPTERS.filter((c) => c.grade === g);
                      if (chaps[0]) {
                        setSelectedChapterId(chaps[0].id);
                        setSelectedLessonId('');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                      isSelected
                        ? g === 12
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : g === 11
                          ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                          : 'bg-teal-600 border-teal-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>Khối {g}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Phân loại đề thi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Phân loại kỳ thi / Mốc đánh giá: *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cat.badge}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-xs font-bold mt-1 line-clamp-1">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ánh xạ Chương & Bài học trong Cây Chương trình GDPT 2018 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="space-y-1">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
                Chương kiến thức (Khối {selectedGrade}):
              </label>
              <select
                value={activeChapter?.id || ''}
                onChange={(e) => {
                  setSelectedChapterId(e.target.value);
                  setSelectedLessonId('');
                }}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 font-semibold focus:border-indigo-500 outline-none"
              >
                {chaptersForGrade.map((chap) => (
                  <option key={chap.id} value={chap.id}>
                    {chap.chapterNumber}: {chap.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-600 block">
                Bài học cụ thể (tùy chọn):
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 font-semibold focus:border-indigo-500 outline-none"
              >
                <option value="">-- Đánh giá toàn chương / Không chọn bài --</option>
                {lessonsForChapter.map((les) => (
                  <option key={les.id} value={les.id}>
                    {les.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Mã đề thi, Thời gian & Mức độ nhận thức */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Mã đề thi (Gốc):
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="ví dụ: 101"
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono font-bold bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Thời lượng làm bài:
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 focus:border-indigo-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-slate-400 font-semibold">phút</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Mức độ yêu cầu:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 text-slate-800 font-semibold focus:border-indigo-500 outline-none"
              >
                <option value="Cơ bản">Cơ bản</option>
                <option value="Thông hiểu">Thông hiểu</option>
                <option value="Vận dụng">Vận dụng</option>
                <option value="Chuẩn Bộ GD&ĐT">Chuẩn Bộ GD&ĐT</option>
              </select>
            </div>
          </div>

          {/* 6. Ghi chú của giáo viên */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Ghi chú đề thi / Mô tả phụ:
            </label>
            <input
              type="text"
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="ví dụ: Đề thi khảo sát chất lượng định kì, ma trận 4 mức độ nhận thức..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* 7. Bảng tóm tắt tài nguyên sẽ được bảo toàn */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Nội dung đề thi được bảo toàn nguyên vẹn:</span>
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800">
                {examStats.total} câu hỏi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-2xs">
              <div className="p-2 rounded-xl bg-white border border-indigo-100 flex flex-col items-center text-center">
                <span className="text-slate-500 font-semibold">Cấu trúc Bộ GD&ĐT</span>
                <span className="font-bold text-slate-800 mt-0.5">
                  {examStats.p1Count} TN • {examStats.p2Count} Đ/S • {examStats.p3Count} TLN
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-indigo-100 flex flex-col items-center text-center">
                <span className="text-slate-500 font-semibold">Công thức KaTeX</span>
                <span className="font-bold text-indigo-700 mt-0.5">
                  ∑ {examStats.katexCount} công thức toán
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-indigo-100 flex flex-col items-center text-center">
                <span className="text-slate-500 font-semibold">Sơ đồ / Đồ thị</span>
                <span className="font-bold text-amber-600 mt-0.5">
                  ⚡ {examStats.svgCount + examStats.imageCount} hình vẽ vector
                </span>
              </div>
            </div>

            <p className="text-3xs text-indigo-700/80 italic">
              ✓ Toàn bộ mã SVG vector, ảnh Base64, đáp án và lời giải chi tiết sẽ được ghi trực tiếp vào Ngân hàng dữ liệu cục bộ (localStorage: <code className="font-mono bg-indigo-100 px-1 rounded">physixam_bank_data</code>).
            </p>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4 text-amber-300" />
              <span>💾 Xác nhận Lưu đề</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
