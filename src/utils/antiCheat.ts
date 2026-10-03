import { AntiCheatConfig, ExamAuditLog, ViolationEvent } from '../types/exam';

const STORAGE_KEY = 'physixam_anticheat_config';

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  enabled: true,
  requireFullscreen: true,
  trackTabSwitching: true,
  maxViolations: 3,
  preventCopyAndShortcuts: true,
};

export function getSavedAntiCheatConfig(): AntiCheatConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ANTI_CHEAT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      requireFullscreen: typeof parsed.requireFullscreen === 'boolean' ? parsed.requireFullscreen : true,
      trackTabSwitching: typeof parsed.trackTabSwitching === 'boolean' ? parsed.trackTabSwitching : true,
      maxViolations: typeof parsed.maxViolations === 'number' && parsed.maxViolations > 0 ? parsed.maxViolations : 3,
      preventCopyAndShortcuts: typeof parsed.preventCopyAndShortcuts === 'boolean' ? parsed.preventCopyAndShortcuts : true,
    };
  } catch {
    return DEFAULT_ANTI_CHEAT_CONFIG;
  }
}

export function saveAntiCheatConfig(config: AntiCheatConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Không thể lưu cấu hình chống gian lận:', err);
  }
}

export function createInitialAuditLog(config: AntiCheatConfig): ExamAuditLog {
  return {
    violationCount: 0,
    maxAllowedViolations: config.enabled ? config.maxViolations : 999,
    violations: [],
    submissionReason: 'student_submitted',
    isFullscreenRequired: config.enabled && config.requireFullscreen,
    copyProtectionEnabled: config.enabled && config.preventCopyAndShortcuts,
    totalTabExits: 0,
  };
}

export function createViolationEntry(reason: string): ViolationEvent {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return {
    id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeStr,
    reason,
  };
}
