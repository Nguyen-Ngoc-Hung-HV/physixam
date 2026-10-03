import { Exam, DiagramData, Question } from '../types/exam';
import { safeStorage } from './safeStorage';

const STORAGE_ACTIVE_EXAM_KEY = 'physixam_active_exam';

/**
 * Đọc đề thi hiện tại từ safeStorage hoặc fallback sang đề mặc định
 */
export function getSavedCurrentExam(defaultExam: Exam): Exam {
  try {
    const raw = safeStorage.getItem(STORAGE_ACTIVE_EXAM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Không thể đọc physixam_active_exam từ safeStorage:', err);
  }
  return defaultExam;
}

/**
 * Lưu đề thi hiện tại vào safeStorage
 */
export function saveCurrentExam(exam: Exam): void {
  try {
    safeStorage.setItem(STORAGE_ACTIVE_EXAM_KEY, JSON.stringify(exam));
  } catch (err) {
    console.error('Không thể lưu physixam_active_exam vào safeStorage:', err);
  }
}

/**
 * Gắn hoặc gỡ hình ảnh/sơ đồ cho một câu hỏi trong đề thi và lưu ngay vào localStorage
 */
export function updateQuestionDiagramInExam(
  exam: Exam,
  questionId: string,
  diagram: DiagramData | null
): Exam {
  const updatedQuestions = exam.questions.map((q) => {
    if (q.id === questionId) {
      if (!diagram) {
        // Gỡ bỏ các key hình ảnh liên quan
        const copy: any = { ...q };
        delete copy.diagram;
        delete copy.image;
        delete copy.figure;
        delete copy.image_url;
        delete copy.base64;
        delete copy.image_base64;
        delete copy.chart;
        delete copy.illustration;
        delete copy.attachment;
        delete copy.data_image;
        return copy as Question;
      }
      return {
        ...q,
        diagram,
      };
    }
    return q;
  });

  const updatedExam: Exam = {
    ...exam,
    questions: updatedQuestions,
  };

  saveCurrentExam(updatedExam);
  return updatedExam;
}
