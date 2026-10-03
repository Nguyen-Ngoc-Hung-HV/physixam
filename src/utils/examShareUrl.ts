import LZString from 'lz-string';
import QRCode from 'qrcode';
import { Exam } from '../types/exam';

/**
 * Nén đối tượng Exam thành chuỗi an toàn cho URL Hash (#exam=...)
 */
export function compressExamToHash(exam: Exam): string {
  try {
    // Tối ưu payload trước khi nén để giảm dung lượng tối đa
    const lightweightPayload = {
      id: exam.id,
      title: exam.title,
      subtitle: exam.subtitle || '',
      code: exam.code || '101',
      gradeLevel: exam.gradeLevel,
      durationMinutes: exam.durationMinutes || 45,
      totalPoints: exam.totalPoints || 10,
      questions: exam.questions,
    };
    const jsonStr = JSON.stringify(lightweightPayload);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return compressed;
  } catch (err) {
    console.error('Lỗi khi nén đề thi thành URL Hash:', err);
    // Fallback sang Base64 an toàn URI
    try {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(exam)))));
    } catch {
      return '';
    }
  }
}

/**
 * Giải nén Exam từ chuỗi URL Hash hoặc query parameter
 */
export function decompressExamFromHash(hashOrParam: string): Exam | null {
  if (!hashOrParam || typeof hashOrParam !== 'string') return null;

  let cleanStr = hashOrParam.trim();
  // Loại bỏ các tiền tố hash nếu có
  if (cleanStr.startsWith('#exam=')) cleanStr = cleanStr.substring(6);
  else if (cleanStr.startsWith('exam=')) cleanStr = cleanStr.substring(5);
  else if (cleanStr.startsWith('#')) cleanStr = cleanStr.substring(1);

  if (!cleanStr) return null;

  // 1. Thử giải nén bằng LZString
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(cleanStr);
    if (decompressed) {
      const parsed = JSON.parse(decompressed);
      if (parsed && Array.isArray(parsed.questions)) {
        return parsed as Exam;
      }
    }
  } catch (e) {
    // Tiếp tục thử fallback
  }

  // 2. Thử giải mã Base64
  try {
    const decodedUri = decodeURIComponent(cleanStr);
    const decodedJson = decodeURIComponent(escape(atob(decodedUri)));
    const parsed = JSON.parse(decodedJson);
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed as Exam;
    }
  } catch (e) {
    // Tiếp tục thử parse JSON trực tiếp
  }

  // 3. Thử parse trực tiếp nếu là JSON raw URL-encoded
  try {
    const decoded = decodeURIComponent(cleanStr);
    const parsed = JSON.parse(decoded);
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed as Exam;
    }
  } catch (e) {
    // Thất bại
  }

  return null;
}

/**
 * Tạo URL làm bài thi trực tiếp cho học sinh (hoàn toàn client-side, không phụ thuộc cookie)
 */
export function generateStudentShareUrl(exam: Exam): string {
  const compressed = compressExamToHash(exam);
  const base = window.location.origin + window.location.pathname;
  return `${base}#exam=${compressed}`;
}

/**
 * Tạo hình ảnh QR Code (Data URL) để học sinh quét bằng camera điện thoại
 */
export async function generateExamQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 280,
      color: {
        dark: '#1e1b4b', // Indigo 950
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Không thể tạo mã QR cho đề thi:', err);
    return '';
  }
}
