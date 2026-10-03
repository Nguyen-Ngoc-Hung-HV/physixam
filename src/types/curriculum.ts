export type GradeLevel = 10 | 11 | 12;

export type ExamCategory = 
  | 'all'
  | 'lesson'      // Luyện tập theo Bài
  | 'chapter'     // Đánh giá theo Chương
  | 'midterm1'    // Kiểm tra Giữa Học kỳ I (GHK1)
  | 'final1'      // Kiểm tra Cuối Học kỳ I (CHK1)
  | 'midterm2'    // Kiểm tra Giữa Học kỳ II (GHK2)
  | 'final2'      // Kiểm tra Cuối Học kỳ II (CHK2)
  | 'survey';     // Khảo sát chất lượng / Thi thử Tốt nghiệp THPT

export interface CurriculumLesson {
  id: string;
  lessonNumber: number | string;
  title: string;
  suggestedDurationMinutes?: number;
}

export interface CurriculumChapter {
  id: string;
  chapterNumber: string; // ví dụ: "Chương I", "Chương 1"
  title: string;
  grade: GradeLevel;
  lessons: CurriculumLesson[];
}

export interface ExamAssignmentInfo {
  id: string;
  examId: string;
  examCode: string;
  examTitle: string;
  grade: GradeLevel;
  className: string;
  assignedAt: string;
  deadline: string;
  accessCode: string;
  shareUrl?: string;
  antiCheatEnabled: boolean;
  requireFullscreen: boolean;
  maxViolations: number;
  preventCopyAndShortcuts: boolean;
  status: 'active' | 'closed';
  submissionCount?: number;
}

import { Exam } from './exam';

export interface ExamPackage {
  id: string;
  grade: GradeLevel;
  category: ExamCategory;
  categoryLabel: string;
  chapterId: string;
  chapterTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  code: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  totalPoints: number;
  difficulty: 'Cơ bản' | 'Thông hiểu' | 'Vận dụng' | 'Chuẩn Bộ GD&ĐT';
  tags: string[];
  svgCount: number;
  katexCount: number;
  examData: Exam;
  createdAt: string;
  assignment?: ExamAssignmentInfo;
}
