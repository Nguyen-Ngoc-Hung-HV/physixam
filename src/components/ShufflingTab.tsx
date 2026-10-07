import React, { useState, useEffect } from 'react';
import { 
  Shuffle, CheckCircle2, Download, Printer, Copy, 
  Layers, Sparkles, FileText, Check, AlertCircle, Eye, 
  ChevronRight, RefreshCw, Table, Package, Archive,
  FileSpreadsheet, Loader2, FileDown
} from 'lucide-react';
import { Exam, ShufflingOptions, ExamVariantBundle } from '../types/exam';
import { 
  generateExamBundle, exportBundleToJson, 
  exportAnswerMatrixToCSV, getSavedBundle 
} from '../utils/shuffler';
import { 
  exportComprehensiveExamZipPackage, generateWordExamCodeDocx 
} from '../utils/docxExportService';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';

interface ShufflingTabProps {
  currentExam: Exam;
  onApplyBundle: (bundle: ExamVariantBundle) => void;
  onOpenPrintMatrix?: (bundle: ExamVariantBundle) => void;
}

// HÀM TẢI XUỐNG AN TOÀN TUYỆT ĐỐI CHO SAFARI MACOS / IOS VÀ MỌI TRÌNH DUYỆT
function safeDownloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  
  // Kích hoạt click chuẩn cho Safari WebKit
  const evt = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  });
  link.dispatchEvent(evt);

  // Trì hoãn dọn dẹp URL để Safari hoàn thành tải stream
  setTimeout(() => {
    try {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // bỏ qua lỗi nếu DOM đã dọn dẹp
    }
  }, 10000);
}

export const ShufflingTab: React.FC<ShufflingTabProps> = ({
  currentExam,
  onApplyBundle,
  onOpenPrintMatrix,
}) => {
  // Cấu hình trộn đề
  const [numberOfVariants, setNumberOfVariants] = useState<number>(4);
  const [startingCode, setStartingCode] = useState<number>(101);
  const [shuffleQuestionsWithinParts, setShuffleQuestionsWithinParts] = useState<boolean>(true);
  const [shuffleOptionsPart1, setShuffleOptionsPart1] = useState<boolean>(true);
  const [shuffleStatementsPart2, setShuffleStatementsPart2] = useState<boolean>(true);

  // Bộ mã đề hiện tại (tạo mới hoặc lấy từ storage)
  const [bundle, setBundle] = useState<ExamVariantBundle | null>(null);
  const [selectedPreviewCode, setSelectedPreviewCode] = useState<string>('matrix');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Trạng thái xuất gói ZIP trọn bộ đề thi & chấm thi
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipStepText, setZipStepText] = useState<string>('');
  const [zipPercent, setZipPercent] = useState<number>(0);
  const [downloadingWordCode, setDownloadingWordCode] = useState<string | null>(null);

  // Đọc từ storage khi mở
  useEffect(() => {
    const saved = getSavedBundle();
    if (saved && saved.originalExamId === currentExam.id) {
      setBundle(saved);
    }
  }, [currentExam.id]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Kích hoạt sinh bộ mã đề
  const handleGenerateCodes = () => {
    const options: ShufflingOptions = {
      numberOfVariants,
      startingCode,
      shuffleQuestionsWithinParts,
      shuffleOptionsPart1,
      shuffleStatementsPart2,
    };

    const newBundle = generateExamBundle(currentExam, options);
    setBundle(newBundle);
    setSelectedPreviewCode('matrix');
    showNotification(`Đã tạo thành công ${newBundle.variants.length} mã đề thi chuẩn (${newBundle.variants.map((v) => v.code).join(', ')})!`);
  };

  // Áp dụng bộ mã đề cho giao diện làm bài của học sinh
  const handleApplyToStudentApp = () => {
    if (!bundle) return;
    onApplyBundle(bundle);
    showNotification('Đã kích hoạt bộ mã đề! Học sinh giờ đây có thể chọn bất kỳ mã đề nào trên thanh điều hướng.');
  };

  // TẢI TRỌN BỘ ĐỀ THI & CHẤM THI (.ZIP) - KHẮC PHỤC TRIỆT ĐỂ LỖI SAFARI
  const handleExportZip = async () => {
    if (!bundle) return;
    setIsExportingZip(true);
    setZipPercent(5);
    setZipStepText('Đang khởi tạo gói nén đề thi...');
    try {
      await exportComprehensiveExamZipPackage(bundle, (stepText, percent) => {
        setZipStepText(stepText);
        setZipPercent(percent);
      });
      showNotification('Đã tải xuống thành công Trọn Bộ Đề Thi & Chấm Thi (.ZIP)!');
    } catch (err) {
      console.error('Lỗi đóng gói ZIP:', err);
      showNotification('Có lỗi xảy ra khi tạo tệp ZIP. Vui lòng kiểm tra lại!');
    } finally {
      setTimeout(() => {
        setIsExportingZip(false);
      }, 700);
    }
  };

  // Tải riêng lẻ 1 tệp Word của một mã đề - KHẮC PHỤC SAFARI BLOB
  const handleDownloadSingleWord = async (v: Exam) => {
    try {
      const codeStr = v.code || '101';
      setDownloadingWordCode(codeStr);
      const blob = await generateWordExamCodeDocx(v, codeStr);
      safeDownloadBlob(blob, `De_Kiem_Tra_Ma_${codeStr}.docx`);
      showNotification(`Đã tải xuống thành công tệp Word đề thi Mã ${codeStr}!`);
    } catch (err) {
      console.error('Lỗi tạo file Word:', err);
      showNotification('Không thể tạo file Word. Vui lòng thử lại!');
    } finally {
      setDownloadingWordCode(null);
    }
  };

  const previewVariant = bundle?.variants.find((v) => v.code === selectedPreviewCode);

  return (
    <div className="space-y-6">
      
      {/* 1. KHUNG ĐIỀU KHIỂN THAM SỐ TRỘN ĐỀ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Cấu hình Trộn Đề & Sinh Mã Đề Thi</h3>
              <p className="text-xs text-slate-500">
                Tự động hoán vị thứ tự câu hỏi và phương án, cập nhật ma trận đáp án tuyệt đối chuẩn xác
              </p>
            </div>
          </div>

          <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Đề gốc: {currentExam.questions.length} câu
          </span>
        </div>

        {/* Các trường nhập liệu số lượng & mã bắt đầu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div>
            <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
              Số lượng mã đề cần tạo:
            </label>
            <div className="flex items-center gap-1.5">
              {[2, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumberOfVariants(num)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    numberOfVariants === num
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {num} mã
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-2xs font-bold text-slate-700 uppercase mb-1">
              Mã đề bắt đầu:
            </label>
            <input
              type="number"
              min={100}
              max={999}
              value={startingCode}
              onChange={(e) => setStartingCode(parseInt(e.target.value, 10) || 101)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-mono font-bold bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col justify-end">
            <span className="text-2xs text-slate-500 mb-1">Dự kiến sinh các mã:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: numberOfVariants }).map((_, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200"
                >
                  {startingCode + i}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Các tùy chọn hoán vị */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
          <span className="font-bold text-slate-700 block text-2xs uppercase tracking-wider">
            Tùy chọn hoán vị thành phần:
          </span>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleQuestionsWithinParts}
              onChange={(e) => setShuffleQuestionsWithinParts(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-slate-800 font-medium">
              <strong>Hoán vị thứ tự câu hỏi trong từng Phần</strong> (Giữ nguyên cấu trúc phân tách Phần I, II, III).
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleOptionsPart1}
              onChange={(e) => setShuffleOptionsPart1(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-slate-800 font-medium">
              <strong>Hoán vị 4 phương án (A, B, C, D)</strong> trong Phần I (Tự động cập nhật đáp án đúng tương ứng).
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleStatementsPart2}
              onChange={(e) => setShuffleStatementsPart2(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-slate-800 font-medium">
              <strong>Hoán vị 4 nhận định (a, b, c, d)</strong> trong Phần II (Tự động chuyển đổi trạng thái Đúng/Sai đi kèm).
            </span>
          </label>

          <div className="text-2xs text-slate-500 italic pt-1">
            * Phần III (Trả lời ngắn): Chỉ hoán vị thứ tự các câu hỏi, bảo toàn nguyên vẹn giá trị số học và đơn vị tính.
          </div>
        </div>

        {/* Nút bấm sinh mã đề */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            onClick={handleGenerateCodes}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/25 transition cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Tạo các mã đề thi ({numberOfVariants} mã)</span>
          </button>

          {bundle && (
            <button
              onClick={handleApplyToStudentApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-2xs"
              title="Cung cấp các mã đề này cho học sinh làm bài thi"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Áp dụng bộ mã đề cho học sinh</span>
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO TOAST */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. KHU VỰC HIỂN THỊ KẾT QUẢ: MA TRẬN ĐÁP ÁN & CÁC MÃ ĐỀ */}
      {bundle && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
          
          {/* BANNER ĐẶC BIỆT: TẢI TRỌN BỘ ĐỀ THI & CHẤM THI (.ZIP) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Gói In Ấn Giấy & Chấm Thi Tự Động Tại Lớp</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
                Xuất Trọn Bộ Đề Thi Word & Dữ Liệu Chấm Thi Di Động (.ZIP)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Tự động tạo thư mục chứa <strong>{bundle.variants.length} tệp Word (.docx)</strong> từng mã đề (chuẩn thể thức Bộ GD&ĐT, tích hợp hình vẽ vector và công thức), <strong>File đáp án TN Maker (.xlsx)</strong>, <strong>Bảng ma trận so sánh (.xlsx)</strong> và <strong>Bản đặc tả đề thi (.docx)</strong>.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-amber-300 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Tải gói nén ZIP gồm các file Word từng mã đề, Excel TN Maker và bản đặc tả"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Đang đóng gói ZIP ({zipPercent}%)...</span>
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5 text-slate-950" />
                    <span>📦 Tải Trọn Bộ Đề Thi & Chấm Thi (.ZIP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Thanh công cụ xuất bản & Xem trước */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 uppercase">Chế độ xem:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setSelectedPreviewCode('matrix')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPreviewCode === 'matrix'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Ma trận đáp án</span>
                </button>

                {bundle.variants.map((v) => (
                  <button
                    key={v.code}
                    onClick={() => setSelectedPreviewCode(v.code || '')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      selectedPreviewCode === v.code
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mã {v.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Các nút tải xuất */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExportingZip}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-300 transition cursor-pointer shadow-xs disabled:opacity-60"
                title="Tải trọn bộ đề thi và chấm thi dạng tệp ZIP"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Tải trọn bộ (.zip)</span>
              </button>

              <button
                onClick={() => exportAnswerMatrixToCSV(bundle)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition cursor-pointer shadow-2xs"
                title="Tải bảng ma trận đáp án Excel CSV chuẩn UTF-8 BOM"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải ma trận (Excel)</span>
              </button>

              <button
                onClick={() => exportBundleToJson(bundle)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                title="Tải toàn bộ bộ mã đề dạng tệp JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải bộ mã (.json)</span>
              </button>

              {onOpenPrintMatrix && (
                <button
                  onClick={() => onOpenPrintMatrix(bundle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                  title="In toàn bộ các mã đề và bảng ma trận đáp án trên từng trang riêng biệt"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xuất tất cả mã đề (In / PDF)</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW A: BẢNG MA TRẬN ĐÁP ÁN SO SÁNH TẤT CẢ MÃ ĐỀ */}
          {selectedPreviewCode === 'matrix' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>Bảng ma trận đối chiếu đáp án tất cả các mã đề thi</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Đối chiếu nhanh đáp án của từng câu hỏi ở vị trí tương ứng trên từng đề thi
                  </p>
                </div>
                <div className="text-2xs text-slate-500 font-mono">
                  Ngày tạo: {bundle.generatedAt}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-3xs border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Câu</th>
                      <th className="py-2.5 px-3 w-20">Phần</th>
                      <th className="py-2.5 px-3">Chủ đề câu hỏi</th>
                      <th className="py-2.5 px-3 text-center bg-slate-100 font-bold text-slate-900">Đề gốc</th>
                      {bundle.variants.map((v) => (
                        <th
                          key={v.code}
                          className="py-2.5 px-3 text-center font-mono font-bold text-indigo-800 bg-indigo-50/70"
                        >
                          Mã {v.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {bundle.matrix.map((row) => {
                      return (
                        <tr key={row.originalIndex} className="hover:bg-slate-50/70 transition">
                          <td className="py-2 px-3 text-center font-bold text-slate-800">
                            {row.originalIndex}
                          </td>
                          <td className="py-2 px-3 text-2xs font-semibold text-slate-600">
                            {row.part}
                          </td>
                          <td className="py-2 px-3 text-slate-700 truncate max-w-xs text-2xs">
                            {row.topic}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold bg-slate-50 text-slate-800">
                            {row.answersByCode['Gốc']}
                          </td>
                          {bundle.variants.map((v) => {
                            const ans = row.answersByCode[v.code || ''] || '-';
                            const isMCQ = row.part === 'Phần I';
                            const isTF = row.part === 'Phần II';

                            return (
                              <td
                                key={v.code}
                                className="py-2 px-3 text-center font-mono font-bold text-indigo-900 bg-indigo-50/20"
                              >
                                {isMCQ ? (
                                  <span className="inline-block w-6 h-6 leading-6 rounded-full bg-indigo-100 text-indigo-800 text-xs">
                                    {ans}
                                  </span>
                                ) : isTF ? (
                                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-2xs">
                                    {ans}
                                  </span>
                                ) : (
                                  <span className="text-slate-800 text-xs">
                                    {ans}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW B: XEM TRƯỚC CHI TIẾT MỘT MÃ ĐỀ CỤ THỂ */}
          {previewVariant && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-600 text-white">
                    Mã đề: {previewVariant.code}
                  </span>
                  <span className="font-bold text-xs text-indigo-900">
                    {previewVariant.title} • {previewVariant.questions.length} câu hỏi
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xs text-indigo-600 hidden sm:inline">
                    Thời gian: {previewVariant.durationMinutes} phút
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingleWord(previewVariant)}
                    disabled={downloadingWordCode === previewVariant.code}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 transition cursor-pointer shadow-2xs disabled:opacity-60"
                    title={`Tải file Word chuẩn thể thức Bộ GD&ĐT của mã đề ${previewVariant.code}`}
                  >
                    {downloadingWordCode === previewVariant.code ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>Tải Word mã {previewVariant.code} (.docx)</span>
                  </button>
                </div>
              </div>

              {/* Danh sách câu hỏi của mã đề này */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 divide-y divide-slate-100">
                {previewVariant.questions.map((q, idx) => (
                  <div key={q.id} className="pt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Câu {idx + 1}:</span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{q.part}</span>
                      <span className="text-2xs text-slate-500">{q.topic}</span>
                    </div>

                    <div className="text-slate-800 font-medium">
                      <MathRenderer content={q.stem} />
                    </div>

                    {q.diagram && (
                      <div className="my-2 max-w-md">
                        <DiagramViewer diagram={q.diagram} allowZoom={false} />
                      </div>
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {(q as any).options?.map((opt: any) => (
                          <div
                            key={opt.id}
                            className={`p-1.5 rounded-lg border text-2xs ${
                              opt.id === (q as any).correctAnswer
                                ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="font-bold mr-1">{opt.id}.</span>
                            <MathRenderer content={opt.text} inline={true} />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false_cluster' && (
                      <div className="space-y-1 pt-1">
                        {(q as any).items?.map((it: any) => (
                          <div key={it.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200 text-2xs">
                            <div className="flex items-start gap-1">
                              <span className="font-bold">{it.id})</span>
                              <MathRenderer content={it.statement} inline={true} />
                            </div>
                            <span className={`px-1.5 py-0.2 rounded font-bold font-mono text-3xs ${
                              it.correctAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {it.correctAnswer ? 'Đ' : 'S'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'short_answer' && (
                      <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-2xs font-mono font-bold text-indigo-700">
                        Đáp án: {(q as any).correctValue} {(q as any).unitHint || ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL TIẾN ĐỘ ĐÓNG GÓI GÓI ZIP TRỌN BỘ ĐỀ THI & CHẤM THI */}
      {isExportingZip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-7 h-7 animate-bounce" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Đang Đóng Gói Trọn Bộ Đề Thi & Chấm Thi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng đợi giây lát trong khi hệ thống kết xuất các tệp Word (.docx) và Excel (.xlsx)...
              </p>
            </div>

            {/* Thanh tiến trình */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${zipPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-2xs text-slate-500">
                <span className="font-medium truncate max-w-[280px]">{zipStepText || 'Đang xử lý...'}</span>
                <span className="font-mono font-bold text-indigo-600">{zipPercent}%</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-3xs text-slate-600 text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Thư mục <strong>De_Thi_Word/</strong> ({bundle?.variants.length} tệp docx kèm sơ đồ & công thức)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tệp <strong>Dap_An_TN_Maker.xlsx</strong> (Chấm thi tự động camera điện thoại)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tệp <strong>Bang_Ma_Tran_Dap_An_Tong_Hop.xlsx</strong> & <strong>Ban_Dac_Ta.docx</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};