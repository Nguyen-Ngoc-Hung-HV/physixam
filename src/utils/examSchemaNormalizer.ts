import { 
  Exam, 
  Question, 
  MultipleChoiceQuestion, 
  TrueFalseClusterQuestion, 
  ShortAnswerQuestion, 
  PhysicsTopic,
  QuestionType,
  DiagramData,
  TrueFalseItem,
  MultipleChoiceOption
} from '../types/exam';
import { detectPhysicsTopic, convertTextToKaTeX } from './wordExamParser';
import { sanitizeMathAndUnits } from './mathSanitizer';
import { resolveQuestionDiagram } from './diagramResolver';

export interface ExamNormalizeSummary {
  title: string;
  totalQuestions: number;
  part1Count: number;
  part2Count: number;
  part3Count: number;
  warnings: string[];
}

export interface NormalizeExamResult {
  exam: Exam;
  summary: ExamNormalizeSummary;
}

const VALID_TOPICS: PhysicsTopic[] = [
  'Cơ học & Động lực học',
  'Dao động & Sóng cơ',
  'Điện từ học & Mạch điện xoay chiều',
  'Nhiệt học & Thuyết động học',
  'Quang học & Sóng ánh sáng',
  'Vật lí hạt nhân & Hiện đại',
];

/**
 * Trích xuất tiêu đề đề thi linh hoạt qua nhiều cấu trúc phổ biến
 */
function extractTitle(data: any): string {
  if (!data || typeof data !== 'object') {
    return 'Đề kiểm tra môn Vật lí';
  }

  // 1. Root level
  const rootTitle = data.title || data.exam_title || data.examTitle || data.name || data.ten_de || data.tenDe;
  if (typeof rootTitle === 'string' && rootTitle.trim().length > 0) {
    return rootTitle.trim();
  }

  // 2. Metadata level
  if (data.metadata && typeof data.metadata === 'object') {
    const metaTitle = data.metadata.title || data.metadata.exam_title || data.metadata.examTitle || 
                      data.metadata.name || data.metadata.ten_de || data.metadata.tenDe;
    if (typeof metaTitle === 'string' && metaTitle.trim().length > 0) {
      return metaTitle.trim();
    }
  }

  // 3. Sub-object exam / data
  if (data.exam && typeof data.exam === 'object') {
    const examTitle = data.exam.title || data.exam.exam_title || data.exam.name || data.exam.ten_de;
    if (typeof examTitle === 'string' && examTitle.trim().length > 0) {
      return examTitle.trim();
    }
  }

  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const dataTitle = data.data.title || data.data.exam_title || data.data.name || data.data.ten_de;
    if (typeof dataTitle === 'string' && dataTitle.trim().length > 0) {
      return dataTitle.trim();
    }
  }

  // 4. Fallback mặc định
  return 'Đề kiểm tra môn Vật lí';
}

/**
 * Thu thập và hợp nhất các mảng câu hỏi từ cấu trúc thống nhất hoặc phân mảnh theo phần
 */
function aggregateQuestions(data: any): { rawQuestions: any[]; detectedParts: (string | undefined)[] } {
  if (!data) return { rawQuestions: [], detectedParts: [] };

  const rawQuestions: any[] = [];
  const detectedParts: (string | undefined)[] = [];

  // Trường hợp 0: Root data chính là một mảng câu hỏi
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') {
        rawQuestions.push(item);
        detectedParts.push(undefined);
      }
    }
    return { rawQuestions, detectedParts };
  }

  if (typeof data !== 'object') {
    return { rawQuestions: [], detectedParts: [] };
  }

  // Trường hợp Case B: Mảng questions thống nhất (tại root, data.questions, data.exam.questions, v.v.)
  const unifiedArray = data.questions || data.exam?.questions || data.data?.questions || data.items || data.question_list || data.danh_sach_cau_hoi;
  if (Array.isArray(unifiedArray) && unifiedArray.length > 0) {
    for (const item of unifiedArray) {
      if (item && typeof item === 'object') {
        rawQuestions.push(item);
        detectedParts.push(item.part || undefined);
      }
    }
    return { rawQuestions, detectedParts };
  }

  // Trường hợp Case A: Phân vùng theo các phần thi (Partitioned formats)
  // Quét các khóa Phần 1
  const part1Candidates = [
    data.part_1, data.part1, data.Part1, data.phan_1, data.phan1, data.Phan1,
    data.questions_part1, data.questions_part_1,
    data.metadata?.part_1, data.metadata?.part1,
    data.data?.part_1, data.data?.part1,
    data.exam?.part_1, data.exam?.part1,
    data.trac_nghiem, data.mcq
  ];
  for (const c of part1Candidates) {
    if (Array.isArray(c)) {
      for (const item of c) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần I');
        }
      }
      break;
    }
  }

  // Quét các khóa Phần 2
  const part2Candidates = [
    data.part_2, data.part2, data.Part2, data.phan_2, data.phan2, data.Phan2,
    data.questions_part2, data.questions_part_2,
    data.metadata?.part_2, data.metadata?.part2,
    data.data?.part_2, data.data?.part2,
    data.exam?.part_2, data.exam?.part2,
    data.dung_sai, data.true_false
  ];
  for (const c of part2Candidates) {
    if (Array.isArray(c)) {
      for (const item of c) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần II');
        }
      }
      break;
    }
  }

  // Quét các khóa Phần 3
  const part3Candidates = [
    data.part_3, data.part3, data.Part3, data.phan_3, data.phan3, data.Phan3,
    data.questions_part3, data.questions_part_3,
    data.metadata?.part_3, data.metadata?.part3,
    data.data?.part_3, data.data?.part3,
    data.exam?.part_3, data.exam?.part3,
    data.tra_loi_ngan, data.short_answer
  ];
  for (const c of part3Candidates) {
    if (Array.isArray(c)) {
      for (const item of c) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần III');
        }
      }
      break;
    }
  }

  // Quét trường hợp data.parts hoặc data.sections là mảng hoặc object
  const sectionsContainer = data.parts || data.sections || data.phan || data.metadata?.parts || data.metadata?.sections;
  if (Array.isArray(sectionsContainer)) {
    for (let sIdx = 0; sIdx < sectionsContainer.length; sIdx++) {
      const section = sectionsContainer[sIdx];
      if (!section || typeof section !== 'object') continue;

      let sectionPartName: 'Phần I' | 'Phần II' | 'Phần III' | undefined;
      const sName = (section.name || section.title || section.part || section.section || '').toString().toLowerCase();
      if (/1|i|trắc nghiệm|nhiều phương án|mcq/i.test(sName)) {
        sectionPartName = 'Phần I';
      } else if (/2|ii|đúng.*sai|tf|cluster/i.test(sName)) {
        sectionPartName = 'Phần II';
      } else if (/3|iii|ngắn|điền số|numeric/i.test(sName)) {
        sectionPartName = 'Phần III';
      } else {
        sectionPartName = sIdx === 0 ? 'Phần I' : sIdx === 1 ? 'Phần II' : 'Phần III';
      }

      const qItems = section.questions || section.items || section.list || section.question_list;
      if (Array.isArray(qItems)) {
        for (const item of qItems) {
          if (item && typeof item === 'object') {
            rawQuestions.push(item);
            detectedParts.push(sectionPartName);
          }
        }
      }
    }
  } else if (sectionsContainer && typeof sectionsContainer === 'object') {
    // Trường hợp sectionsContainer là object { part_1: [...], part_2: [...], part_3: [...] }
    const p1 = sectionsContainer.part_1 || sectionsContainer.part1 || sectionsContainer.phan_1;
    if (Array.isArray(p1)) {
      for (const item of p1) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần I');
        }
      }
    }
    const p2 = sectionsContainer.part_2 || sectionsContainer.part2 || sectionsContainer.phan_2;
    if (Array.isArray(p2)) {
      for (const item of p2) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần II');
        }
      }
    }
    const p3 = sectionsContainer.part_3 || sectionsContainer.part3 || sectionsContainer.phan_3;
    if (Array.isArray(p3)) {
      for (const item of p3) {
        if (item && typeof item === 'object') {
          rawQuestions.push(item);
          detectedParts.push('Phần III');
        }
      }
    }
  }

  return { rawQuestions, detectedParts };
}

/**
 * Chuẩn hóa kiểu câu hỏi (Question Type Normalization)
 */
function normalizeQuestionType(
  rawQ: any, 
  detectedSectionPart: string | undefined, 
  index: number
): { type: QuestionType; part: 'Phần I' | 'Phần II' | 'Phần III' } {
  const rawType = (rawQ.type || rawQ.question_type || rawQ.questionType || '').toString().toLowerCase().trim();
  const rawPart = (rawQ.part || rawQ.section || detectedSectionPart || '').toString().toLowerCase().trim();

  // 1. Kiểm tra dấu hiệu Phần III (Trả lời ngắn - short_answer)
  const isPart3Signal = 
    rawType === 'part_3' || rawType === 'part3' || rawType === 'tra_loi_ngan' || rawType === 'sa' || 
    rawType === 'short_answer' || rawType === 'short-answer' || rawType === 'numeric' || rawType === 'fill_in_the_blank' ||
    /(?:^|\b)(?:3|iii|part_3|part3|phan_3|phan3)(?:\b|$)/i.test(rawPart) ||
    /trả\s*lời\s*ngắn|điền\s*số/i.test(rawPart);

  // 2. Kiểm tra dấu hiệu Phần II (Đúng/Sai - true_false_cluster)
  const isPart2Signal = 
    rawType === 'part_2' || rawType === 'part2' || rawType === 'dung_sai' || rawType === 'tf' || 
    rawType === 'true_false' || rawType === 'true-false' || rawType === 'true_false_cluster' || rawType === 'cluster' ||
    (/(?:^|\b)(?:2|ii|part_2|part2|phan_2|phan2)(?:\b|$)/i.test(rawPart) && !/(?:3|iii)/i.test(rawPart)) ||
    /đúng\s*[\/-]?\s*sai/i.test(rawPart);

  // 3. Kiểm tra dấu hiệu Phần I (Trắc nghiệm nhiều lựa chọn - multiple_choice)
  const isPart1Signal = 
    rawType === 'part_1' || rawType === 'part1' || rawType === 'trac_nghiem' || rawType === 'mcq' || 
    rawType === 'multiple_choice' || rawType === 'multiple-choice' || rawType === 'choice' || rawType === 'single_choice' ||
    (/(?:^|\b)(?:1|i|part_1|part1|phan_1|phan1)(?:\b|$)/i.test(rawPart) && !/(?:2|ii|3|iii)/i.test(rawPart)) ||
    /trắc\s*nghiệm/i.test(rawPart);

  // 4. Kiểm tra cấu trúc thuộc tính thực tế (Feature-based detection)
  const hasStatements = Boolean(rawQ.statements || rawQ.items || rawQ.sub_questions || rawQ.menh_de || (rawQ.a && rawQ.b));
  const hasOptions = Boolean(rawQ.options || (rawQ.A && rawQ.B) || rawQ.choices);
  const hasNumericAnswer = rawQ.correctValue !== undefined || rawQ.correct_value !== undefined || 
                          rawQ.acceptedUnits !== undefined || rawQ.unitHint !== undefined || 
                          (rawQ.value !== undefined && !hasOptions && !hasStatements);

  if (isPart3Signal || (hasNumericAnswer && !hasOptions && !hasStatements)) {
    return { type: 'short_answer', part: 'Phần III' };
  }

  if (isPart2Signal || hasStatements) {
    return { type: 'true_false_cluster', part: 'Phần II' };
  }

  if (isPart1Signal || hasOptions) {
    return { type: 'multiple_choice', part: 'Phần I' };
  }

  // Nếu không có dấu hiệu rõ ràng, suy luận dựa trên cấu trúc các trường
  if (rawQ.correctAnswer && (rawQ.correctAnswer === 'A' || rawQ.correctAnswer === 'B' || rawQ.correctAnswer === 'C' || rawQ.correctAnswer === 'D')) {
    return { type: 'multiple_choice', part: 'Phần I' };
  }

  // Mặc định phân vào Phần I
  return { type: 'multiple_choice', part: 'Phần I' };
}

/**
 * Chuẩn hóa sơ đồ hình ảnh / SVG
 * Sử dụng bộ nhận diện đa tầng resolveQuestionDiagram:
 * q.diagram, q.image, q.figure, q.image_url, q.img_url, q.base64, q.image_base64,
 * q.media, q.chart, q.illustration, q.attachment, q.data_image (kể cả lồng nhau).
 */
function extractDiagram(rawQ: any): DiagramData | undefined {
  return resolveQuestionDiagram(rawQ);
}

/**
 * Chuẩn hóa phần giải thích chi tiết
 */
function normalizeExplanation(rawQ: any, defaultAnswerText?: string): { overview: string; stepByStep: string[]; keyFormula?: string } {
  if (rawQ.explanation && typeof rawQ.explanation === 'object') {
    const ov = rawQ.explanation.overview || rawQ.explanation.text || rawQ.explanation.summary || defaultAnswerText || 'Hướng dẫn giải chi tiết:';
    let steps: string[] = [];
    if (Array.isArray(rawQ.explanation.stepByStep)) {
      steps = rawQ.explanation.stepByStep.map((s: any) => String(s));
    } else if (Array.isArray(rawQ.explanation.steps)) {
      steps = rawQ.explanation.steps.map((s: any) => String(s));
    } else if (typeof rawQ.explanation.stepByStep === 'string') {
      steps = [rawQ.explanation.stepByStep];
    }
    if (steps.length === 0) {
      steps = ['Áp dụng kiến thức và công thức Vật lí tương ứng để tính toán hoặc suy luận.'];
    }
    return {
      overview: convertTextToKaTeX(ov),
      stepByStep: steps.map(s => convertTextToKaTeX(s)),
      keyFormula: rawQ.explanation.keyFormula || rawQ.explanation.formula || undefined,
    };
  }

  if (typeof rawQ.explanation === 'string' && rawQ.explanation.trim().length > 0) {
    const converted = convertTextToKaTeX(rawQ.explanation.trim());
    return {
      overview: converted,
      stepByStep: [converted],
    };
  }

  // Lấy từ các tên trường khác: giai_thich, huong_dan, hdg, solution
  const altSol = rawQ.giai_thich || rawQ.huong_dan || rawQ.hdg || rawQ.solution || rawQ.hint;
  if (typeof altSol === 'string' && altSol.trim().length > 0) {
    const converted = convertTextToKaTeX(altSol.trim());
    return {
      overview: converted,
      stepByStep: [converted],
    };
  }

  return {
    overview: defaultAnswerText || 'Hướng dẫn giải chi tiết cho câu hỏi.',
    stepByStep: ['Áp dụng kiến thức và công thức Vật lí liên quan để hoàn thành bài toán.']
  };
}

/**
 * Chuẩn hóa 1 câu hỏi Trắc nghiệm Phần I
 */
function normalizeMultipleChoiceQuestion(
  rawQ: any, 
  index: number, 
  warnings: string[]
): MultipleChoiceQuestion {
  const stem = convertTextToKaTeX(rawQ.stem || rawQ.content || rawQ.question || rawQ.text || rawQ.prompt || `Nội dung câu hỏi ${index + 1}`);
  const title = rawQ.title || rawQ.name || `Câu ${index + 1}`;
  
  // Xác định chủ đề
  let topic: PhysicsTopic = 'Dao động & Sóng cơ';
  if (rawQ.topic && VALID_TOPICS.includes(rawQ.topic)) {
    topic = rawQ.topic;
  } else {
    topic = detectPhysicsTopic(stem);
  }

  // Chuẩn hóa phương án A, B, C, D
  let options: MultipleChoiceOption[] = [];
  const rawOpts = rawQ.options || rawQ.choices || rawQ.answers;

  if (Array.isArray(rawOpts)) {
    options = rawOpts.map((opt, optIdx) => {
      const defaultId = ['A', 'B', 'C', 'D'][optIdx] || `Opt${optIdx + 1}`;
      if (typeof opt === 'string') {
        // Tách nhãn nếu có dạng "A. Con lắc..."
        const match = opt.match(/^([A-D])[\.\:\)]\s*(.*)$/);
        if (match) {
          return { id: match[1].toUpperCase(), text: convertTextToKaTeX(match[2].trim()) };
        }
        return { id: defaultId, text: convertTextToKaTeX(opt.trim()) };
      }
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: (opt.id || opt.label || opt.key || defaultId).toString().toUpperCase(),
          text: convertTextToKaTeX((opt.text || opt.content || opt.value || '').toString().trim()),
        };
      }
      return { id: defaultId, text: '' };
    });
  } else if (rawOpts && typeof rawOpts === 'object') {
    // Dạng { A: "...", B: "...", C: "...", D: "..." }
    for (const key of ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd']) {
      if (rawOpts[key] !== undefined) {
        options.push({
          id: key.toUpperCase(),
          text: convertTextToKaTeX(String(rawOpts[key]).trim()),
        });
      }
    }
  } else if (rawQ.A || rawQ.B || rawQ.C || rawQ.D) {
    for (const key of ['A', 'B', 'C', 'D']) {
      if (rawQ[key] !== undefined) {
        options.push({
          id: key,
          text: convertTextToKaTeX(String(rawQ[key]).trim()),
        });
      }
    }
  }

  // Đảm bảo có tối thiểu 4 phương án
  const defaultKeys = ['A', 'B', 'C', 'D'];
  for (let k = 0; k < 4; k++) {
    const key = defaultKeys[k];
    if (!options.some(o => o.id === key)) {
      options.push({ id: key, text: `Phương án ${key}` });
    }
  }
  // Giữ thứ tự A, B, C, D
  options.sort((a, b) => a.id.localeCompare(b.id));

  // Nhận diện đáp án đúng
  const rawAns = (rawQ.correctAnswer || rawQ.correct_answer || rawQ.answer || rawQ.key || rawQ.dap_an || '').toString().toUpperCase().trim();
  let correctAnswer = 'A';
  let needsReview = false;

  if (['A', 'B', 'C', 'D'].includes(rawAns)) {
    correctAnswer = rawAns;
  } else {
    // Thử tìm trong các phương án có cờ isCorrect / correct / is_true
    if (Array.isArray(rawOpts)) {
      const correctOpt = rawOpts.find((o: any) => o && (o.isCorrect || o.is_correct || o.correct));
      if (correctOpt) {
        correctAnswer = (correctOpt.id || correctOpt.label || 'A').toString().toUpperCase();
      } else {
        needsReview = true;
        warnings.push(`${title}: Chưa phát hiện rõ đáp án đúng (tự động chọn 'A' và gắn cờ cần rà soát).`);
      }
    } else {
      needsReview = true;
      warnings.push(`${title}: Chưa phát hiện rõ đáp án đúng (tự động chọn 'A' và gắn cờ cần rà soát).`);
    }
  }

  return {
    id: rawQ.id || `q-${index + 1}-mcq`,
    type: 'multiple_choice',
    part: 'Phần I',
    topic,
    title,
    points: typeof rawQ.points === 'number' ? rawQ.points : 0.25,
    stem,
    diagram: extractDiagram(rawQ),
    options,
    correctAnswer: correctAnswer as 'A' | 'B' | 'C' | 'D',
    needs_review: rawQ.needs_review !== undefined ? Boolean(rawQ.needs_review) : needsReview,
    explanation: normalizeExplanation(rawQ, `Đáp án đúng là ${correctAnswer}.`),
  };
}

/**
 * Chuẩn hóa 1 câu hỏi Đúng/Sai Phần II
 */
function normalizeTrueFalseQuestion(
  rawQ: any, 
  index: number, 
  warnings: string[]
): TrueFalseClusterQuestion {
  const stem = convertTextToKaTeX(rawQ.stem || rawQ.content || rawQ.question || rawQ.text || rawQ.prompt || `Nội dung câu hỏi ${index + 1}`);
  const title = rawQ.title || rawQ.name || `Câu ${index + 1}`;
  
  let topic: PhysicsTopic = 'Nhiệt học & Thuyết động học';
  if (rawQ.topic && VALID_TOPICS.includes(rawQ.topic)) {
    topic = rawQ.topic;
  } else {
    topic = detectPhysicsTopic(stem);
  }

  // Thu thập 4 mệnh đề a, b, c, d
  const rawItems = rawQ.items || rawQ.statements || rawQ.sub_questions || rawQ.menh_de || rawQ.sub_items;
  let items: TrueFalseItem[] = [];

  const parseBooleanVal = (val: any): boolean | undefined => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val === 1;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (['true', 'đúng', 'dung', 'đ', 't', '1', 'yes'].includes(s)) return true;
      if (['false', 'sai', 's', 'f', '0', 'no'].includes(s)) return false;
    }
    return undefined;
  };

  if (Array.isArray(rawItems)) {
    items = rawItems.map((it, itIdx) => {
      const defaultId = ['a', 'b', 'c', 'd'][itIdx] || `item${itIdx + 1}`;
      if (typeof it === 'string') {
        const match = it.match(/^([a-d])[\.\:\)]\s*(.*)$/i);
        const stmt = match ? match[2].trim() : it.trim();
        const id = match ? match[1].toLowerCase() : defaultId;
        return {
          id,
          statement: convertTextToKaTeX(stmt),
          correctAnswer: false,
          explanation: `Nhận định ${id})`,
        };
      }
      if (typeof it === 'object' && it !== null) {
        const id = (it.id || it.label || it.key || defaultId).toString().toLowerCase();
        const stmt = (it.statement || it.text || it.content || it.menh_de || '').toString().trim();
        const parsedBool = parseBooleanVal(it.correctAnswer ?? it.correct_answer ?? it.isCorrect ?? it.is_correct ?? it.answer ?? it.value);
        return {
          id,
          statement: convertTextToKaTeX(stmt),
          correctAnswer: parsedBool !== undefined ? parsedBool : false,
          explanation: it.explanation ? convertTextToKaTeX(String(it.explanation)) : `Nhận định ${id})`,
        };
      }
      return { id: defaultId, statement: '', correctAnswer: false };
    });
  } else if (rawItems && typeof rawItems === 'object') {
    // Object dạng { a: { text: "...", is_true: true }, b: ... }
    for (const key of ['a', 'b', 'c', 'd']) {
      const it = rawItems[key];
      if (it !== undefined) {
        if (typeof it === 'object' && it !== null) {
          const parsedBool = parseBooleanVal(it.correctAnswer ?? it.correct_answer ?? it.isCorrect ?? it.is_true ?? it.answer);
          items.push({
            id: key,
            statement: convertTextToKaTeX((it.statement || it.text || it.content || '').toString().trim()),
            correctAnswer: parsedBool !== undefined ? parsedBool : false,
            explanation: it.explanation ? convertTextToKaTeX(String(it.explanation)) : `Nhận định ${key})`,
          });
        } else {
          items.push({
            id: key,
            statement: convertTextToKaTeX(String(it).trim()),
            correctAnswer: false,
            explanation: `Nhận định ${key})`,
          });
        }
      }
    }
  }

  // Đảm bảo đủ 4 mệnh đề a, b, c, d
  const defaultItemKeys = ['a', 'b', 'c', 'd'];
  for (let k = 0; k < 4; k++) {
    const key = defaultItemKeys[k];
    if (!items.some(it => it.id.toLowerCase() === key)) {
      items.push({
        id: key,
        statement: `Mệnh đề ${key}`,
        correctAnswer: false,
        explanation: `Nhận định ${key})`,
      });
    }
  }
  items.sort((a, b) => a.id.localeCompare(b.id));

  // Kiểm tra đáp án ở cấp độ câu hỏi (Question-level answer string hoặc correct_answers array)
  // Ví dụ: q.answer = "DDDS", q.answer = "Đ-Đ-Đ-S", q.answer = "TTTF", q.correct_answers = [true, true, true, false]
  const questionLevelAnswer = rawQ.answer ?? rawQ.correct_answer ?? rawQ.correctAnswer ?? rawQ.correct_answers ?? rawQ.dap_an ?? rawQ.answers;
  if (Array.isArray(questionLevelAnswer) && questionLevelAnswer.length >= 4) {
    questionLevelAnswer.slice(0, 4).forEach((val, idx) => {
      const parsedBool = parseBooleanVal(val);
      if (parsedBool !== undefined && items[idx]) {
        items[idx].correctAnswer = parsedBool;
      }
    });
  } else if (typeof questionLevelAnswer === 'string') {
    const cleanPattern = questionLevelAnswer.replace(/[\s\-,:\.]/g, '').toUpperCase();
    if (cleanPattern.length >= 4) {
      for (let idx = 0; idx < 4; idx++) {
        const char = cleanPattern[idx];
        if (['Đ', 'D', 'T', '1', 'Y'].includes(char)) {
          if (items[idx]) items[idx].correctAnswer = true;
        } else if (['S', 'F', '0', 'N'].includes(char)) {
          if (items[idx]) items[idx].correctAnswer = false;
        }
      }
    }
  }

  // Kiểm tra xem có bất kỳ đáp án nào được xác định rõ không
  const hasAnyDeterminedAnswer = items.some(it => it.correctAnswer === true) || 
    (typeof questionLevelAnswer === 'string' && questionLevelAnswer.trim().length > 0) ||
    Array.isArray(questionLevelAnswer);

  // Kiểm tra cờ needs_review
  let needsReview = rawQ.needs_review !== undefined ? Boolean(rawQ.needs_review) : false;
  if (!rawQ.items && !rawQ.statements) {
    needsReview = true;
    warnings.push(`${title}: Cần kiểm tra lại các nhận định Đúng/Sai.`);
  } else if (!hasAnyDeterminedAnswer) {
    needsReview = true;
    warnings.push(`${title}: Chưa xác định được đáp án Đúng/Sai cho các nhận định (cần rà soát).`);
  }

  return {
    id: rawQ.id || `q-${index + 1}-tf`,
    type: 'true_false_cluster',
    part: 'Phần II',
    topic,
    title,
    points: typeof rawQ.points === 'number' ? rawQ.points : 1.0,
    stem,
    diagram: extractDiagram(rawQ),
    items,
    needs_review: needsReview,
    explanation: normalizeExplanation(rawQ, `Phân tích chi tiết 4 mệnh đề của ${title}.`),
  };
}

/**
 * Chuẩn hóa 1 câu hỏi Trả lời ngắn Phần III
 */
function normalizeShortAnswerQuestion(
  rawQ: any, 
  index: number, 
  warnings: string[]
): ShortAnswerQuestion {
  const stem = convertTextToKaTeX(rawQ.stem || rawQ.content || rawQ.question || rawQ.text || rawQ.prompt || `Nội dung câu hỏi ${index + 1}`);
  const title = rawQ.title || rawQ.name || `Câu ${index + 1}`;
  
  let topic: PhysicsTopic = 'Vật lí hạt nhân & Hiện đại';
  if (rawQ.topic && VALID_TOPICS.includes(rawQ.topic)) {
    topic = rawQ.topic;
  } else {
    topic = detectPhysicsTopic(stem);
  }

  // Trích xuất giá trị đáp số
  const rawVal = rawQ.correctValue ?? rawQ.correct_value ?? rawQ.answer ?? rawQ.value ?? rawQ.result ?? rawQ.dap_so;
  let numericVal: number | string = 0;
  let detectedUnit = rawQ.unit || rawQ.unitHint || '';
  let needsReview = false;

  if (typeof rawVal === 'number') {
    numericVal = rawVal;
  } else if (typeof rawVal === 'string') {
    const trimmed = rawVal.trim().replace(',', '.');
    const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      numericVal = parseFloat(match[1]);
      if (!detectedUnit && match[2]) {
        detectedUnit = match[2].trim();
      }
    } else {
      numericVal = rawVal;
      needsReview = true;
      warnings.push(`${title}: Đáp án số học "${rawVal}" có định dạng đặc biệt, cần kiểm tra lại.`);
    }
  } else {
    needsReview = true;
    warnings.push(`${title}: Chưa nhận diện được giá trị đáp số trả lời ngắn.`);
  }

  const acceptedUnits = Array.isArray(rawQ.acceptedUnits)
    ? rawQ.acceptedUnits
    : detectedUnit
    ? [detectedUnit]
    : [];

  return {
    id: rawQ.id || `q-${index + 1}-sa`,
    type: 'short_answer',
    part: 'Phần III',
    topic,
    title,
    points: typeof rawQ.points === 'number' ? rawQ.points : 0.25,
    stem,
    diagram: extractDiagram(rawQ),
    correctValue: numericVal,
    tolerance: typeof rawQ.tolerance === 'number' ? rawQ.tolerance : 0.05,
    acceptedUnits,
    unitHint: detectedUnit || undefined,
    placeholder: rawQ.placeholder || (detectedUnit ? `ví dụ: ${numericVal} ${detectedUnit}` : `ví dụ: ${numericVal}`),
    needs_review: rawQ.needs_review !== undefined ? Boolean(rawQ.needs_review) : needsReview,
    explanation: normalizeExplanation(rawQ, `Kết quả tính toán: ${numericVal} ${detectedUnit}`.trim()),
  };
}

/**
 * Trình phân tích & Chuẩn hóa cấu trúc đề thi siêu thích ứng (Adaptive Exam Normalizer)
 * - Tự động thích ứng với cấu trúc JSON thống nhất hoặc phân vùng (part_1, part_2, part_3, sections...)
 * - Tự động trích xuất tiêu đề từ nhiều vị trí hoặc gán mặc định an toàn.
 * - Chuẩn hóa các kiểu câu hỏi Vật lí GDPT 2018.
 * - Chỉ từ chối nếu không tìm thấy bất kỳ câu hỏi nào.
 */
export function validateAndNormalizeExamJson(input: unknown): NormalizeExamResult {
  const warnings: string[] = [];
  let data: any = input;

  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (err: any) {
      throw new Error(`Cú pháp JSON không hợp lệ: ${err.message || 'Lỗi cú pháp'}`);
    }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Dữ liệu tải lên phải là một đối tượng JSON hoặc danh sách câu hỏi hợp lệ.');
  }

  // 1. Trích xuất tiêu đề linh hoạt
  const title = extractTitle(data);

  // 2. Thu thập câu hỏi linh hoạt từ nhiều định dạng cấu trúc
  const { rawQuestions, detectedParts } = aggregateQuestions(data);

  if (!rawQuestions || rawQuestions.length === 0) {
    throw new Error('Không tìm thấy câu hỏi nào trong dữ liệu đề thi. Vui lòng kiểm tra lại cấu trúc JSON (cần có mảng "questions", các phần "part_1", "part_2", "part_3" hoặc "sections").');
  }

  // 3. Trích xuất các trường siêu dữ liệu khác
  const meta = (data.metadata && typeof data.metadata === 'object') ? data.metadata : {};
  const examSub = (data.exam && typeof data.exam === 'object') ? data.exam : {};

  const rawDuration = data.durationMinutes ?? data.duration_minutes ?? data.duration ?? 
                      data.time_limit ?? data.thoi_gian ?? meta.duration_minutes ?? 
                      meta.durationMinutes ?? meta.duration ?? examSub.durationMinutes;
  const durationMinutes = (typeof rawDuration === 'number' && rawDuration > 0) 
    ? rawDuration 
    : parseInt(String(rawDuration), 10) || (rawQuestions.length > 20 ? 50 : 45);

  const rawGrade = data.gradeLevel ?? data.grade_level ?? data.grade ?? data.lop ?? 
                   meta.grade ?? meta.grade_level ?? meta.lop ?? examSub.gradeLevel;
  let gradeLevel = 'Lớp 12 (Chương trình GDPT 2018)';
  if (rawGrade) {
    const sGrade = String(rawGrade).trim();
    if (sGrade === '10' || sGrade.includes('10')) gradeLevel = 'Lớp 10 (Chương trình GDPT 2018)';
    else if (sGrade === '11' || sGrade.includes('11')) gradeLevel = 'Lớp 11 (Chương trình GDPT 2018)';
    else if (sGrade === '12' || sGrade.includes('12')) gradeLevel = 'Lớp 12 (Chương trình GDPT 2018)';
    else gradeLevel = sGrade;
  }

  const code = (data.code || data.exam_code || data.ma_de || meta.code || meta.ma_de || examSub.code || '101').toString().trim();
  const subject = (data.subject || data.mon_hoc || meta.subject || meta.mon_hoc || 'Vật lí').toString().trim();
  const curriculum = (data.curriculum || data.chuong_trinh || meta.curriculum || 'GDPT 2018').toString().trim();
  
  const subtitle = (data.subtitle || data.sub_title || data.mo_ta || meta.subtitle || examSub.subtitle || 
    `Đề kiểm tra trắc nghiệm môn ${subject} - ${curriculum} (${gradeLevel})`).toString().trim();

  const instructions: string[] = Array.isArray(data.instructions)
    ? data.instructions
    : Array.isArray(meta.instructions)
    ? meta.instructions
    : [
        'Phần I gồm các câu hỏi trắc nghiệm nhiều phương án lựa chọn (chọn 1 phương án đúng).',
        'Phần II gồm các câu hỏi trắc nghiệm Đúng/Sai (mỗi câu gồm 4 ý a, b, c, d).',
        'Phần III gồm các câu hỏi trắc nghiệm trả lời ngắn (điền kết quả số học kèm đơn vị).'
      ];

  const totalPoints = typeof data.totalPoints === 'number'
    ? data.totalPoints
    : typeof data.total_points === 'number'
    ? data.total_points
    : 10;

  // 4. Chuẩn hóa từng câu hỏi và đếm thống kê
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;
  const questions: Question[] = [];

  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const rawQ = rawQuestions[idx];
    const detectedPart = detectedParts[idx];
    const { type, part } = normalizeQuestionType(rawQ, detectedPart, idx);

    if (type === 'multiple_choice') {
      part1Count++;
      questions.push(normalizeMultipleChoiceQuestion(rawQ, idx, warnings));
    } else if (type === 'true_false_cluster') {
      part2Count++;
      questions.push(normalizeTrueFalseQuestion(rawQ, idx, warnings));
    } else {
      part3Count++;
      questions.push(normalizeShortAnswerQuestion(rawQ, idx, warnings));
    }
  }

  const exam: Exam = {
    id: data.id || examSub.id || `exam-${Date.now()}`,
    code,
    title,
    subtitle,
    gradeLevel,
    durationMinutes,
    totalPoints,
    instructions,
    questions,
  };

  return {
    exam,
    summary: {
      title,
      totalQuestions: questions.length,
      part1Count,
      part2Count,
      part3Count,
      warnings,
    },
  };
}
