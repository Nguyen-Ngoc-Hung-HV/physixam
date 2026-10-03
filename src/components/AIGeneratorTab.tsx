import React, { useState, useRef } from 'react';
import { 
  Sparkles, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, RefreshCw, Plus, 
  Trash2, ChevronDown, ChevronUp, Wand2, ShieldCheck
} from 'lucide-react';
import { Exam, Question, PhysicsTopic } from '../types/exam';
import { 
  generateExamFromImage, 
  generateExamFromPrompt 
} from '../services/geminiService';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { resolveQuestionDiagram } from '../utils/diagramResolver';

interface AIGeneratorTabProps {
  currentExam: Exam;
  onAppendQuestions: (newQuestions: Question[]) => void;
  onReplaceExam: (newExam: Exam) => void;
}

export const AIGeneratorTab: React.FC<AIGeneratorTabProps> = ({
  currentExam,
  onAppendQuestions,
  onReplaceExam,
}) => {
  // Chế độ AI: Quét ảnh vs Ma trận yêu cầu
  const [aiMode, setAiMode] = useState<'scan_image' | 'prompt_matrix'>('scan_image');

  // Trạng thái Phương thức A (Quét ảnh)
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [imageNotes, setImageNotes] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trạng thái Phương thức B (Ma trận / Prompt)
  const [promptTopic, setPromptTopic] = useState<PhysicsTopic>('Dao động & Sóng cơ');
  const [promptDifficulty, setPromptDifficulty] = useState<string>('Vận dụng');
  const [promptText, setPromptText] = useState<string>(
    'Tạo 2 câu trắc nghiệm Đúng/Sai về Chu trình nhiệt động lực học và 1 câu trả lời ngắn có đồ thị P-V dạng vector SVG.'
  );

  // Trạng thái tiến trình sinh (Loading workflow)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Kết quả sinh ra để xem trước (Live Preview Box)
  const [generatedResult, setGeneratedResult] = useState<{
    examInfo?: Partial<Exam>;
    questions: Question[];
  } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<{ [id: string]: boolean }>({});

  // Xử lý tải ảnh / kéo thả
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP) hoặc tài liệu PDF.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setSelectedImage({
        file,
        previewUrl: dataUrl,
        base64,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Bắt đầu quy trình sinh bằng AI
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setLoadingStep(1);

    // Chuỗi hiệu ứng bước tiến trình
    const stepTimer1 = setTimeout(() => setLoadingStep(2), 2000);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 4500);

    try {
      let result: { examInfo?: Partial<Exam>; questions: Question[] };

      if (aiMode === 'scan_image') {
        if (!selectedImage) {
          throw new Error('Vui lòng chọn hoặc kéo thả một hình ảnh đề thi/trang sách.');
        }
        result = await generateExamFromImage(
          selectedImage.base64,
          selectedImage.mimeType,
          undefined,
          imageNotes
        );
      } else {
        if (!promptText.trim()) {
          throw new Error('Vui lòng nhập yêu cầu nội dung câu hỏi cần khởi tạo.');
        }
        result = await generateExamFromPrompt(
          promptText,
          promptTopic,
          promptDifficulty
        );
      }

      setGeneratedResult(result);
      // Mở rộng tất cả câu hỏi được tạo để xem trước
      const exp: { [id: string]: boolean } = {};
      result.questions.forEach((q) => { exp[q.id] = true; });
      setExpandedQuestions(exp);

      setSuccessMessage(`AI đã tạo thành công ${result.questions.length} câu hỏi theo chuẩn Bộ GD&ĐT!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình sinh câu hỏi bằng AI.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
    }
  };

  // Thao tác với kết quả xem trước
  const handleAppendToExam = () => {
    if (!generatedResult || generatedResult.questions.length === 0) return;
    onAppendQuestions(generatedResult.questions);
    setSuccessMessage(`Đã thêm ${generatedResult.questions.length} câu hỏi mới vào đề thi hiện tại!`);
    setGeneratedResult(null);
  };

  const handleReplaceExam = () => {
    if (!generatedResult || generatedResult.questions.length === 0) return;
    const newExam: Exam = {
      ...currentExam,
      title: generatedResult.examInfo?.title || currentExam.title,
      subtitle: generatedResult.examInfo?.subtitle || currentExam.subtitle,
      durationMinutes: generatedResult.examInfo?.durationMinutes || currentExam.durationMinutes,
      questions: generatedResult.questions,
    };
    onReplaceExam(newExam);
    setSuccessMessage(`Đã ghi đè toàn bộ đề thi mới với ${generatedResult.questions.length} câu hỏi!`);
    setGeneratedResult(null);
  };

  const handleDeleteGeneratedQuestion = (id: string) => {
    if (!generatedResult) return;
    const remaining = generatedResult.questions.filter((q) => q.id !== id);
    setGeneratedResult({
      ...generatedResult,
      questions: remaining,
    });
  };

  const applyPresetPrompt = (preset: string, topic: PhysicsTopic, diff: string) => {
    setPromptText(preset);
    setPromptTopic(topic);
    setPromptDifficulty(diff);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KHU VỰC THÔNG TIN ĐỘNG CƠ AI TÍCH HỢP */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-950 p-4 sm:p-5 rounded-2xl border border-indigo-800/40 text-white shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white">Động cơ Khảo thí Vật lí THPT (Google Gemini 3.8 Flash)</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" /> Server-side API Sẵn sàng
                </span>
              </div>
              <p className="text-2xs text-slate-300">
                Tự động chuẩn hóa công thức KaTeX ($...$), thiết kế sơ đồ vector SVG nội tuyến và phân loại 3 phần theo chuẩn Bộ GD&ĐT 2025.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHỌN PHƯƠNG THỨC NHẬP LIỆU AI */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setAiMode('scan_image')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            aiMode === 'scan_image'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          <span>Phương thức A: Quét ảnh đề thi / Trang sách</span>
        </button>

        <button
          onClick={() => setAiMode('prompt_matrix')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            aiMode === 'prompt_matrix'
              ? 'bg-white text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wand2 className="w-4 h-4 text-indigo-600" />
          <span>Phương thức B: Sinh theo Ma trận & Yêu cầu</span>
        </button>
      </div>

      {/* 3A. PHƯƠNG THỨC A: QUÉT ẢNH VÀ TRÍCH XUẤT */}
      {aiMode === 'scan_image' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>Tải lên hình ảnh đề thi hoặc trang sách bài tập</span>
            </h4>
            <span className="text-2xs text-slate-400">Định dạng hỗ trợ: PNG, JPG, JPEG, WebP</span>
          </div>

          {/* Vùng kéo thả file */}
          {!selectedImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 transition rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Kéo thả ảnh đề thi vào đây, hoặc <span className="text-indigo-600 underline">bấm để chọn tệp</span>
                </p>
                <p className="text-2xs text-slate-500">
                  AI sẽ tự động nhận diện chữ, chuyển đổi công thức toán thành KaTeX và vẽ lại đồ thị thành mã vector SVG
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            /* Khối xem trước ảnh đã chọn */
            <div className="space-y-3">
              <div className="relative max-h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2">
                <img
                  src={selectedImage.previewUrl}
                  alt="Ảnh đề thi đã chọn"
                  className="max-h-64 max-w-full object-contain rounded-lg shadow-sm"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
                  title="Xóa ảnh và chọn lại"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Yêu cầu / Ghi chú bổ sung cho AI (tùy chọn):
                </label>
                <input
                  type="text"
                  value={imageNotes}
                  onChange={(e) => setImageNotes(e.target.value)}
                  placeholder="Ví dụ: Chỉ trích xuất các câu trắc nghiệm Đúng/Sai, bỏ qua phần lý thuyết thuần túy..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3B. PHƯƠNG THỨC B: SINH THEO MA TRẬN & YÊU CẦU */}
      {aiMode === 'prompt_matrix' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Chủ đề Vật lí:</label>
              <select
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value as PhysicsTopic)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Cơ học & Động lực học">Cơ học & Động lực học</option>
                <option value="Dao động & Sóng cơ">Dao động & Sóng cơ</option>
                <option value="Điện từ học & Mạch điện xoay chiều">Điện từ học & Mạch xoay chiều</option>
                <option value="Nhiệt học & Thuyết động học">Nhiệt học & Thuyết động học</option>
                <option value="Quang học & Sóng ánh sáng">Quang học & Sóng ánh sáng</option>
                <option value="Vật lí hạt nhân & Lượng tử">Vật lí hạt nhân & Lượng tử</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Mức độ nhận thức:</label>
              <select
                value={promptDifficulty}
                onChange={(e) => setPromptDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Nhận biết">1. Nhận biết (Kiến thức cơ bản, định nghĩa)</option>
                <option value="Thông hiểu">2. Thông hiểu (Suy luận công thức cơ bản)</option>
                <option value="Vận dụng">3. Vận dụng (Tính toán có đồ thị, mạch điện)</option>
                <option value="Vận dụng cao">4. Vận dụng cao (Bài toán phức hợp, cực trị)</option>
                <option value="Ma trận hỗn hợp (Đủ 4 mức độ)">5. Ma trận hỗn hợp (Đủ 4 mức độ)</option>
              </select>
            </div>
          </div>

          {/* Các gợi ý đề tài nhanh */}
          <div className="space-y-1.5">
            <span className="text-3xs uppercase tracking-wider font-bold text-slate-400">Mẫu gợi ý nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetPrompt('Tạo 1 câu trắc nghiệm 4 lựa chọn và 1 câu Đúng/Sai về đồ thị dao động điều hòa li độ x(t) có vẽ SVG.', 'Dao động & Sóng cơ', 'Thông hiểu')}
                className="px-2.5 py-1 rounded-lg text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                + Đồ thị dao động x(t)
              </button>
              <button
                type="button"
                onClick={() => applyPresetPrompt('Tạo 1 câu trắc nghiệm Đúng/Sai về mạch điện RLC nối tiếp có sơ đồ mạch điện vector SVG và 1 câu trả lời ngắn tính công suất.', 'Điện từ học & Mạch điện xoay chiều', 'Vận dụng')}
                className="px-2.5 py-1 rounded-lg text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                + Mạch RLC có sơ đồ
              </button>
              <button
                type="button"
                onClick={() => applyPresetPrompt('Tạo 1 câu trắc nghiệm Đúng/Sai 4 ý về chu trình nhiệt động khép kín trên hệ tọa độ P-V có hình vẽ vector SVG.', 'Nhiệt học & Thuyết động học', 'Vận dụng')}
                className="px-2.5 py-1 rounded-lg text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                + Chu trình nhiệt P-V
              </button>
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">Mô tả yêu cầu cụ thể:</label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Nhập yêu cầu chi tiết (ví dụ: Tạo 2 câu phần I, 1 câu phần II có kèm đồ thị vector SVG...)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>
        </div>
      )}

      {/* THÔNG BÁO LỖI HOẶC THÀNH CÔNG */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <span className="font-bold">Lỗi: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* NÚT THỰC THI CHÍNH */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <button
          onClick={handleStartGeneration}
          disabled={isLoading}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
            isLoading
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:shadow-indigo-500/25 hover:scale-[1.01]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang xử lý với Gemini 2.5 Flash...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{aiMode === 'scan_image' ? 'Bắt đầu Quét ảnh & Trích xuất câu hỏi' : 'Khởi tạo câu hỏi theo yêu cầu'}</span>
            </>
          )}
        </button>

        <span className="text-2xs text-slate-400 hidden sm:inline">
          Tự động xuất công thức KaTeX & Đồ thị vector SVG
        </span>
      </div>

      {/* TRẠNG THÁI TIẾN TRÌNH TRỰC QUAN KHI ĐANG SINH */}
      {isLoading && (
        <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
            <div className="font-bold text-xs sm:text-sm text-indigo-900">
              {loadingStep === 1 && 'Bước 1/3: Đang kết nối mô hình Gemini 2.5 Flash & phân tích tài liệu...'}
              {loadingStep === 2 && 'Bước 2/3: Đang trích xuất công thức KaTeX & kết xuất đồ thị vector SVG...'}
              {loadingStep === 3 && 'Bước 3/3: Chuẩn hóa cấu trúc 3 phần theo chuẩn khảo thí Bộ GD&ĐT 2025...'}
            </div>
          </div>

          <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${loadingStep * 33.3}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. KHU VỰC XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW BOX) */}
      {/* ========================================================= */}
      {generatedResult && (
        <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-4 p-5 sm:p-6">
          
          {/* Thanh tiêu đề kết quả */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800">
                  Xem trước kết quả AI
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {generatedResult.examInfo?.title || 'Bộ câu hỏi Vật lí vừa được sinh'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đã tạo thành công <strong className="text-indigo-600 font-bold">{generatedResult.questions.length} câu hỏi</strong>. Bạn có thể kiểm tra công thức, sơ đồ và chọn hành động bên dưới.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleAppendToExam}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
                title="Giữ nguyên các câu hỏi cũ và thêm các câu hỏi này vào cuối đề"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm vào đề hiện tại (+{generatedResult.questions.length} câu)</span>
              </button>

              <button
                onClick={handleReplaceExam}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
                title="Thay thế toàn bộ đề thi hiện tại bằng bộ câu hỏi mới này"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ghi đè đề thi mới</span>
              </button>
            </div>
          </div>

          {/* Danh sách các câu hỏi đã sinh ra */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {generatedResult.questions.map((q, idx) => {
              const isExpanded = expandedQuestions[q.id] ?? true;
              return (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  
                  {/* Thanh thông tin câu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">Câu {idx + 1}</span>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        {q.part}
                      </span>
                      <span className="text-2xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {q.topic}
                      </span>
                      <span className="text-2xs font-bold text-slate-500">
                        ({q.points} điểm)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteGeneratedQuestion(q.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa câu này khỏi danh sách xem trước"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedQuestions((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Đề bài KaTeX */}
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    <MathRenderer content={q.stem} />
                  </div>

                  {/* Sơ đồ vector SVG nếu có */}
                  {(() => {
                    const resolved = resolveQuestionDiagram(q);
                    if (!resolved) return null;
                    return (
                      <div className="my-2 max-w-lg">
                        <DiagramViewer diagram={resolved} allowZoom={false} />
                      </div>
                    );
                  })()}

                  {/* Nội dung chi tiết phương án / nhận định */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                      {q.type === 'multiple_choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q as any).options?.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border ${
                                opt.id === (q as any).correctAnswer
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold mr-1.5">{opt.id}.</span>
                              <MathRenderer content={opt.text} inline={true} />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'true_false_cluster' && (
                        <div className="space-y-1">
                          {(q as any).items?.map((it: any) => (
                            <div key={it.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold">{it.id})</span>
                                <MathRenderer content={it.statement} inline={true} />
                              </div>
                              <span className={`px-2 py-0.5 rounded text-2xs font-bold font-mono ${
                                it.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {it.correctAnswer ? 'ĐÚNG' : 'SAI'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-600">Đáp án chính xác:</span>
                          <span className="font-mono font-bold text-sm text-indigo-700">
                            {(q as any).correctValue} {(q as any).unitHint || ''}
                          </span>
                        </div>
                      )}

                      {/* Lời giải chi tiết */}
                      {q.explanation && (
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-slate-700 space-y-1">
                          <span className="font-bold text-indigo-900 text-2xs uppercase block">Lời giải chi tiết:</span>
                          {q.explanation.keyFormula && (
                            <div className="font-mono text-2xs text-indigo-800">
                              Công thức: <MathRenderer content={`$${q.explanation.keyFormula}$`} inline={true} />
                            </div>
                          )}
                          {q.explanation.overview && (
                            <div className="text-2xs"><MathRenderer content={q.explanation.overview} /></div>
                          )}
                        </div>
                      )}
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
