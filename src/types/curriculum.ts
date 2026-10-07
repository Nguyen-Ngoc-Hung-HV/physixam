import { Exam } from './exam';

export type GradeLevel = 10 | 11 | 12 | '10' | '11' | '12';

export type ExamCategory = 
  | 'lesson_quiz' 
  | 'mid_term_1' 
  | 'final_term_1' 
  | 'mid_term_2' 
  | 'final_term_2' 
  | 'survey' 
  | 'gifted' 
  | 'custom';

export interface CurriculumLesson {
  id: string;
  title: string;
  order: number;
  description?: string;
  lessonCode?: string;
}

export interface CurriculumChapter {
  id: string;
  grade: GradeLevel;
  title: string;
  order: number;
  description?: string;
  lessons: CurriculumLesson[];
}

export interface ExamPackage {
  id: string;
  grade: GradeLevel;
  category: ExamCategory;
  categoryLabel?: string;
  chapterId: string;
  chapterTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  code: string;
  title: string;
  subtitle?: string;
  durationMinutes: number;
  totalPoints: number;
  difficulty: string;
  tags: string[];
  svgCount: number;
  katexCount: number;
  createdAt: string;
  examData: Exam;
  description?: string;
}

export interface CurriculumTopic {
  id: string;
  grade: GradeLevel;
  name: string;
  description: string;
  examPackages: ExamPackage[];
}

export interface ExamAssignmentInfo {
  id: string;
  examId: string;
  examTitle: string;
  examCode: string;
  grade: GradeLevel;
  className: string;
  assignedAt: string;
  openTime?: string;
  deadline: string;
  accessCode: string;
  antiCheatEnabled: boolean;
  requireFullscreen: boolean;
  maxViolations: number;
  preventCopyAndShortcuts: boolean;
  shuffleQuestions?: boolean;
  status: 'active' | 'closed';
}