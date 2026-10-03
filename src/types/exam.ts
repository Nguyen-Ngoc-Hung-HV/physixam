export type QuestionType = 'multiple_choice' | 'true_false_cluster' | 'short_answer';

export type CognitiveLevel = 'NB' | 'TH' | 'VD' | 'VDC';

export type PhysicsTopic = 
  | 'Cơ học & Động lực học' 
  | 'Dao động & Sóng cơ' 
  | 'Điện từ học & Mạch điện xoay chiều' 
  | 'Nhiệt học & Thuyết động học' 
  | 'Quang học & Sóng ánh sáng' 
  | 'Vật lí hạt nhân & Hiện đại';

export interface DiagramData {
  type: 'svg' | 'image';
  content?: string; // SVG raw string or Image URL
  url?: string; // External web image URL
  caption?: string;
  altText?: string;
  aspectRatio?: string;
}

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  topic: PhysicsTopic;
  part: 'Phần I' | 'Phần II' | 'Phần III';
  title: string;
  stem: string; // Markdown/KaTeX text
  diagram?: DiagramData;
  points: number;
  level?: CognitiveLevel | string;
  cognitive_level?: CognitiveLevel | string;
  difficulty?: string;
  explanation: {
    overview: string;
    stepByStep: string[];
    keyFormula?: string;
  };
  needs_review?: boolean;
}

export interface MultipleChoiceOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
}

export interface TrueFalseItem {
  id: string; // 'a' | 'b' | 'c' | 'd'
  statement: string;
  correctAnswer: boolean;
  level?: CognitiveLevel | string;
  cognitive_level?: CognitiveLevel | string;
  difficulty?: string;
  explanation?: string;
}

export interface TrueFalseClusterQuestion extends BaseQuestion {
  type: 'true_false_cluster';
  items: TrueFalseItem[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  correctValue: number | string;
  tolerance?: number;
  acceptedUnits: string[];
  unitHint?: string;
  placeholder?: string;
}

export type Question = MultipleChoiceQuestion | TrueFalseClusterQuestion | ShortAnswerQuestion;

export interface Exam {
  id: string;
  code?: string; // Ví dụ: '101', '102', 'Gốc'
  title: string;
  subtitle: string;
  gradeLevel: string;
  durationMinutes: number;
  totalPoints: number;
  instructions: string[];
  questions: Question[];
}

export interface ShufflingOptions {
  numberOfVariants: number; // 2, 4, 8...
  startingCode: number; // 101, 201...
  shuffleQuestionsWithinParts: boolean;
  shuffleOptionsPart1: boolean;
  shuffleStatementsPart2: boolean;
}

export interface AnswerKeyMatrixRow {
  originalIndex: number;
  part: 'Phần I' | 'Phần II' | 'Phần III';
  questionId: string;
  title: string;
  topic: string;
  answersByCode: { [code: string]: string }; // mã đề -> đáp án tóm tắt ('A', 'Đ-S-Đ-S', '6.21')
}

export interface ExamVariantBundle {
  originalExamId: string;
  originalExam: Exam;
  variants: Exam[];
  matrix: AnswerKeyMatrixRow[];
  generatedAt: string;
}

export type StudentAnswers = {
  [questionId: string]: 
    | string // for multiple_choice ('A')
    | { [subItemId: string]: boolean } // for true_false_cluster ({ a: true, b: false })
    | { value: string; unit: string }; // for short_answer
};

export interface ViolationEvent {
  id: string;
  timestamp: string; // ví dụ: "14:32:05"
  reason: string;    // "Chuyển sang tab/cửa sổ khác", "Thoát toàn màn hình", etc.
}

export interface ExamAuditLog {
  violationCount: number;
  maxAllowedViolations: number;
  violations: ViolationEvent[];
  submissionReason: 'student_submitted' | 'violation_limit_exceeded' | 'time_expired';
  isFullscreenRequired: boolean;
  copyProtectionEnabled: boolean;
  totalTabExits: number;
}

export interface AntiCheatConfig {
  enabled: boolean;
  requireFullscreen: boolean;
  trackTabSwitching: boolean;
  maxViolations: number;
  preventCopyAndShortcuts: boolean;
}

export interface QuestionGradingResult {
  questionId: string;
  part: 'Phần I' | 'Phần II' | 'Phần III';
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  userAnswerSummary: string;
  correctAnswerSummary: string;
  detail: any;
}

export interface ExamEvaluation {
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  partScores: {
    [part: string]: { earned: number; max: number; percentage: number };
  };
  topicScores: {
    [topic: string]: { earned: number; max: number; percentage: number };
  };
  results: { [questionId: string]: QuestionGradingResult };
  submittedAt: string;
  auditLog?: ExamAuditLog;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentClass: string;
  candidateNumber: string;
  examTitle: string;
  examCode: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  submittedAt: string;
  submissionReason: 'student_submitted' | 'violation_limit_exceeded' | 'time_expired';
  violationCount: number;
  auditLog: ExamAuditLog;
  evaluation: ExamEvaluation;
  answers: StudentAnswers;
}
