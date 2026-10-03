/**
 * Service tích hợp máy chủ Google Gemini API cho tính năng quét đề và sinh câu hỏi Vật lí THPT.
 * Tuân thủ bảo mật AI Studio: Toàn bộ quá trình gọi Gemini SDK thực hiện qua proxy máy chủ (/api/gemini/*).
 */

import { Exam, Question } from '../types/exam';
import { resolveQuestionDiagram } from '../utils/diagramResolver';

export function getSavedApiKey(): string {
  return '';
}

export function saveApiKey(_key: string): void {
  // Không lưu khóa trên client vì khóa được quản lý trên server
}

/**
 * Phân tích và chuẩn hóa chuỗi JSON đầu ra từ Gemini
 */
export function parseAndNormalizeExamJson(rawJson: string): { examInfo?: Partial<Exam>; questions: Question[] } {
  let cleanStr = rawJson.trim();
  // Loại bỏ Markdown code block nếu có
  if (cleanStr.startsWith('```json')) {
    cleanStr = cleanStr.slice(7);
  } else if (cleanStr.startsWith('```')) {
    cleanStr = cleanStr.slice(3);
  }
  if (cleanStr.endsWith('```')) {
    cleanStr = cleanStr.slice(0, -3);
  }
  cleanStr = cleanStr.trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanStr);
  } catch (err: any) {
    throw new Error(`Đầu ra từ AI không đúng định dạng JSON chuẩn: ${err.message}`);
  }

  let questionsRaw: any[] = [];
  let examInfo: Partial<Exam> = {};

  if (Array.isArray(parsed)) {
    questionsRaw = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.questions)) {
      questionsRaw = parsed.questions;
      examInfo = {
        title: parsed.title,
        subtitle: parsed.subtitle,
        durationMinutes: parsed.durationMinutes || 50,
      };
    } else {
      // Trường hợp trả về 1 câu hỏi đơn lẻ
      questionsRaw = [parsed];
    }
  }

  if (questionsRaw.length === 0) {
    throw new Error('AI không tìm thấy hoặc chưa trích xuất được câu hỏi nào từ nội dung cung cấp.');
  }

  // Chuẩn hóa từng câu hỏi
  const questions: Question[] = questionsRaw.map((q, idx) => {
    const id = q.id || `cau-ai-${Date.now()}-${idx + 1}`;
    const type = q.type || 'multiple_choice';
    const part = q.part || (type === 'multiple_choice' ? 'Phần I' : type === 'true_false_cluster' ? 'Phần II' : 'Phần III');
    const topic = q.topic || 'Dao động & Sóng cơ';
    const title = q.title || `Câu ${idx + 1}: ${topic}`;
    const points = typeof q.points === 'number' ? q.points : (part === 'Phần II' ? 1.0 : 0.25);
    const stem = q.stem || 'Nội dung câu hỏi';

    let diagram = resolveQuestionDiagram(q);
    if (diagram && !diagram.caption) {
      diagram.caption = `Hình ${idx + 1}`;
    }

    const explanation = q.explanation || {
      overview: 'Hướng dẫn giải chi tiết.',
      keyFormula: '',
      stepByStep: ['Áp dụng các định luật và công thức vật lí phù hợp.'],
    };

    if (type === 'multiple_choice') {
      const options = Array.isArray(q.options) && q.options.length >= 2 
        ? q.options.map((opt: any, optIdx: number) => ({
            id: opt.id || ['A', 'B', 'C', 'D'][optIdx],
            text: opt.text || String(opt),
          }))
        : [
            { id: 'A', text: 'Phương án A' },
            { id: 'B', text: 'Phương án B' },
            { id: 'C', text: 'Phương án C' },
            { id: 'D', text: 'Phương án D' },
          ];

      return {
        id,
        type: 'multiple_choice',
        part: 'Phần I',
        topic,
        title,
        points,
        stem,
        diagram,
        options,
        correctAnswer: q.correctAnswer || 'A',
        explanation,
      };
    } else if (type === 'true_false_cluster') {
      const items = Array.isArray(q.items) && q.items.length > 0
        ? q.items.map((item: any, itemIdx: number) => ({
            id: item.id || ['a', 'b', 'c', 'd'][itemIdx],
            statement: item.statement || 'Nhận định...',
            correctAnswer: Boolean(item.correctAnswer),
            explanation: item.explanation || '',
          }))
        : [
            { id: 'a', statement: 'Nhận định a', correctAnswer: true },
            { id: 'b', statement: 'Nhận định b', correctAnswer: false },
            { id: 'c', statement: 'Nhận định c', correctAnswer: true },
            { id: 'd', statement: 'Nhận định d', correctAnswer: false },
          ];

      return {
        id,
        type: 'true_false_cluster',
        part: 'Phần II',
        topic,
        title,
        points: 1.0,
        stem,
        diagram,
        items,
        explanation,
      };
    } else {
      return {
        id,
        type: 'short_answer',
        part: 'Phần III',
        topic,
        title,
        points: 0.25,
        stem,
        diagram,
        correctValue: typeof q.correctValue === 'number' ? q.correctValue : parseFloat(q.correctValue) || q.correctValue || 0,
        tolerance: typeof q.tolerance === 'number' ? q.tolerance : 0.05,
        acceptedUnits: Array.isArray(q.acceptedUnits) ? q.acceptedUnits : [q.unitHint || ''],
        unitHint: q.unitHint || '',
        placeholder: q.placeholder || `Điền số...`,
        explanation,
      };
    }
  });

  return { examInfo, questions };
}

/**
 * PHƯƠNG THỨC A: Quét đề thi từ hình ảnh / tài liệu qua Server Proxy
 */
export async function generateExamFromImage(
  base64Data: string,
  mimeType: string,
  _apiKey?: string,
  additionalNotes: string = '',
  _modelName?: string
): Promise<{ examInfo?: Partial<Exam>; questions: Question[] }> {
  const response = await fetch('/api/gemini/generate-from-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data,
      mimeType,
      additionalNotes,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`Lỗi máy chủ AI (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('Mô hình Gemini không phản hồi nội dung văn bản. Vui lòng thử lại.');
  }

  return parseAndNormalizeExamJson(data.text);
}

/**
 * PHƯƠNG THỨC B: Sinh câu hỏi tự động theo Ma trận / Yêu cầu văn bản qua Server Proxy
 */
export async function generateExamFromPrompt(
  teacherPrompt: string,
  topic: string,
  difficulty: string,
  _apiKey?: string,
  _modelName?: string
): Promise<{ examInfo?: Partial<Exam>; questions: Question[] }> {
  const response = await fetch('/api/gemini/generate-from-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      promptText: teacherPrompt,
      topic,
      difficulty,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`Lỗi máy chủ AI (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  if (!data.text) {
    throw new Error('Mô hình Gemini không phản hồi nội dung văn bản. Vui lòng thử lại.');
  }

  return parseAndNormalizeExamJson(data.text);
}
