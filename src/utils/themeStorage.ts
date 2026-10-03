import { safeStorage } from './safeStorage';

export interface BackgroundTheme {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  cssClass: string;
  style?: React.CSSProperties;
  previewColor: string;
  customImageData?: string;
}

export const PRESET_THEMES: BackgroundTheme[] = [
  {
    id: 'classic_slate',
    name: 'Thanh lịch Cổ điển',
    type: 'preset',
    cssClass: 'bg-slate-100/80 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]',
    previewColor: 'from-slate-200 to-slate-300',
  },
  {
    id: 'modern_physics',
    name: 'Vũ trụ & Vật lí Hiện đại',
    type: 'preset',
    cssClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100',
    previewColor: 'from-indigo-950 to-slate-900',
  },
  {
    id: 'academic_emerald',
    name: 'Phòng Thí nghiệm Hàn lâm',
    type: 'preset',
    cssClass: 'bg-gradient-to-br from-emerald-50/60 via-slate-100/80 to-teal-50/60',
    previewColor: 'from-emerald-200 to-teal-200',
  },
  {
    id: 'visual_lecture',
    name: 'Giảng đường Trực quan',
    type: 'preset',
    cssClass: 'bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-slate-100',
    previewColor: 'from-indigo-200 to-sky-200',
  },
];

const STORAGE_LOGO_KEY = 'physixam_custom_logo';
const STORAGE_THEME_KEY = 'physixam_bg_theme';
export const STORAGE_PANO_BG_KEY = 'physixam_pano_bg';

export interface PanoBackground {
  type: 'preset' | 'custom';
  presetId?: string;
  cssClass?: string;
  imageUrl?: string;
  name?: string;
}

export const PANO_PRESETS: { id: string; name: string; cssClass: string; preview: string }[] = [
  {
    id: 'deep_space',
    name: 'Vũ trụ Vật lí (Deep Space)',
    cssClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900',
    preview: 'from-slate-950 via-indigo-950 to-slate-900',
  },
  {
    id: 'academic_blue',
    name: 'Xanh Lam Hàn Lâm (Royal Academy)',
    cssClass: 'bg-gradient-to-r from-blue-950 via-indigo-900 to-sky-950',
    preview: 'from-blue-950 via-indigo-900 to-sky-950',
  },
  {
    id: 'quantum_teal',
    name: 'Lượng Tử Huyền Ảo (Quantum Teal)',
    cssClass: 'bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950',
    preview: 'from-slate-950 via-teal-950 to-emerald-950',
  },
  {
    id: 'aurora_purple',
    name: 'Cực Quang Tím (Aurora Violet)',
    cssClass: 'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950',
    preview: 'from-purple-950 via-indigo-950 to-slate-950',
  },
  {
    id: 'minimal_graphite',
    name: 'Than Chì Tối Giản (Graphite Slate)',
    cssClass: 'bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950',
    preview: 'from-slate-900 via-zinc-900 to-slate-950',
  },
];

/**
 * Lấy cấu hình hình nền Pano Banner từ localStorage / safeStorage
 */
export function getSavedPanoBg(): PanoBackground {
  try {
    const raw = safeStorage.getItem(STORAGE_PANO_BG_KEY) || localStorage.getItem(STORAGE_PANO_BG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.type === 'preset' || parsed.type === 'custom')) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc pano bg từ storage:', err);
  }
  return {
    type: 'preset',
    presetId: 'deep_space',
    cssClass: PANO_PRESETS[0].cssClass,
    name: PANO_PRESETS[0].name,
  };
}

/**
 * Lưu cấu hình hình nền Pano Banner vĩnh viễn vào localStorage và safeStorage
 */
export function savePanoBg(panoBg: PanoBackground): void {
  try {
    const val = JSON.stringify(panoBg);
    safeStorage.setItem(STORAGE_PANO_BG_KEY, val);
    try {
      localStorage.setItem(STORAGE_PANO_BG_KEY, val);
    } catch {}
  } catch (err) {
    console.error('Không thể lưu pano bg:', err);
  }
}

/**
 * Lấy logo tùy chỉnh của giáo viên từ safeStorage
 */
export function getSavedCustomLogo(): string | null {
  try {
    return safeStorage.getItem(STORAGE_LOGO_KEY);
  } catch {
    return null;
  }
}

/**
 * Lưu logo tùy chỉnh vào safeStorage
 */
export function saveCustomLogo(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      safeStorage.setItem(STORAGE_LOGO_KEY, dataUrl);
    } else {
      safeStorage.removeItem(STORAGE_LOGO_KEY);
    }
  } catch (err) {
    console.error('Không thể lưu logo tùy chỉnh:', err);
  }
}

/**
 * Lấy cấu hình hình nền hiện tại
 */
export function getSavedTheme(): BackgroundTheme {
  try {
    const raw = safeStorage.getItem(STORAGE_THEME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (err) {
    console.warn('Lỗi đọc theme từ storage:', err);
  }
  return PRESET_THEMES[0];
}

/**
 * Lưu cấu hình hình nền
 */
export function saveTheme(theme: BackgroundTheme): void {
  try {
    safeStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(theme));
  } catch (err) {
    console.error('Không thể lưu theme:', err);
  }
}
