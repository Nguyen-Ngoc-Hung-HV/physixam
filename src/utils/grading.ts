import { Exam, StudentAnswers, ExamEvaluation, QuestionGradingResult, MultipleChoiceQuestion, TrueFalseClusterQuestion, ShortAnswerQuestion } from '../types/exam';

/**
 * Thuật toán chấm điểm chuẩn kì thi tốt nghiệp THPT từ năm 2025 của Bộ GD&ĐT:
 * - Phần I (Trắc nghiệm nhiều lựa chọn): Mỗi câu đúng được 0.25 điểm.
 * - Phần II (Trắc nghiệm Đúng/Sai lũy tiến theo từng câu):
 *   + Đúng 1 ý: 0.10 điểm
 *   + Đúng 2 ý: 0.25 điểm
 *   + Đúng 3 ý: 0.50 điểm
 *   + Đúng cả 4 ý: 1.00 điểm
 * - Phần III (Trắc nghiệm Trả lời ngắn): Mỗi câu đúng được 0.25 điểm.
 *   Xử lí linh hoạt dấu phẩy/chấm thập phân, số âm/dương, loại bỏ khoảng trắng và đơn vị đo nếu có.
 */
export function evaluateExam(
  exam: Exam,
  answers: StudentAnswers,
  timeSpentSeconds: number
): ExamEvaluation {
  let totalScore = 0;
  let maxScore = 0;

  const partScores: { [part: string]: { earned: number; max: number; percentage: number } } = {
    'Phần I': { earned: 0, max: 0, percentage: 0 },
    'Phần II': { earned: 0, max: 0, percentage: 0 },
    'Phần III': { earned: 0, max: 0, percentage: 0 },
  };

  const topicScores: { [topic: string]: { earned: number; max: number; percentage: number } } = {};
  const results: { [questionId: string]: QuestionGradingResult } = {};

  for (const question of exam.questions) {
    const questionMaxPoint = question.points ?? (question.part === 'Phần II' ? 1.0 : 0.25);
    maxScore += questionMaxPoint;

    if (!partScores[question.part]) {
      partScores[question.part] = { earned: 0, max: 0, percentage: 0 };
    }
    partScores[question.part].max += questionMaxPoint;

    if (!topicScores[question.topic]) {
      topicScores[question.topic] = { earned: 0, max: 0, percentage: 0 };
    }
    topicScores[question.topic].max += questionMaxPoint;

    let earned = 0;
    let isCorrect = false;
    let isPartiallyCorrect = false;
    let userAnswerSummary = 'Chưa trả lời';
    let correctAnswerSummary = '';
    let detail: any = {};

    const rawAnswer = answers[question.id];

    // ================= PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN =================
    if (question.type === 'multiple_choice') {
      const mcq = question as MultipleChoiceQuestion;
      const userChoice = typeof rawAnswer === 'string' ? rawAnswer.trim().toUpperCase() : '';
      userAnswerSummary = userChoice ? `Phương án ${userChoice}` : 'Chưa trả lời';
      correctAnswerSummary = `Phương án ${mcq.correctAnswer.toUpperCase()}`;

      const pointPerQuestion = mcq.points ?? 0.25;

      if (userChoice && userChoice === mcq.correctAnswer.toUpperCase()) {
        earned = pointPerQuestion;
        isCorrect = true;
      }
      detail = { selected: userChoice, correct: mcq.correctAnswer, points: earned };
    } 
    // ================= PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (LŨY TIẾN) =================
    else if (question.type === 'true_false_cluster') {
      const tfq = question as TrueFalseClusterQuestion;
      const userTf = (typeof rawAnswer === 'object' && rawAnswer !== null && !('value' in rawAnswer))
        ? (rawAnswer as { [subId: string]: boolean })
        : {};

      let correctCount = 0;
      const itemBreakdown: { [subId: string]: { user?: boolean; correct: boolean; match: boolean; explanation?: string } } = {};
      const userItemsList: string[] = [];
      const correctItemsList: string[] = [];

      for (const item of tfq.items) {
        const userVal = userTf[item.id];
        const isMatch = userVal !== undefined && userVal === item.correctAnswer;
        if (isMatch) correctCount++;

        itemBreakdown[item.id] = {
          user: userVal,
          correct: item.correctAnswer,
          match: isMatch,
          explanation: item.explanation
        };

        userItemsList.push(`${item.id}) ${userVal === undefined ? '—' : userVal ? 'Đ' : 'S'}`);
        correctItemsList.push(`${item.id}) ${item.correctAnswer ? 'Đ' : 'S'}`);
      }

      userAnswerSummary = userItemsList.join(' | ');
      correctAnswerSummary = correctItemsList.join(' | ');

      // Barem tính điểm chuẩn kì thi tốt nghiệp THPT từ năm 2025:
      // - Đúng 1 ý: 0.10 điểm
      // - Đúng 2 ý: 0.25 điểm
      // - Đúng 3 ý: 0.50 điểm
      // - Đúng 4 ý: 1.00 điểm
      let baremScore = 0;
      if (correctCount === 1) baremScore = 0.10;
      else if (correctCount === 2) baremScore = 0.25;
      else if (correctCount === 3) baremScore = 0.50;
      else if (correctCount === 4) baremScore = 1.00;

      // Hỗ trợ tỉ lệ nếu đề thi có gán question.points khác 1.0
      const basePoint = tfq.points ?? 1.0;
      earned = Number((basePoint === 1.0 ? baremScore : basePoint * baremScore).toFixed(2));
      
      isCorrect = correctCount === tfq.items.length;
      isPartiallyCorrect = correctCount > 0 && !isCorrect;

      detail = { 
        correctCount, 
        totalCount: tfq.items.length, 
        itemBreakdown,
        baremScore: earned
      };
    } 
    // ================= PHẦN III: TRẢ LỜI NGẮN (LINH HOẠT ĐƠN VỊ VÀ DẤU PHẨY) =================
    else if (question.type === 'short_answer') {
      const saq = question as ShortAnswerQuestion;
      const userObj = (typeof rawAnswer === 'object' && rawAnswer !== null && 'value' in rawAnswer)
        ? (rawAnswer as { value: string; unit: string })
        : { value: '', unit: '' };

      const userText = userObj.value.trim();
      const userUnit = userObj.unit.trim();
      userAnswerSummary = userText ? `${userText} ${userUnit}`.trim() : 'Chưa trả lời';
      
      const primaryUnit = saq.acceptedUnits?.[0] || saq.unitHint || '';
      correctAnswerSummary = `${saq.correctValue} ${primaryUnit}`.trim();

      const pointPerQuestion = saq.points ?? 0.25;

      if (userText) {
        // Chuẩn hóa chuỗi nhập:
        // 1. Thay thế dấu phẩy thập phân kiểu Việt Nam ',' thành '.'
        // 2. Tách số và loại bỏ đơn vị đính kèm (ví dụ: '1296 J' -> '1296', '-3.5 m/s' -> '-3.5')
        const normalizedInput = userText.replace(',', '.').replace(/\s+/g, '');
        
        // Regex tìm số thực có dấu (+/-), phần thập phân và số mũ khoa học (e.g. 1.25e-4)
        const match = normalizedInput.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/);
        
        if (match) {
          const userNum = parseFloat(match[0]);
          const expectedNum = typeof saq.correctValue === 'number'
            ? saq.correctValue
            : parseFloat(String(saq.correctValue).replace(',', '.'));

          // Kiểm tra dung sai sai số (tolerance, mặc định 3%)
          const tolerance = saq.tolerance ?? 0.03;
          const allowedDiff = Math.abs(expectedNum) > 0 
            ? Math.abs(expectedNum * tolerance) 
            : 0.01;
            
          const isNumCorrect = Math.abs(userNum - expectedNum) <= (allowedDiff + 1e-5);

          if (isNumCorrect) {
            earned = pointPerQuestion;
            isCorrect = true;
          }
          detail = { userNum, expectedNum, isNumCorrect };
        }
      }
      detail = { ...detail, rawInput: userText, unit: userUnit };
    }

    totalScore += earned;
    partScores[question.part].earned += earned;
    topicScores[question.topic].earned += earned;

    results[question.id] = {
      questionId: question.id,
      part: question.part,
      earnedPoints: earned,
      maxPoints: questionMaxPoint,
      isCorrect,
      isPartiallyCorrect,
      userAnswerSummary,
      correctAnswerSummary,
      detail,
    };
  }

  // Làm tròn và tính phần trăm
  Object.keys(partScores).forEach((part) => {
    const p = partScores[part];
    p.earned = Number(p.earned.toFixed(2));
    p.max = Number(p.max.toFixed(2));
    p.percentage = p.max > 0 ? Math.round((p.earned / p.max) * 100) : 0;
  });

  Object.keys(topicScores).forEach((topic) => {
    const t = topicScores[topic];
    t.earned = Number(t.earned.toFixed(2));
    t.max = Number(t.max.toFixed(2));
    t.percentage = t.max > 0 ? Math.round((t.earned / t.max) * 100) : 0;
  });

  return {
    totalScore: Number(totalScore.toFixed(2)),
    maxScore: Number(maxScore.toFixed(2)),
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    timeSpentSeconds,
    partScores,
    topicScores,
    results,
    submittedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
