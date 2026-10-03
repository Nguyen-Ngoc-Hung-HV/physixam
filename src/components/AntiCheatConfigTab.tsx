import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Maximize2, AlertTriangle, 
  Lock, Copy, Check, Eye, HelpCircle, Sparkles, RefreshCw, Zap
} from 'lucide-react';
import { AntiCheatConfig } from '../types/exam';
import { saveAntiCheatConfig } from '../utils/antiCheat';

interface AntiCheatConfigTabProps {
  config: AntiCheatConfig;
  onChangeConfig: (newConfig: AntiCheatConfig) => void;
}

export const AntiCheatConfigTab: React.FC<AntiCheatConfigTabProps> = ({
  config,
  onChangeConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<AntiCheatConfig>({ ...config });
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const updateSetting = <K extends keyof AntiCheatConfig>(key: K, value: AntiCheatConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onChangeConfig(updated);
    saveAntiCheatConfig(updated);
  };

  const showNotification = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3500);
  };

  // Áp dụng các bộ cấu hình mẫu định sẵn
  const applyPreset = (preset: 'strict' | 'standard' | 'relaxed') => {
    let presetConfig: AntiCheatConfig;
    if (preset === 'strict') {
      presetConfig = {
        enabled: true,
        requireFullscreen: true,
        trackTabSwitching: true,
        maxViolations: 2,
        preventCopyAndShortcuts: true,
      };
      showNotification('Đã áp dụng cấu hình: "Kỳ thi Nghiêm ngặt (Đánh giá năng lực)"');
    } else if (preset === 'standard') {
      presetConfig = {
        enabled: true,
        requireFullscreen: true,
        trackTabSwitching: true,
        maxViolations: 3,
        preventCopyAndShortcuts: true,
      };
      showNotification('Đã áp dụng cấu hình: "Tiêu chuẩn (Kiểm tra định kỳ)"');
    } else {
      presetConfig = {
        enabled: true,
        requireFullscreen: false,
        trackTabSwitching: true,
        maxViolations: 5,
        preventCopyAndShortcuts: false,
      };
      showNotification('Đã áp dụng cấu hình: "Khảo sát / Luyện tập tự do"');
    }
    setLocalConfig(presetConfig);
    onChangeConfig(presetConfig);
    saveAntiCheatConfig(presetConfig);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast thông báo lưu thành công */}
      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{savedToast}</span>
          </div>
        </div>
      )}

      {/* Banner giới thiệu hệ thống */}
      <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl text-white shadow-lg border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Hệ thống Giám sát & Chống gian lận khi thi
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Chuẩn Khảo thí Trực tuyến
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Bảo vệ tính minh bạch và công bằng cho kỳ thi: Giám sát toàn màn hình, phát hiện rời tab và chặn thao tác sao chép.
              </p>
            </div>
          </div>

          {/* Công tắc bật/tắt toàn bộ hệ thống */}
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl border border-white/15 backdrop-blur-sm self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-200">
              {localConfig.enabled ? 'Đang kích hoạt' : 'Đang tạm tắt'}
            </span>
            <button
              onClick={() => updateSetting('enabled', !localConfig.enabled)}
              type="button"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localConfig.enabled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Các chế độ cấu hình nhanh (Presets) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Bộ cấu hình nhanh (Presets)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            type="button"
            onClick={() => applyPreset('strict')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              localConfig.enabled && localConfig.requireFullscreen && localConfig.maxViolations === 2 && localConfig.preventCopyAndShortcuts
                ? 'bg-rose-50/80 border-rose-400 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Nghiêm ngặt
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                Tối đa 2 lần
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Bắt buộc toàn màn hình, khóa tab nghiêm ngặt, chặn copy & F12. Phù hợp thi chính thức.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              localConfig.enabled && localConfig.requireFullscreen && localConfig.maxViolations === 3 && localConfig.preventCopyAndShortcuts
                ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tiêu chuẩn
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                Mặc định (3 lần)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Bắt buộc toàn màn hình, cảnh báo 3 lần rời tab rồi tự động nộp, chặn sao chép.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('relaxed')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              localConfig.enabled && !localConfig.requireFullscreen && localConfig.maxViolations === 5
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Luyện tập tự do
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                Tối đa 5 lần
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Không ép toàn màn hình, ghi nhận số lần chuyển tab để tham khảo, cho phép copy công thức.
            </p>
          </button>

        </div>
      </div>

      {/* Danh sách các thiết lập chi tiết */}
      <div className={`space-y-4 transition-opacity ${localConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-600" />
          Chi tiết quy chế giám sát thi
        </label>

        {/* 1. Bắt buộc toàn màn hình */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                1. Bắt buộc chế độ toàn màn hình (Full-screen enforcement)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Yêu cầu học sinh mở toàn màn hình để bắt đầu bài thi. Nếu thoát toàn màn hình giữa chừng, giao diện sẽ khóa lại và hiển thị cảnh báo yêu cầu quay lại toàn màn hình mới được tiếp tục làm bài.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={localConfig.requireFullscreen}
            onChange={(e) => updateSetting('requireFullscreen', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

        {/* 2. Cảnh báo & Đếm số lần rời khỏi màn hình thi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  2. Cảnh báo & Đếm số lần rời màn hình thi (Tab Switching & Focus Loss)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động phát hiện khi học sinh chuyển sang tab khác, thu nhỏ cửa sổ trình duyệt, hoặc chuyển sang ứng dụng khác. Cảnh báo bằng popup tức thời kèm số lần vi phạm.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localConfig.trackTabSwitching}
              onChange={(e) => updateSetting('trackTabSwitching', e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
            />
          </div>

          {/* Thiết lập ngưỡng số lần vi phạm tối đa */}
          {localConfig.trackTabSwitching && (
            <div className="ml-11 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-lg">
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-rose-700">Số lần vi phạm tối đa trước khi tự động nộp bài:</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Khi số lần rời màn hình vượt quá ngưỡng này, bài thi sẽ bị khóa ngay lập tức và tự động nộp về máy chủ với trạng thái "Đình chỉ / Vi phạm quy chế".
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={localConfig.maxViolations}
                  onChange={(e) => updateSetting('maxViolations', parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value={1}>1 lần (Khóa ngay khi rời tab)</option>
                  <option value={2}>2 lần</option>
                  <option value={3}>3 lần (Khuyên dùng)</option>
                  <option value={4}>4 lần</option>
                  <option value={5}>5 lần</option>
                  <option value={10}>10 lần</option>
                </select>
                <span className="text-xs text-slate-500 font-medium">lần</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Chặn sao chép, chuột phải và phím tắt */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0 mt-0.5">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                3. Chặn sao chép, chuột phải & phím tắt (Content Protection & Anti-Copy)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Vô hiệu hóa menu chuột phải (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">contextmenu</code>), cấm bôi đen sao chép văn bản câu hỏi (<code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">user-select: none</code>), chặn các tổ hợp phím tắt: <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">Ctrl+C / Cmd+C</code>, <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">Ctrl+U</code>, <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">F12</code>, <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">Ctrl+Shift+I</code>.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={localConfig.preventCopyAndShortcuts}
            onChange={(e) => updateSetting('preventCopyAndShortcuts', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
          />
        </div>

      </div>

      {/* Thông tin giải thích & Nhật ký minh bạch */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Nhật ký giám sát (Audit Log) minh bạch:</p>
          <p>
            Mọi sự kiện rời tab và thoát toàn màn hình đều được ghi nhận chi tiết theo từng giây trong phần <span className="font-semibold text-slate-700">Nhật ký giám sát</span> hiển thị ở màn hình kết quả sau khi nộp bài, đồng thời được đính kèm vào file xuất Excel/CSV và phiếu điểm in ấn để giáo viên đối chiếu.
          </p>
        </div>
      </div>

    </div>
  );
};
