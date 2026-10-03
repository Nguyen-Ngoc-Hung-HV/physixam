import React from 'react';
import { CognitiveLevel, Question, TrueFalseItem } from '../types/exam';

export type { CognitiveLevel };

export interface CognitiveLevelInfo {
  code: CognitiveLevel;
  shortName: string;
  fullName: string;
  colorName: string;
  badgeClass: string;
  pillClass: string;
  lightBgClass: string;
}

export const COGNITIVE_LEVELS_CONFIG: Record<CognitiveLevel, CognitiveLevelInfo> = {
  NB: {
    code: 'NB',
    shortName: 'NB',
    fullName: 'Nhận biết',
    colorName: 'blue',
    badgeClass: 'bg-blue-100 text-blue-700 border border-blue-300 font-semibold px-2 py-0.5 rounded text-xs mr-2 inline-flex items-center gap-1 shrink-0',
    pillClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-2xs',
    lightBgClass: 'bg-blue-50/50',
  },
  TH: {
    code: 'TH',
    shortName: 'TH',
    fullName: 'Thông hiểu',
    colorName: 'emerald',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold px-2 py-0.5 rounded text-xs mr-2 inline-flex items-center gap-1 shrink-0',
    pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-2xs',
    lightBgClass: 'bg-emerald-50/50',
  },
  VD: {
    code: 'VD',
    shortName: 'VD',
    fullName: 'Vận dụng',
    colorName: 'amber',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-300 font-semibold px-2 py-0.5 rounded text-xs mr-2 inline-flex items-center gap-1 shrink-0',
    pillClass: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-2xs',
    lightBgClass: 'bg-amber-50/50',
  },
  VDC: {
    code: 'VDC',
    shortName: 'VDC',
    fullName: 'Vận dụng cao',
    colorName: 'rose',
    badgeClass: 'bg-rose-100 text-rose-700 border border-rose-300 font-semibold px-2 py-0.5 rounded text-xs mr-2 inline-flex items-center gap-1 shrink-0',
    pillClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-2xs',
    lightBgClass: 'bg-rose-50/50',
  },
};

/**
 * Regex patterns to detect inline cognitive level tags at the start of a stem, statement or title:
 * E.g.: "[NB]", "(NB)", "[Nhận biết]", "(Nhận biết)", "[VDC]", etc.
 */
export const COGNITIVE_PREFIX_REGEX = /^\s*(?:\[\s*(VDC|VD|TH|NB|Nhận\s*biết|Thông\s*hiểu|Vận\s*dụng\s*cao|Vận\s*dụng)\s*\]|\(\s*(VDC|VD|TH|NB|Nhận\s*biết|Thông\s*hiểu|Vận\s*dụng\s*cao|Vận\s*dụng)\s*\)|\b(VDC|VD|TH|NB)\b\s*[:\.-])\s*/i;

/**
 * Strip any inline cognitive level prefix from text (used for student view so tags are completely hidden)
 */
export function stripCognitiveLevelPrefix(text: string): string {
  if (!text) return '';
  return text.replace(COGNITIVE_PREFIX_REGEX, '').trim();
}

/**
 * Normalizes any text or raw string into CognitiveLevel ('NB' | 'TH' | 'VD' | 'VDC') or null
 */
export function normalizeCognitiveLevel(raw?: any): CognitiveLevel | null {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim().toLowerCase();

  // Exact codes
  if (str === 'nb' || str.includes('nhận biết') || str.includes('nhan biet')) {
    return 'NB';
  }
  if (str === 'vdc' || str.includes('vận dụng cao') || str.includes('van dung cao')) {
    return 'VDC';
  }
  if (str === 'vd' || str.includes('vận dụng') || str.includes('van dung')) {
    return 'VD';
  }
  if (str === 'th' || str.includes('thông hiểu') || str.includes('thong hieu')) {
    return 'TH';
  }

  return null;
}

/**
 * Extract inline level prefix from text if present
 */
export function extractCognitiveLevelFromText(text?: string): {
  level: CognitiveLevel | null;
  cleanedText: string;
} {
  if (!text) return { level: null, cleanedText: '' };

  const match = text.match(COGNITIVE_PREFIX_REGEX);
  if (match) {
    const rawMatched = match[1] || match[2] || match[3];
    const level = normalizeCognitiveLevel(rawMatched);
    const cleanedText = text.replace(COGNITIVE_PREFIX_REGEX, '').trim();
    return { level, cleanedText };
  }

  return { level: null, cleanedText: text };
}

/**
 * Get question cognitive level:
 * 1. Checks q.level, q.difficulty, q.cognitive_level, metadata.level, metadata.difficulty
 * 2. Checks inline text prefix in stem or title
 * 3. Falls back to standard Ministry format if undefined
 */
export function getQuestionCognitiveLevel(q: Question | any): CognitiveLevel {
  // 1. Metadata keys
  const directLevel =
    q.level ||
    q.cognitive_level ||
    q.difficulty ||
    q.metadata?.level ||
    q.metadata?.difficulty ||
    q.metadata?.cognitive_level;

  const normalized = normalizeCognitiveLevel(directLevel);
  if (normalized) return normalized;

  // 2. Inline text prefix in stem
  const fromStem = extractCognitiveLevelFromText(q.stem);
  if (fromStem.level) return fromStem.level;

  // 3. Inline text prefix in title
  const fromTitle = extractCognitiveLevelFromText(q.title);
  if (fromTitle.level) return fromTitle.level;

  // 4. Default pedagogical mapping for GDPT 2018 Physics if unassigned
  if (q.part === 'Phần I') {
    return 'NB';
  }
  if (q.part === 'Phần II') {
    return 'TH';
  }
  if (q.part === 'Phần III') {
    return 'VD';
  }

  return 'TH';
}

/**
 * Get Part II statement cognitive level:
 * 1. Checks item.level, item.difficulty, item.cognitive_level
 * 2. Checks inline prefix in statement
 * 3. Follows standard Vietnamese high school structure:
 *    a -> NB, b -> TH, c -> VD, d -> VDC
 */
export function getStatementCognitiveLevel(
  item: TrueFalseItem | any,
  defaultIndex: number = 0
): CognitiveLevel {
  // 1. Direct item metadata
  const directLevel = item.level || item.cognitive_level || item.difficulty;
  const normalized = normalizeCognitiveLevel(directLevel);
  if (normalized) return normalized;

  // 2. Inline prefix
  const fromStatement = extractCognitiveLevelFromText(item.statement);
  if (fromStatement.level) return fromStatement.level;

  // 3. Standard Ministry of Education Part II cluster progression:
  // a: Nhận biết (NB), b: Thông hiểu (TH), c: Vận dụng (VD), d: Vận dụng cao (VDC)
  const idStr = String(item.id || '').toLowerCase();
  if (idStr === 'a' || defaultIndex === 0) return 'NB';
  if (idStr === 'b' || defaultIndex === 1) return 'TH';
  if (idStr === 'c' || defaultIndex === 2) return 'VD';
  if (idStr === 'd' || defaultIndex === 3) return 'VDC';

  return 'TH';
}

/**
 * Component to render a stylized Cognitive Level Badge
 */
export const CognitiveLevelBadge: React.FC<{
  level: CognitiveLevel | string;
  showFullName?: boolean;
  className?: string;
}> = ({ level, showFullName = false, className = '' }) => {
  const normalized = normalizeCognitiveLevel(level) || 'TH';
  const config = COGNITIVE_LEVELS_CONFIG[normalized];

  return (
    <span
      className={`${config.badgeClass} ${className}`}
      title={`Mức độ nhận thức: ${config.fullName} (${config.code})`}
    >
      <span className="font-black">[{config.code}]</span>
      {showFullName && <span className="hidden sm:inline font-medium text-3xs">• {config.fullName}</span>}
    </span>
  );
};
