import { Exam, Question } from '../types/exam';

/**
 * Tự động chuẩn hóa dữ liệu JSON đầu vào về cấu trúc Exam chuẩn của PhysiXam
 * Hỗ trợ nhận diện cả cấu trúc metadata + sections (như 04_DE_THI.json)
 */
export function normalizeExamJson(rawJson: any): Exam {
  if (!rawJson) {
    throw new Error('Dữ liệu JSON rỗng hoặc không hợp lệ.');
  }

  // 1. Nếu đã là định dạng chuẩn của PhysiXam (đã có mảng questions)
  if (Array.isArray(rawJson.questions)) {
    return rawJson as Exam;
  }

  // 2. Chuyển đổi từ định dạng phân tầng metadata + exam.sections
  const examContainer = rawJson.exam || rawJson;
  const metadata = rawJson.metadata || {};
  const sections = Array.isArray(examContainer.sections) ? examContainer.sections : [];

  const convertedQuestions: Question[] = [];

  sections.forEach((section: any) => {
    const rawQuestions = Array.isArray(section.questions) ? section.questions : [];
    const sectionType = (section.type || '').toUpperCase();
    const sectionName = section.name || '';

    let part: 'Phần I' | 'Phần II' | 'Phần III' = 'Phần I';
    if (sectionType === 'MCQ' || sectionName.includes('PHẦN I')) {
      part = 'Phần I';
    } else if (sectionType === 'TRUE_FALSE' || sectionName.includes('PHẦN II')) {
      part = 'Phần II';
    } else if (sectionType === 'SHORT_ANSWER' || sectionName.includes('PHẦN III')) {
      part = 'Phần III';
    }

    rawQuestions.forEach((q: any, idx: number) => {
      // Nhận diện sơ đồ / đồ thị Base64
      let diagram: any = undefined;
      if (q.diagram) {
        diagram = q.diagram;
      } else if (q.image && q.image.data) {
        const mime = q.image.mime_type || 'image/png';
        diagram = {
          type: 'image',
          url: `data:${mime};base64,${q.image.data}`,
          caption: q.image.caption || `Hình vẽ câu ${q.number || idx + 1}`,
        };
      }

      const level = q.level || 'NB';
      const rawStem = q.stem || q.question || '';
      const formattedStem = rawStem.startsWith('[') ? rawStem : `[${level}] ${rawStem}`;

      // Xử lý chuẩn kiểu explanation bao gồm cả stepByStep
      let explanation: any = undefined;
      if (q.explanation) {
        if (typeof q.explanation === 'string') {
          explanation = {
            overview: q.explanation,
            stepByStep: [],
          };
        } else if (typeof q.explanation === 'object') {
          explanation = {
            overview: q.explanation.overview || '',
            stepByStep: Array.isArray(q.explanation.stepByStep) ? q.explanation.stepByStep : [],
            keyFormula: q.explanation.keyFormula,
          };
        }
      }

      if (part === 'Phần I') {
        const options = Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              id: opt.id || opt.key,
              text: opt.text || opt.content || '',
            }))
          : [];

        let correctAnswer = q.answer || q.correctKey || '';
        if (!correctAnswer && Array.isArray(q.options)) {
          const found = q.options.find((o: any) => o.correct === true);
          if (found) correctAnswer = found.id || found.key;
        }

        convertedQuestions.push({
          id: q.id || `q-part1-${idx + 1}`,
          part: 'Phần I',
          type: 'multiple_choice',
          title: `Câu ${q.number || convertedQuestions.length + 1}`,
          stem: formattedStem,
          topic: metadata.topic || q.topic || 'Vật lí 12',
          points: q.points || 0.25,
          options,
          correctAnswer,
          diagram,
          explanation,
        });
      } else if (part === 'Phần II') {
        const items = Array.isArray(q.items)
          ? q.items
          : Array.isArray(q.subQuestions)
          ? q.subQuestions.map((sub: any) => ({
              id: sub.id || sub.key,
              statement: sub.statement || sub.content || '',
              correctAnswer: Boolean(sub.correctAnswer ?? sub.correct),
            }))
          : Array.isArray(q.options)
          ? q.options.map((opt: any) => ({
              id: (opt.id || 'a').toLowerCase(),
              statement: opt.text || opt.content || '',
              correctAnswer: Boolean(opt.correct),
            }))
          : [];

        convertedQuestions.push({
          id: q.id || `q-part2-${idx + 1}`,
          part: 'Phần II',
          type: 'true_false_cluster',
          title: `Câu ${q.number || convertedQuestions.length + 1}`,
          stem: formattedStem,
          topic: metadata.topic || q.topic || 'Vật lí 12',
          points: q.points || 1.0,
          items,
          diagram,
          explanation,
        });
      } else {
        convertedQuestions.push({
          id: q.id || `q-part3-${idx + 1}`,
          part: 'Phần III',
          type: 'short_answer',
          title: `Câu ${q.number || convertedQuestions.length + 1}`,
          stem: formattedStem,
          topic: metadata.topic || q.topic || 'Vật lí 12',
          points: q.points || 0.25,
          correctValue: String(q.correctValue ?? q.answer ?? ''),
          acceptedUnits: q.acceptedUnits || (q.unit ? [q.unit] : []),
          tolerance: q.tolerance || 0,
          diagram,
          explanation,
        });
      }
    });
  });

  return {
    id: rawJson.id || `exam-${Date.now()}`,
    title: metadata.title || rawJson.title || 'Đề thi Vật lí 12',
    subtitle: metadata.topic || rawJson.subtitle || '',
    instructions: rawJson.instructions || metadata.instructions || 'Thí sinh làm bài theo đúng thời gian quy định.',
    durationMinutes: Number(metadata.duration_minutes || examContainer.duration || rawJson.durationMinutes || 50),
    totalPoints: Number(rawJson.totalPoints || 10),
    gradeLevel: metadata.grade ? `Lớp ${metadata.grade}` : (rawJson.gradeLevel || 'Lớp 12'),
    code: rawJson.code || '101',
    questions: convertedQuestions,
  };
}