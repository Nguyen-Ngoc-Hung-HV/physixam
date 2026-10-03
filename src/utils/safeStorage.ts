/**
 * Safe Storage Wrapper
 * Tự động bảo vệ chống lỗi SecurityError / QuotaExceededError trên iOS Safari,
 * Private Browsing Mode và trình duyệt nhúng trong ứng dụng (Zalo, Messenger, Facebook, TikTok).
 * Nếu localStorage bị chặn hoặc hạn chế, tự động chuyển đổi sang bộ nhớ RAM cục bộ (in-memory).
 */

const memoryStore = new Map<string, string>();

let isLocalStorageAvailable: boolean | null = null;

export function checkStorageAvailability(): boolean {
  if (isLocalStorageAvailable !== null) return isLocalStorageAvailable;
  try {
    const testKey = '__physixam_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
  } catch (e) {
    console.warn('localStorage không khả dụng hoặc bị chặn bởi chính sách bảo mật/iOS Safari. Kích hoạt bộ nhớ đệm in-memory.', e);
    isLocalStorageAvailable = false;
  }
  return isLocalStorageAvailable;
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (checkStorageAvailability()) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn(`Lỗi safeStorage.getItem("${key}"):`, e);
    }
    return memoryStore.get(key) || null;
  },

  setItem(key: string, value: string): void {
    try {
      if (checkStorageAvailability()) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`Lỗi safeStorage.setItem("${key}"):`, e);
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (checkStorageAvailability()) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`Lỗi safeStorage.removeItem("${key}"):`, e);
    }
    memoryStore.delete(key);
  },
};

/**
 * Kiểm tra xem môi trường hiện tại có phải là trình duyệt nhúng trên di động (In-App Browser) hay không
 */
export function detectInAppOrRestrictedBrowser(): {
  isInApp: boolean;
  isIosSafari: boolean;
  browserName: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isInApp: false, isIosSafari: false, browserName: 'Standard' };
  }

  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);

  const isZalo = /Zalo/i.test(ua);
  const isFb = /FBAN|FBAV/i.test(ua);
  const isMessenger = /Messenger/i.test(ua);
  const isLine = /Line/i.test(ua);
  const isWeChat = /MicroMessenger/i.test(ua);

  const isInApp = isZalo || isFb || isMessenger || isLine || isWeChat;
  const browserName = isZalo ? 'Zalo In-App Browser'
    : isFb ? 'Facebook Browser'
    : isMessenger ? 'Messenger Browser'
    : isLine ? 'Line Browser'
    : isIos && isSafari ? 'iOS Safari'
    : 'Trình duyệt chuẩn';

  return {
    isInApp,
    isIosSafari: isIos && isSafari,
    browserName,
  };
}
