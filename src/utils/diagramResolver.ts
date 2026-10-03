import { DiagramData, Question } from '../types/exam';

/**
 * Biểu thức chính quy kiểm tra đề bài có nhắc đến hình vẽ, đồ thị, sơ đồ hay không
 */
export const FIGURE_MENTION_REGEX = /\[hình\s*vẽ\]|như\s+hình\s*(vẽ|bên|dưới)?|đồ\s+thị\s+(bên|dưới|hình)|sơ\s+đồ\s+(mạch|bên|hình)|theo\s+hình\s+(vẽ|bên|dưới)|\(hình\s*vẽ\)/i;

/**
 * Kiểm tra chuỗi có chứa thẻ SVG hợp lệ không
 */
export function isSvgString(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.startsWith('<svg') || (trimmed.includes('<svg') && trimmed.includes('</svg>'));
}

/**
 * Phân tích và trích xuất DiagramData từ bất kỳ trường dữ liệu nào (root hoặc nested)
 * Hỗ trợ các key: diagram, image, figure, image_url, img_url, base64, image_base64,
 * media, chart, illustration, attachment, data_image.
 */
export function resolveQuestionDiagram(q: any): DiagramData | undefined {
  if (!q || typeof q !== 'object') return undefined;

  const candidateKeys = [
    'diagram',
    'image',
    'figure',
    'image_url',
    'img_url',
    'base64',
    'image_base64',
    'media',
    'chart',
    'illustration',
    'attachment',
    'data_image',
    'diagram_url',
    'figure_url',
    'photo',
    'picture',
    'graph',
    'svg',
  ];

  const parseCandidate = (val: any, defaultCaption?: string): DiagramData | undefined => {
    if (!val) return undefined;

    // 1. Trường hợp là object (DiagramData, cấu trúc { mime_type, encoding, data }, hoặc tương đương)
    if (typeof val === 'object' && !Array.isArray(val)) {
      // SVG detection
      const rawSvg = isSvgString(val.content)
        ? val.content
        : isSvgString(val.svg)
        ? val.svg
        : isSvgString(val.data)
        ? val.data
        : isSvgString(val.code)
        ? val.code
        : undefined;

      if (val.type === 'svg' || rawSvg) {
        return {
          type: 'svg',
          content: rawSvg || val.content || val.svg || val.data || val.code,
          caption: val.caption || val.altText || val.title || defaultCaption,
          altText: val.altText || val.caption || defaultCaption,
          aspectRatio: val.aspectRatio,
        };
      }

      // Chuẩn hóa dữ liệu hình ảnh (Base64 / URL)
      const mime = val.mime_type || val.mimeType || val.type_mime || 'image/png';
      let resolvedSrc: string | undefined = undefined;

      // Kiểm tra trường data (Base64 hoặc URL)
      if (val.data && typeof val.data === 'string') {
        const trimmedData = val.data.trim();
        if (
          trimmedData.startsWith('data:') ||
          trimmedData.startsWith('http://') ||
          trimmedData.startsWith('https://') ||
          trimmedData.startsWith('blob:') ||
          trimmedData.startsWith('/')
        ) {
          resolvedSrc = trimmedData;
        } else if (trimmedData.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmedData}`;
        }
      } else if (val.data_url && typeof val.data_url === 'string') {
        const trimmed = val.data_url.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      } else if (val.url && typeof val.url === 'string') {
        const trimmed = val.url.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      } else if (val.src && typeof val.src === 'string') {
        const trimmed = val.src.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      } else if (val.content && typeof val.content === 'string') {
        const trimmed = val.content.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      } else if (val.image_url && typeof val.image_url === 'string') {
        const trimmed = val.image_url.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      } else if (val.img_url && typeof val.img_url === 'string') {
        const trimmed = val.img_url.trim();
        if (
          trimmed.startsWith('data:') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('blob:') ||
          trimmed.startsWith('/')
        ) {
          resolvedSrc = trimmed;
        } else if (trimmed.length > 0) {
          resolvedSrc = `data:${mime};base64,${trimmed}`;
        }
      }

      if (resolvedSrc) {
        return {
          type: 'image',
          content: resolvedSrc,
          url: resolvedSrc,
          caption: val.caption || val.altText || val.title || defaultCaption,
          altText: val.altText || val.caption || defaultCaption,
          aspectRatio: val.aspectRatio,
        };
      }
    }

    // 2. Trường hợp là chuỗi trực tiếp (URL, Base64 data URL, hoặc mã SVG)
    if (typeof val === 'string') {
      const str = val.trim();
      if (!str) return undefined;

      if (isSvgString(str)) {
        return {
          type: 'svg',
          content: str,
          caption: defaultCaption,
        };
      }

      // Web URL hoặc Data URL
      if (
        str.startsWith('data:') || 
        str.startsWith('http://') || 
        str.startsWith('https://') || 
        str.startsWith('blob:') || 
        str.startsWith('/')
      ) {
        return {
          type: 'image',
          url: str,
          content: str,
          caption: defaultCaption,
        };
      }

      // Chuỗi Base64 thô không có header
      if (/^[A-Za-z0-9+/=\s]{16,}$/.test(str)) {
        const cleaned = str.replace(/\s+/g, '');
        const dataUri = `data:image/png;base64,${cleaned}`;
        return {
          type: 'image',
          url: dataUri,
          content: dataUri,
          caption: defaultCaption,
        };
      }
    }

    return undefined;
  };

  const defaultCaption = q.caption || q.figure_caption || q.diagram_caption;

  // 1. Kiểm tra các trường ở cấp root
  for (const key of candidateKeys) {
    if (q[key] !== undefined && q[key] !== null) {
      const parsed = parseCandidate(q[key], defaultCaption);
      if (parsed && (parsed.content || parsed.url)) {
        return parsed;
      }
    }
  }

  // 2. Kiểm tra các đối tượng lồng nhau (meta, properties, details, explanation, data)
  const nestedObjects = [q.meta, q.properties, q.details, q.explanation, q.data, q.extra];
  for (const nested of nestedObjects) {
    if (nested && typeof nested === 'object') {
      for (const key of candidateKeys) {
        if (nested[key] !== undefined && nested[key] !== null) {
          const parsed = parseCandidate(nested[key], defaultCaption || nested.caption);
          if (parsed && (parsed.content || parsed.url)) {
            return parsed;
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Kiểm tra xem câu hỏi có bị thiếu hình vẽ hay không
 */
export function isQuestionMissingDiagram(q: Question | any): boolean {
  if (!q) return false;
  const diagram = resolveQuestionDiagram(q);
  if (diagram && (diagram.content || diagram.url)) {
    return false;
  }
  const stem = q.stem || '';
  return FIGURE_MENTION_REGEX.test(stem) || Boolean(q.needs_diagram || q.missingPrompt);
}
