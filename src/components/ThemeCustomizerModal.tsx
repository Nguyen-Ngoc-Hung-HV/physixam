import React, { useState, useRef } from 'react';
import { 
  X, Palette, Image as ImageIcon, Upload, Check, 
  RotateCcw, Sparkles, Eye, CheckCircle2 
} from 'lucide-react';
import { BackgroundTheme, PRESET_THEMES } from '../utils/themeStorage';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: BackgroundTheme;
  onSelectTheme: (theme: BackgroundTheme) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleCustomImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setCustomError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setCustomError('Kích thước ảnh tối đa 8MB để tối ưu tốc độ tải trang.');
      return;
    }

    setCustomError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const customTheme: BackgroundTheme = {
          id: `custom_${Date.now()}`,
          name: `Hình nền ảnh: ${file.name.slice(0, 16)}...`,
          type: 'custom',
          cssClass: 'bg-cover bg-center bg-no-repeat bg-fixed',
          style: {
            backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.94)), url("${dataUrl}")`,
          },
          previewColor: 'from-sky-300 to-indigo-400',
          customImageData: dataUrl,
        };
        onSelectTheme(customTheme);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Tùy Biến Giao Diện & Hình Nền</h3>
              <p className="text-3xs text-indigo-200">Chọn chủ đề không gian học tập và khảo thí Vật lí</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chọn chủ đề */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Danh sách 4 mẫu cài đặt sẵn */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Chủ đề giao diện chuẩn giáo dục (Presets):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectTheme(theme)}
                    className={`p-3 rounded-2xl border text-left transition relative cursor-pointer flex flex-col justify-between h-28 group ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.previewColor} border border-slate-300 shadow-2xs`} />
                      {isSelected && (
                        <span className="p-1 rounded-full bg-indigo-600 text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600 transition">
                        {theme.name}
                      </span>
                      <span className="text-3xs text-slate-500">Mẫu thiết kế chuẩn</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tải lên ảnh nền tùy chỉnh */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Hoặc tải ảnh nền tùy ý từ máy tính:
            </label>

            {customError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
                {customError}
              </div>
            )}

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Nhấp để tải ảnh nền trường / phòng thí nghiệm
                </span>
                <span className="text-3xs text-slate-500">
                  Hỗ trợ PNG, JPG, WebP (Tự động phủ lớp mờ dịu mắt cho văn bản)
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleCustomImageUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Nếu đang dùng ảnh tùy chỉnh */}
          {currentTheme.type === 'custom' && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Đang áp dụng hình nền cá nhân</span>
              </div>
              <button
                type="button"
                onClick={() => onSelectTheme(PRESET_THEMES[0])}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại mặc định</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer shadow-xs"
          >
            Hoàn tất & Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
