/**
 * Thuật toán Trộn đề thi & Sinh bộ mã đề chuẩn hóa cho môn Vật lí THPT.
 * Đảm bảo:
 * - Bảo toàn 100% cấu trúc 3 Phần (Phần I, Phần II, Phần III).
 * - Cập nhật chính xác tuyệt đối bảng đáp án của từng mã đề.
 * - An toàn với các sơ đồ vector SVG, hình ảnh và công thức toán KaTeX.
 */

import { 
  Exam, Question, MultipleChoiceQuestion, 
  TrueFalseClusterQuestion, ShortAnswerQuestion, 
  ShufflingOptions, AnswerKeyMatrixRow, ExamVariantBundle 
} from '../types/exam';

const BUNDLE_STORAGE_KEY = 'physixam_exam_variants_bundle';

// Trình tạo số giả ngẫu nhiên có seed (Mulberry32)
function createPrng(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Xáo trộn mảng bằng thuật toán Fisher-Yates
export function shuffleArray<T>(array: T[], prng: () => number): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Trộn một đề thi thành một biến thể mã đề mới (ví dụ: '101', '102'...)
 */
export function generateExamVariant(
  originalExam: Exam,
  code: string,
  options: ShufflingOptions,
  variantIndex: number
): Exam {
  // Tạo seed duy nhất cho từng mã đề dựa trên id đề và mã đề
  const seedBase = originalExam.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const codeNum = parseInt(code, 10) || (101 + variantIndex);
  const prng = createPrng(seedBase * 1000 + codeNum * 31 + variantIndex * 97);

  // Tách câu hỏi theo 3 phần chuẩn hóa
  const part1Original = originalExam.questions.filter((q) => q.part === 'Phần I') as MultipleChoiceQuestion[];
  const part2Original = originalExam.questions.filter((q) => q.part === 'Phần II') as TrueFalseClusterQuestion[];
  const part3Original = originalExam.questions.filter((q) => q.part === 'Phần III') as ShortAnswerQuestion[];

  // 1. Xáo trộn thứ tự câu hỏi trong từng phần (nếu được bật)
  const part1Shuffled = options.shuffleQuestionsWithinParts 
    ? shuffleArray(part1Original, prng) 
    : [...part1Original];

  const part2Shuffled = options.shuffleQuestionsWithinParts 
    ? shuffleArray(part2Original, prng) 
    : [...part2Original];

  const part3Shuffled = options.shuffleQuestionsWithinParts 
    ? shuffleArray(part3Original, prng) 
    : [...part3Original];

  // 2. Xáo trộn phương án Phần I (A, B, C, D) và cập nhật đáp án đúng
  const part1Final: MultipleChoiceQuestion[] = part1Shuffled.map((q) => {
    if (!options.shuffleOptionsPart1 || !q.options || q.options.length < 2) {
      return { ...q, id: `${q.id}-v${code}` };
    }

    // Tìm văn bản của đáp án đúng ban đầu
    const correctOpt = q.options.find((o) => o.id === q.correctAnswer);
    const correctText = correctOpt ? correctOpt.text : q.options[0].text;

    // Xáo trộn mảng phương án
    const shuffledOptions = shuffleArray(q.options, prng);

    // Gán lại nhãn A, B, C, D tuần tự
    const newOptions = shuffledOptions.map((opt, idx) => ({
      id: ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx),
      text: opt.text,
    }));

    // Tìm xem phương án có văn bản đúng chuyển sang vị trí nào
    const newCorrectAnswer = newOptions.find((o) => o.text === correctText)?.id || 'A';

    return {
      ...q,
      id: `${q.id}-v${code}`,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    };
  });

  // 3. Xáo trộn 4 nhận định Phần II (a, b, c, d)
  const part2Final: TrueFalseClusterQuestion[] = part2Shuffled.map((q) => {
    if (!options.shuffleStatementsPart2 || !q.items || q.items.length < 2) {
      return { ...q, id: `${q.id}-v${code}` };
    }

    // Xáo trộn danh sách các nhận định
    const shuffledItems = shuffleArray(q.items, prng);

    // Gán lại nhãn a, b, c, d tuần tự
    const newItems = shuffledItems.map((item, idx) => ({
      ...item,
      id: ['a', 'b', 'c', 'd'][idx] || String.fromCharCode(97 + idx),
    }));

    return {
      ...q,
      id: `${q.id}-v${code}`,
      items: newItems,
    };
  });

  // 4. Phần III: Giữ nguyên các giá trị tính toán, chỉ đổi ID biến thể
  const part3Final: ShortAnswerQuestion[] = part3Shuffled.map((q) => ({
    ...q,
    id: `${q.id}-v${code}`,
  }));

  const allQuestions: Question[] = [...part1Final, ...part2Final, ...part3Final];

  return {
    ...originalExam,
    id: `${originalExam.id}-code-${code}`,
    code: code,
    title: originalExam.title,
    subtitle: `${originalExam.subtitle} • [Mã đề: ${code}]`,
    questions: allQuestions,
  };
}

/**
 * Lấy chuỗi tóm tắt đáp án chuẩn của một câu hỏi
 */
export function getQuestionAnswerSummary(q: Question): string {
  if (q.type === 'multiple_choice') {
    return q.correctAnswer;
  }
  if (q.type === 'true_false_cluster') {
    // Trả về định dạng: Đ-S-Đ-S
    return q.items.map((it) => (it.correctAnswer ? 'Đ' : 'S')).join('-');
  }
  if (q.type === 'short_answer') {
    return `${q.correctValue}${q.unitHint ? ` ${q.unitHint}` : ''}`;
  }
  return '';
}

/**
 * Xây dựng bảng ma trận đáp án cho toàn bộ các mã đề
 * Cung cấp dạng đối chiếu theo số thứ tự câu (Câu 1, Câu 2... của từng mã đề)
 */
export function buildAnswerMatrix(
  originalExam: Exam,
  variants: Exam[]
): AnswerKeyMatrixRow[] {
  const rows: AnswerKeyMatrixRow[] = [];
  const maxQuestions = originalExam.questions.length;

  for (let i = 0; i < maxQuestions; i++) {
    const origQ = originalExam.questions[i];
    const answersByCode: { [code: string]: string } = {};

    // Đáp án đề gốc
    answersByCode['Gốc'] = getQuestionAnswerSummary(origQ);

    // Đáp án của từng mã đề ở vị trí câu hỏi thứ i (Câu i của Mã 101, Câu i của Mã 102...)
    variants.forEach((v) => {
      const qInVariant = v.questions[i];
      if (qInVariant) {
        answersByCode[v.code || ''] = getQuestionAnswerSummary(qInVariant);
      }
    });

    rows.push({
      originalIndex: i + 1,
      part: origQ.part,
      questionId: origQ.id,
      title: origQ.title,
      topic: origQ.topic,
      answersByCode,
    });
  }

  return rows;
}

/**
 * Tạo trọn bộ các mã đề thi từ đề gốc
 */
export function generateExamBundle(
  originalExam: Exam,
  options: ShufflingOptions
): ExamVariantBundle {
  const variants: Exam[] = [];

  for (let i = 0; i < options.numberOfVariants; i++) {
    const code = String(options.startingCode + i);
    const variant = generateExamVariant(originalExam, code, options, i);
    variants.push(variant);
  }

  const matrix = buildAnswerMatrix(originalExam, variants);

  const bundle: ExamVariantBundle = {
    originalExamId: originalExam.id,
    originalExam,
    variants,
    matrix,
    generatedAt: new Date().toLocaleString('vi-VN'),
  };

  saveBundleToStorage(bundle);
  return bundle;
}

/**
 * Lưu bộ mã đề vào localStorage
 */
export function saveBundleToStorage(bundle: ExamVariantBundle): void {
  try {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
  } catch (e) {
    console.error('Không thể lưu bộ mã đề vào localStorage', e);
  }
}

/**
 * Đọc bộ mã đề đã lưu từ localStorage
 */
export function getSavedBundle(): ExamVariantBundle | null {
  try {
    const raw = localStorage.getItem(BUNDLE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Không thể đọc bộ mã đề từ localStorage', e);
    return null;
  }
}

/**
 * Tải bộ mã đề dưới dạng file JSON hoàn chỉnh
 */
export function exportBundleToJson(bundle: ExamVariantBundle): void {
  const exportData = {
    originalExamTitle: bundle.originalExam.title,
    generatedAt: bundle.generatedAt,
    variantCodes: bundle.variants.map((v) => v.code),
    matrix: bundle.matrix,
    variants: bundle.variants,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bo_Ma_De_Vat_Ly_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Xuất Bảng ma trận đáp án sang file CSV chuẩn UTF-8 BOM
 */
export function exportAnswerMatrixToCSV(bundle: ExamVariantBundle): void {
  const BOM = '\uFEFF';
  const codes = bundle.variants.map((v) => v.code || '');

  const lines: string[] = [
    `"BẢNG MA TRẬN ĐÁP ÁN TOÀN BỘ CÁC MÃ ĐỀ THI"`,
    `"Kỳ thi:","${bundle.originalExam.title.replace(/"/g, '""')}"`,
    `"Ngày tạo:","${bundle.generatedAt}"`,
    `"Các mã đề:","${codes.join(', ')}"`,
    '',
    // Tiêu đề các cột
    [
      `"Câu"`,
      `"Phần thi"`,
      `"Chủ đề"`,
      `"Đề gốc"`,
      ...codes.map((c) => `"Mã ${c}"`),
    ].join(','),
  ];

  bundle.matrix.forEach((row) => {
    const cols = [
      row.originalIndex,
      `"${row.part}"`,
      `"${row.topic.replace(/"/g, '""')}"`,
      `"${row.answersByCode['Gốc'] || ''}"`,
      ...codes.map((c) => `"${row.answersByCode[c] || ''}"`),
    ];
    lines.push(cols.join(','));
  });

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ma_Tran_Dap_An_Cac_Ma_De_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
