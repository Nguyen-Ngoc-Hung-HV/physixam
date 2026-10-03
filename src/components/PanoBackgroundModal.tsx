import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, Sparkles, Check, Upload, 
  RotateCcw, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { 
  PanoBackground, PANO_PRESETS, getSavedPanoBg, savePanoBg 
} from '../utils/themeStorage';

interface PanoBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPanoBg: PanoBackground;
  onSavePanoBg: (bg: PanoBackground) => void;
}

export const PanoBackgroundModal: React.FC<PanoBackgroundModalProps> = ({
  isOpen,
  onClose,
  currentPanoBg,
  onSavePanoBg,
}) => {
  const [selectedType, setSelectedType] = useState<'preset' | 'custom'>(currentPanoBg.type);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentPanoBg.presetId || 'deep_space');
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(currentPanoBg.imageUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn tệp ảnh có định dạng JPG, PNG hoặc WebP.');
      return;
    }
    // Limit to ~5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCustomImageUrl(dataUrl);
        setSelectedType('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (selectedType === 'preset') {
      const preset = PANO_PRESETS.find((p) => p.id === selectedPresetId) || PANO_PRESETS[0];
      const newBg: PanoBackground = {
        type: 'preset',
        presetId: preset.id,
        cssClass: preset.cssClass,
        name: preset.name,
      };
      savePanoBg(newBg);
      onSavePanoBg(newBg);
    } else {
      if (!customImageUrl) {
        setUploadError('Vui lòng tải lên một ảnh nền trước khi lưu.');
        return;
      }
      const newBg: PanoBackground = {
        type: 'custom',
        imageUrl: customImageUrl,
        name: 'Ảnh nền tùy chỉnh',
      };
      savePanoBg(newBg);
      onSavePanoBg(newBg);
    }
    onClose();
  };

  const handleResetDefault = () => {
    const defaultBg: PanoBackground = {
      type: 'preset',
      presetId: 'deep_space',
      cssClass: PANO_PRESETS[0].cssClass,
      name: PANO_PRESETS[0].name,
    };
    setSelectedType('preset');
    setSelectedPresetId('deep_space');
    setCustomImageUrl(null);
    setUploadError(null);
    savePanoBg(defaultBg);
    onSavePanoBg(defaultBg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                🖼️ Tùy Biến Ảnh Nền Pano Banner Trang Chủ
              </h3>
              <p className="text-2xs text-slate-500">
                Cá nhân hóa giao diện banner đầu trang chủ theo nhận diện nhà trường hoặc phong cách yêu thích
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chọn Preset hoặc Tải ảnh */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* Tabs chuyển đổi giữa Preset và Custom */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedType('preset')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedType === 'preset'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gradients Học Thuật ({PANO_PRESETS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedType === 'custom'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải Ảnh Từ Máy Tính</span>
            </button>
          </div>

          {/* Tab 1: Danh sách Gradient Preset */}
          {selectedType === 'preset' && (
            <div className="space-y-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
                Chọn gradient màu sắc học thuật:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PANO_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPresetId(p.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${p.preview} shrink-0 shadow-inner border border-white/20`} />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                          <span className="text-3xs text-slate-500">Gradient chuẩn</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Tải ảnh tùy chỉnh */}
          {selectedType === 'custom' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-3xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-700 block">
                    Nhấp để tải lên ảnh nền banner (JPG, PNG, WebP)
                  </span>
                  <span className="text-3xs text-slate-500">
                    Khuyến nghị: Ảnh phong cảnh, phòng thí nghiệm, vũ trụ (độ phân giải 1920x600px, dưới 5MB)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Preview ảnh tùy chỉnh */}
              {customImageUrl && (
                <div className="space-y-2">
                  <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                    Xem trước ảnh đã tải lên:
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 w-full shadow-inner bg-slate-900">
                    <img
                      src={customImageUrl}
                      alt="Ảnh nền Pano"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-xs font-semibold">
                      <span>Lớp phủ chống chói chữ tự động kích hoạt</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vùng xem trước chung */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Mô phỏng hiển thị trên Banner Pano:
            </span>
            <div 
              className={`rounded-2xl p-4 text-white relative overflow-hidden shadow-md ${
                selectedType === 'preset'
                  ? (PANO_PRESETS.find((p) => p.id === selectedPresetId)?.cssClass || 'bg-slate-900')
                  : 'bg-slate-900'
              }`}
              style={
                selectedType === 'custom' && customImageUrl
                  ? { backgroundImage: `url(${customImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : undefined
              }
            >
              {selectedType === 'custom' && customImageUrl && (
                <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
              )}
              <div className="relative z-10 space-y-1">
                <span className="text-3xs uppercase font-bold text-indigo-300">Mẫu mô phỏng</span>
                <h4 className="text-sm font-black">Hệ Thống Khảo Thí & Học Tập Vật Lí THPT</h4>
                <p className="text-3xs text-slate-300">Chương trình GDPT 2018 • Chuẩn cấu trúc đề thi Bộ GD&ĐT</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp dụng ảnh nền</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
