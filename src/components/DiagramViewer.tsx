import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, X, Download, ImageIcon, 
  Upload, Clipboard, Sparkles, RefreshCw, Trash2, Edit3, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { DiagramData } from '../types/exam';
import { generateSvgDiagramForQuestion } from '../services/diagramGeneratorService';

interface DiagramViewerProps {
  diagram?: DiagramData | null;
  allowZoom?: boolean;
  printMode?: boolean;
  missingPrompt?: string;
  // Props cho tính năng đính kèm và thay đổi sơ đồ
  questionId?: string;
  questionStem?: string;
  questionTitle?: string;
  questionTopic?: string;
  onAttachDiagram?: (diagram: DiagramData) => void;
  onRemoveDiagram?: () => void;
  canEdit?: boolean;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ 
  diagram, 
  allowZoom = true,
  printMode = false,
  missingPrompt,
  questionId,
  questionStem = '',
  questionTitle = '',
  questionTopic = '',
  onAttachDiagram,
  onRemoveDiagram,
  canEdit = true,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Trạng thái thao tác đính kèm ảnh
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showEditMenu, setShowEditMenu] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success', timeout = 3500) => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, timeout);
  };

  // 1. Xử lý tải ảnh từ máy tính (File Picker -> Base64)
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {
      showNotification('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP, SVG).', 'error');
      return;
    }

    // Nếu là file SVG
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = e.target?.result as string;
        if (svgContent && onAttachDiagram) {
          onAttachDiagram({
            type: 'svg',
            content: svgContent.trim(),
            caption: `Hình vẽ: ${file.name.replace(/\.[^/.]+$/, '')}`,
          });
          showNotification('Đã tải và đính kèm sơ đồ SVG thành công!');
        }
      };
      reader.readAsText(file);
      return;
    }

    // Nếu là ảnh Bitmap (PNG, JPG, WebP, vv.)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && onAttachDiagram) {
        onAttachDiagram({
          type: 'image',
          content: dataUrl,
          url: dataUrl,
          caption: 'Hình ảnh đính kèm',
        });
        showNotification('Đã tải và nhúng hình ảnh vào câu hỏi thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. Xử lý dán ảnh từ Clipboard (Ctrl+V)
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'clipboard-image.png', { type: imageType });
            handleFileUpload(file);
            return;
          }
        }
      }
      showNotification(
        'Không tìm thấy hình ảnh trong Clipboard. Vui lòng chụp ảnh màn hình (PrtScn) rồi bấm lại Dán.',
        'info'
      );
    } catch (err) {
      console.warn('Không thể truy cập Clipboard API trực tiếp:', err);
      showNotification(
        'Nhấn Ctrl+V khi rê chuột vào khung này để dán ảnh chụp màn hình trực tiếp.',
        'info'
      );
    }
  };

  // Lắng nghe sự kiện paste trên toàn khung khi người dùng trỏ chuột hoặc focus
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el || !onAttachDiagram) return;

    const onPaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) {
              handleFileUpload(blob);
              return;
            }
          }
        }
      }
    };

    el.addEventListener('paste', onPaste);
    return () => el.removeEventListener('paste', onPaste);
  }, [onAttachDiagram]);

  // 3. Xử lý AI Dựng đồ thị tự động (Gemini 3.8 Flash SVG)
  const handleGenerateAiSvg = async () => {
    if (!onAttachDiagram) return;
    setIsGeneratingAi(true);
    setStatusMessage({
      text: 'Đang kết nối AI để phân tích đề bài và dựng đồ thị vector SVG...',
      type: 'info',
    });

    try {
      const generated = await generateSvgDiagramForQuestion(questionStem, questionTitle, questionTopic);
      onAttachDiagram(generated);
      showNotification('AI đã dựng đồ thị vector SVG thành công và đính kèm vào câu hỏi!');
    } catch (err: any) {
      console.error('Lỗi khi dựng đồ thị AI:', err);
      showNotification(err?.message || 'Không thể tạo đồ thị bằng AI. Vui lòng thử tải ảnh từ máy tính.', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 4. Xử lý Kéo thả tệp vào khung
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // =========================================================================
  // TRƯỜNG HỢP A: THIẾU HÌNH VẼ NHƯNG ĐỀ BÀI CÓ LỜI NHẮC [Hình vẽ]
  // =========================================================================
  if (!diagram || (!diagram.content && !diagram.url)) {
    if (missingPrompt || diagram?.caption) {
      const captionText = missingPrompt || diagram?.caption || 'Hình vẽ mô tả hiện tượng Vật lí';

      // Chế độ in: hiển thị khung nhã nhặn, tránh phá vỡ bố cục
      if (printMode) {
        return (
          <div 
            className="diagram-placeholder-box my-2 mx-auto max-w-[500px] w-full p-3 rounded-lg border border-slate-300 bg-slate-50 text-center select-none print:border-slate-400 print:bg-white print-avoid-break"
            style={{ display: 'block', margin: '8px auto', maxWidth: '500px' }}
          >
            <div className="flex flex-col items-center justify-center gap-1 py-1">
              <span className="text-2xs font-bold text-slate-800">[Hình vẽ minh họa đề bài]</span>
              <p className="text-3xs text-slate-600 italic px-2">{captionText}</p>
            </div>
          </div>
        );
      }

      // Chế độ tương tác: Khung Placeholder thông minh hỗ trợ Tải ảnh, Dán clipboard, AI sinh đồ thị
      return (
        <div 
          ref={placeholderRef}
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`diagram-placeholder-card my-3.5 mx-auto max-w-[540px] w-full p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 shadow-2xs select-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
              : 'border-dashed border-indigo-200 bg-indigo-50/35 hover:bg-indigo-50/55 hover:border-indigo-300'
          }`}
          style={{ display: 'block', margin: '14px auto', maxWidth: '540px' }}
        >
          {/* Thông báo trạng thái nếu có */}
          {statusMessage && (
            <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              statusMessage.type === 'error'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : statusMessage.type === 'info'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : statusMessage.type === 'info' ? (
                <RefreshCw className="w-4 h-4 shrink-0 text-indigo-600 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100/80 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs sm:text-sm font-bold text-indigo-950 block">
                [Đề bài có hình vẽ minh họa]
              </span>
              <p className="text-2xs text-indigo-700/85 mt-0.5 max-w-md mx-auto leading-relaxed">
                {captionText}
              </p>
            </div>

            {/* KHU VỰC CÁC NÚT HÀNH ĐỘNG ĐÍNH KÈM SƠ ĐỒ */}
            {canEdit && onAttachDiagram && (
              <div className="mt-2.5 w-full pt-3 border-t border-indigo-200/70">
                <div className="text-3xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Đính kèm sơ đồ / hình ảnh cho câu hỏi này:
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {/* Nút 1: Tải ảnh từ máy */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="Chọn tệp ảnh từ máy tính (PNG, JPG, WebP, SVG)"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>📁 Tải ảnh từ máy tính</span>
                  </button>

                  {/* Nút 2: Dán từ Clipboard */}
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="Dán ảnh chụp màn hình đang có trong Clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-slate-600" />
                    <span>📋 Dán từ Clipboard (Ctrl+V)</span>
                  </button>

                  {/* Nút 3: AI Dựng đồ thị tự động (SVG) */}
                  <button
                    type="button"
                    onClick={handleGenerateAiSvg}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-2xs transition cursor-pointer disabled:opacity-50"
                    title="Gemini AI phân tích đề bài và tự động vẽ đồ thị vector SVG chuẩn xác"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang dựng SVG...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>✨ AI Dựng đồ thị tự động (SVG)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 text-3xs text-indigo-600/70">
                  Mẹo: Bạn có thể kéo thả ảnh trực tiếp hoặc nhấn Ctrl+V để gắn ảnh tức thì
                </div>

                {/* Input chọn file ẩn */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  // =========================================================================
  // TRƯỜNG HỢP B: ĐÃ CÓ DỮ LIỆU SƠ ĐỒ (SVG HOẶC ẢNH BITMAP)
  // =========================================================================
  const isSvg = diagram?.type === 'svg' || Boolean(diagram?.content && diagram.content.trim().startsWith('<svg'));
  const svgHtml = isSvg ? (diagram?.content || '') : '';
  
  const rawImageSrc = diagram?.url || diagram?.content || '';
  const resolvedImageSrc = useMemo(() => {
    if (!rawImageSrc || typeof rawImageSrc !== 'string') return '';
    const trimmed = rawImageSrc.trim();
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    // Nếu là chuỗi base64 thô chưa có tiền tố data:
    return `data:image/png;base64,${trimmed}`;
  }, [rawImageSrc]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 0.6));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSvg) {
      const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `so-do-vat-li-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (resolvedImageSrc) {
      const a = document.createElement('a');
      a.href = resolvedImageSrc;
      a.download = `hinh-anh-vat-li-${Date.now()}`;
      a.click();
    }
  };

  // Nếu đang ở chế độ PrintMode (hoặc khi render trong trang in/PDF)
  if (printMode) {
    return (
      <div 
        className="diagram-print-container print-avoid-break my-3 mx-auto max-w-[520px] w-full text-center select-none"
        style={{ display: 'block', margin: '12px auto', maxWidth: '520px' }}
      >
        <div className="bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-center overflow-visible shadow-2xs">
          {isSvg ? (
            <div
              className="physics-svg-container w-full h-auto flex items-center justify-center [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:block"
              style={{ display: 'block', opacity: 1, visibility: 'visible', maxWidth: '100%' }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : (
            <img
              src={resolvedImageSrc}
              alt="Hình ảnh câu hỏi"
              className="max-h-80 w-auto object-contain mx-auto rounded border border-gray-200 shadow-sm"
              style={{ display: 'block', opacity: 1, visibility: 'visible', maxWidth: '100%' }}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        {diagram?.caption && (
          <div className="mt-1.5 text-center text-xs text-slate-800 italic font-serif leading-snug">
            {diagram.caption}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="my-3 mx-auto w-full max-w-[530px] rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-200 group print:border-none print:shadow-none print:my-2 print-avoid-break"
      style={{ display: 'block', margin: '12px auto', maxWidth: '530px' }}
    >
      {/* Thanh công cụ sơ đồ */}
      <div className="no-print flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
          <span className="font-semibold text-slate-700">{isSvg ? 'Sơ đồ véc-tơ (SVG)' : 'Hình ảnh đính kèm'}</span>
          {diagram?.caption && (
            <span className="text-slate-400 font-normal truncate hidden sm:inline">| {diagram.caption}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Nút hành động cho giáo viên: Thay đổi / AI Dựng hình (SVG) / Xóa ảnh */}
          {canEdit && onAttachDiagram && (
            <div className="flex items-center gap-1 mr-1">
              {/* Nút 1: Thay đổi hình ảnh từ máy tính */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-200/70 text-slate-600 text-2xs font-semibold transition cursor-pointer"
                title="Thay đổi hình ảnh hoặc sơ đồ này từ máy tính"
              >
                <Edit3 className="w-3 h-3 text-indigo-600" />
                <span className="hidden sm:inline">Thay đổi</span>
              </button>

              {/* Nút 2: ✨ AI Dựng hình (SVG) - Tạo lại sơ đồ vector SVG */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateAiSvg();
                }}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-2xs font-bold transition cursor-pointer disabled:opacity-50"
                title="AI phân tích đề bài và tự động vẽ lại sơ đồ vector SVG chuẩn xác"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                    <span className="hidden sm:inline">Đang dựng SVG...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>✨ AI Dựng hình (SVG)</span>
                  </>
                )}
              </button>

              {onRemoveDiagram && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Bạn có chắc chắn muốn gỡ bỏ hình vẽ này khỏi câu hỏi?')) {
                      onRemoveDiagram();
                      showNotification('Đã gỡ bỏ hình vẽ.');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-2xs transition cursor-pointer"
                  title="Xóa hình ảnh này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {allowZoom && (
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Phóng to"
                className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Thu nhỏ"
                className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Đặt lại kích thước chuẩn"
                className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="h-3 w-px bg-slate-200 mx-0.5"></span>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Phóng to hình vẽ (Mở toàn màn hình)"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-indigo-50 text-indigo-700 font-semibold text-2xs transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Phóng to</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                title="Tải tệp sơ đồ"
                className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo trạng thái nếu có */}
      {statusMessage && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-800 flex items-center justify-between">
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Vùng hiển thị sơ đồ (nền trắng sạch, căn giữa, tỷ lệ responsive) */}
      <div 
        onClick={() => setIsFullscreen(true)}
        className="relative p-4 flex items-center justify-center min-h-[180px] max-h-[460px] overflow-auto bg-white cursor-pointer hover:bg-slate-50/40 transition print:p-2 print:min-h-0 print:max-h-none print:overflow-visible print:cursor-default"
        title="Nhấp để phóng to toàn màn hình"
      >
        {/* Nút phóng to nổi khi hover */}
        <div className="no-print absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-semibold shadow-md backdrop-blur-xs">
            <Maximize2 className="w-3.5 h-3.5" />
            Phóng to hình vẽ
          </span>
        </div>

        <div
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 ease-out flex items-center justify-center w-full max-w-full print:transform-none"
        >
          {isSvg ? (
            <div
              className="physics-svg-container w-full max-w-[500px] flex items-center justify-center select-none print:max-w-md [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:block"
              style={{ display: 'block', opacity: 1, visibility: 'visible' }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : imageError ? (
            <div className="text-center p-6 text-slate-400 text-xs flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-slate-300" />
              <span>Không thể hiển thị hình ảnh (đường dẫn không hợp lệ)</span>
            </div>
          ) : (
            <img
              src={resolvedImageSrc}
              alt="Hình ảnh câu hỏi"
              className="max-h-80 w-auto object-contain mx-auto rounded border border-gray-200 shadow-sm"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>

      {/* Chú thích sơ đồ bên dưới */}
      {diagram.caption && (
        <div className="text-center py-2 px-4 text-xs font-medium text-slate-600 italic bg-slate-50 border-t border-slate-100 print:bg-white print:border-none print:text-slate-900 print:text-[13px] print:py-1">
          {diagram.caption}
        </div>
      )}

      {/* Input chọn file ẩn cho nút thay đổi */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Cửa sổ xem toàn màn hình (Modal Lightbox) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {diagram.caption || 'Chi tiết hình vẽ & Sơ đồ phóng to'}
                </h3>
                <p className="text-xs text-slate-500">
                  Hiển thị véc-tơ độ nét cao • Dễ dàng quan sát vạch chia toạ độ và thông số chi tiết
                </p>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-50/40">
              {isSvg ? (
                <div
                  className="w-full max-w-4xl flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              ) : (
                <img
                  src={resolvedImageSrc}
                  alt={diagram?.altText || 'Hình vẽ phóng to'}
                  className="max-h-[75vh] w-auto object-contain rounded-lg"
                />
              )}
            </div>

            <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Mẹo: Bạn có thể nhấp chuột phải để sao chép hình ảnh hoặc tải tệp SVG.</span>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải sơ đồ về máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
