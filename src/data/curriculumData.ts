import { CurriculumChapter, ExamPackage, GradeLevel, ExamCategory } from '../types/curriculum';
import { samplePhysicsExam } from './sampleExams';
import { Exam } from '../types/exam';
import { safeStorage } from '../utils/safeStorage';

// =========================================================================
// HỆ THỐNG CÂY THƯ MỤC CHƯƠNG TRÌNH VẬT LÍ GDPT 2018 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
// =========================================================================

export const CURRICULUM_CHAPTERS: CurriculumChapter[] = [
  // -------------------------------------------------------------
  // KHỐI 10 (LỚP 10)
  // -------------------------------------------------------------
  {
    id: '10-c1',
    chapterNumber: 'Chương I',
    title: 'Mở đầu',
    grade: 10,
    lessons: [
      { id: '10-b1', lessonNumber: 1, title: 'Bài 1: Làm quen với Vật lí' },
      { id: '10-b2', lessonNumber: 2, title: 'Bài 2: Vấn đề an toàn trong Vật lí' },
      { id: '10-b3', lessonNumber: 3, title: 'Bài 3: Thực hành tính sai số trong phép đo. Ghi kết quả đo' }
    ]
  },
  {
    id: '10-c2',
    chapterNumber: 'Chương II',
    title: 'Động học',
    grade: 10,
    lessons: [
      { id: '10-b4', lessonNumber: 4, title: 'Bài 4: Độ dịch chuyển và quãng đường đi được' },
      { id: '10-b5', lessonNumber: 5, title: 'Bài 5: Tốc độ và vận tốc' },
      { id: '10-b6', lessonNumber: 6, title: 'Bài 6: Thực hành: Đo tốc độ của vật chuyển động' },
      { id: '10-b7', lessonNumber: 7, title: 'Bài 7: Đồ thị độ dịch chuyển - thời gian' },
      { id: '10-b8', lessonNumber: 8, title: 'Bài 8: Chuyển động biến đổi. Gia tốc' },
      { id: '10-b9', lessonNumber: 9, title: 'Bài 9: Chuyển động thẳng biến đổi đều' },
      { id: '10-b10', lessonNumber: 10, title: 'Bài 10: Sự rơi tự do' },
      { id: '10-b11', lessonNumber: 11, title: 'Bài 11: Thực hành: Đo gia tốc rơi tự do' },
      { id: '10-b12', lessonNumber: 12, title: 'Bài 12: Chuyển động ném' },
      { id: '10-rev-mid1', lessonNumber: 'Ôn tập', title: 'Ôn tập giữa kì I' }
    ]
  },
  {
    id: '10-c3',
    chapterNumber: 'Chương III',
    title: 'Động lực học',
    grade: 10,
    lessons: [
      { id: '10-b13', lessonNumber: 13, title: 'Bài 13: Tổng hợp và phân tích lực. Cân bằng lực' },
      { id: '10-b14', lessonNumber: 14, title: 'Bài 14: Định luật 1 Newton' },
      { id: '10-b15', lessonNumber: 15, title: 'Bài 15: Định luật 2 Newton' },
      { id: '10-b16', lessonNumber: 16, title: 'Bài 16: Định luật 3 Newton' },
      { id: '10-b17', lessonNumber: 17, title: 'Bài 17: Trọng lực và lực căng' },
      { id: '10-b18', lessonNumber: 18, title: 'Bài 18: Lực ma sát' },
      { id: '10-b19', lessonNumber: 19, title: 'Bài 19: Lực cản và lực nâng' },
      { id: '10-b20', lessonNumber: 20, title: 'Bài 20: Một số ví dụ về cách giải các bài toán thuộc phần động lực học' },
      { id: '10-b21', lessonNumber: 21, title: 'Bài 21: Moment lực. Cân bằng của vật rắn' },
      { id: '10-b22', lessonNumber: 22, title: 'Bài 22: Thực hành: Tổng hợp hai lực song song cùng chiều' },
      { id: '10-rev-final1', lessonNumber: 'Ôn tập', title: 'Ôn tập cuối kì I' }
    ]
  },
  {
    id: '10-c4',
    chapterNumber: 'Chương IV',
    title: 'Năng lượng, công, công suất',
    grade: 10,
    lessons: [
      { id: '10-b23', lessonNumber: 23, title: 'Bài 23: Năng lượng. Công cơ học' },
      { id: '10-b24', lessonNumber: 24, title: 'Bài 24: Công suất' },
      { id: '10-b25', lessonNumber: 25, title: 'Bài 25: Động năng, thế năng' },
      { id: '10-b26', lessonNumber: 26, title: 'Bài 26: Cơ năng và định luật bảo toàn cơ năng' },
      { id: '10-b27', lessonNumber: 27, title: 'Bài 27: Hiệu suất' },
      { id: '10-rev-mid2', lessonNumber: 'Ôn tập', title: 'Ôn tập giữa kì II' }
    ]
  },
  {
    id: '10-c5',
    chapterNumber: 'Chương V',
    title: 'Động lượng',
    grade: 10,
    lessons: [
      { id: '10-b28', lessonNumber: 28, title: 'Bài 28: Động lượng' },
      { id: '10-b29', lessonNumber: 29, title: 'Bài 29: Định luật bảo toàn động lượng' },
      { id: '10-b30', lessonNumber: 30, title: 'Bài 30: Thực hành: Đo động lượng và va chạm' },
      { id: '10-stem', lessonNumber: 'STEM', title: 'Dự án STEM Xe phản lực' }
    ]
  },
  {
    id: '10-c6',
    chapterNumber: 'Chương VI',
    title: 'Chuyển động tròn đều',
    grade: 10,
    lessons: [
      { id: '10-b31', lessonNumber: 31, title: 'Bài 31: Động học của chuyển động tròn đều' },
      { id: '10-b32', lessonNumber: 32, title: 'Bài 32: Lực hướng tâm và gia tốc hướng tâm' }
    ]
  },
  {
    id: '10-c7',
    chapterNumber: 'Chương VII',
    title: 'Biến dạng của vật rắn. Áp suất chất lỏng',
    grade: 10,
    lessons: [
      { id: '10-b33', lessonNumber: 33, title: 'Bài 33: Biến dạng của vật rắn' },
      { id: '10-b34', lessonNumber: 34, title: 'Bài 34: Khối lượng riêng. Áp suất chất lỏng' },
      { id: '10-rev-final2', lessonNumber: 'Ôn tập', title: 'Ôn tập cuối kì II' }
    ]
  },

  // -------------------------------------------------------------
  // KHỐI 11 (LỚP 11)
  // -------------------------------------------------------------
  {
    id: '11-c1',
    chapterNumber: 'Chương I',
    title: 'Dao động',
    grade: 11,
    lessons: [
      { id: '11-b1', lessonNumber: 1, title: 'Bài 1: Dao động điều hòa' },
      { id: '11-b2', lessonNumber: 2, title: 'Bài 2: Mô tả dao động điều hòa' },
      { id: '11-b3', lessonNumber: 3, title: 'Bài 3: Vận tốc, gia tốc trong dao động điều hòa' },
      { id: '11-b4', lessonNumber: 4, title: 'Bài 4: Năng lượng trong dao động điều hòa' },
      { id: '11-b5', lessonNumber: 5, title: 'Bài 5: Dao động tắt dần. Dao động cưỡng bức. Hiện tượng cộng hưởng' },
      { id: '11-b6', lessonNumber: 6, title: 'Bài 6: Thực hành: Đo tần số của sóng âm và chu kì con lắc' },
      { id: '11-b7', lessonNumber: 7, title: 'Bài 7: Bài tập về sự dao động' },
      { id: '11-rev-c1', lessonNumber: 'Ôn tập', title: 'Ôn tập chương I' }
    ]
  },
  {
    id: '11-c2',
    chapterNumber: 'Chương II',
    title: 'Sóng',
    grade: 11,
    lessons: [
      { id: '11-b8', lessonNumber: 8, title: 'Bài 8: Mô tả sóng' },
      { id: '11-b9', lessonNumber: 9, title: 'Bài 9: Sóng ngang. Sóng dọc. Sự truyền năng lượng của sóng' },
      { id: '11-b10', lessonNumber: 10, title: 'Bài 10: Thực hành: Đo tần số của sóng âm' },
      { id: '11-b11', lessonNumber: 11, title: 'Bài 11: Sóng điện từ' },
      { id: '11-b12', lessonNumber: 12, title: 'Bài 12: Giao thoa sóng' },
      { id: '11-b13', lessonNumber: 13, title: 'Bài 13: Sóng dừng' },
      { id: '11-b14', lessonNumber: 14, title: 'Bài 14: Thực hành: Đo tốc độ truyền âm' },
      { id: '11-rev-final1', lessonNumber: 'Ôn tập', title: 'Bài 15: Ôn tập cuối kì I' }
    ]
  },
  {
    id: '11-c3',
    chapterNumber: 'Chương III',
    title: 'Điện trường',
    grade: 11,
    lessons: [
      { id: '11-b16', lessonNumber: 16, title: 'Bài 16: Lực tương tác giữa các điện tích' },
      { id: '11-b17', lessonNumber: 17, title: 'Bài 17: Khái niệm điện trường' },
      { id: '11-b18', lessonNumber: 18, title: 'Bài 18: Điện trường đều' },
      { id: '11-b19', lessonNumber: 19, title: 'Bài 19: Thế năng điện' },
      { id: '11-b20', lessonNumber: 20, title: 'Bài 20: Điện thế và hiệu điện thế' },
      { id: '11-b21', lessonNumber: 21, title: 'Bài 21: Tụ điện' },
      { id: '11-rev-mid2', lessonNumber: 'Ôn tập', title: 'Ôn tập giữa kì II' }
    ]
  },
  {
    id: '11-c4',
    chapterNumber: 'Chương IV',
    title: 'Dòng điện, mạch điện',
    grade: 11,
    lessons: [
      { id: '11-b22', lessonNumber: 22, title: 'Bài 22: Cường độ dòng điện' },
      { id: '11-b23', lessonNumber: 23, title: 'Bài 23: Điện trở. Định luật Ohm' },
      { id: '11-b24', lessonNumber: 24, title: 'Bài 24: Nguồn điện' },
      { id: '11-b25', lessonNumber: 25, title: 'Bài 25: Năng lượng điện. Công suất điện' },
      { id: '11-b26', lessonNumber: 26, title: 'Bài 26: Thực hành: Đo suất điện động và điện trở trong của pin' },
      { id: '11-rev-final2', lessonNumber: 'Ôn tập', title: 'Ôn tập cuối kì II' }
    ]
  },

  // -------------------------------------------------------------
  // KHỐI 12 (LỚP 12)
  // -------------------------------------------------------------
  {
    id: '12-c1',
    chapterNumber: 'Chương 1',
    title: 'Vật lí nhiệt',
    grade: 12,
    lessons: [
      { id: '12-b1', lessonNumber: 1, title: 'Bài 1: Cấu trúc của chất. Sự chuyển thể' },
      { id: '12-b2', lessonNumber: 2, title: 'Bài 2: Nội năng. Định luật I của nhiệt động lực học' },
      { id: '12-b3', lessonNumber: 3, title: 'Bài 3: Nhiệt độ. Thang nhiệt độ - Nhiệt kế' },
      { id: '12-b4', lessonNumber: 4, title: 'Bài 4: Nhiệt dung riêng' },
      { id: '12-b5', lessonNumber: 5, title: 'Bài 5: Thực hành: Đo nhiệt dung riêng của nước' },
      { id: '12-b6', lessonNumber: 6, title: 'Bài 6: Nhiệt nóng chảy riêng' },
      { id: '12-b7', lessonNumber: 7, title: 'Bài 7: Thực hành: Đo nhiệt hóa hơi riêng của nước' },
      { id: '12-rev-c1', lessonNumber: 'Ôn tập', title: 'Ôn tập chương 1' }
    ]
  },
  {
    id: '12-c2',
    chapterNumber: 'Chương 2',
    title: 'Khí lí tưởng',
    grade: 12,
    lessons: [
      { id: '12-b8', lessonNumber: 8, title: 'Bài 8: Mô hình động học phân tử chất khí' },
      { id: '12-b9', lessonNumber: 9, title: 'Bài 9: Định luật Boyle' },
      { id: '12-b10', lessonNumber: 10, title: 'Bài 10: Định luật Charles' },
      { id: '12-b11', lessonNumber: 11, title: 'Bài 11: Phương trình trạng thái của khí lí tưởng' },
      { id: '12-b12', lessonNumber: 12, title: 'Bài 12: Áp suất khí theo mô hình động học phân tử' },
      { id: '12-rev-final1', lessonNumber: 'Ôn tập', title: 'Bài 13: Ôn tập cuối kì 1' }
    ]
  },
  {
    id: '12-c3',
    chapterNumber: 'Chương 3',
    title: 'Từ trường',
    grade: 12,
    lessons: [
      { id: '12-b14', lessonNumber: 14, title: 'Bài 14: Từ trường' },
      { id: '12-b15', lessonNumber: 15, title: 'Bài 15: Lực từ. Cảm ứng từ' },
      { id: '12-b16', lessonNumber: 16, title: 'Bài 16: Từ thông. Hiện tượng cảm ứng điện từ' },
      { id: '12-b17', lessonNumber: 17, title: 'Bài 17: Định luật cảm ứng điện từ Faraday' },
      { id: '12-b18', lessonNumber: 18, title: 'Bài 18: Tự cảm' },
      { id: '12-b19', lessonNumber: 19, title: 'Bài 19: Dòng điện xoay chiều' },
      { id: '12-b20', lessonNumber: 20, title: 'Bài 20: Thực hành: Khảo sát dòng điện xoay chiều trong đoạn mạch RLC' },
      { id: '12-rev-c3', lessonNumber: 'Ôn tập', title: 'Ôn tập chương 3' }
    ]
  },
  {
    id: '12-c4',
    chapterNumber: 'Chương 4',
    title: 'Vật lí hạt nhân',
    grade: 12,
    lessons: [
      { id: '12-b21', lessonNumber: 21, title: 'Bài 21: Cấu tạo hạt nhân' },
      { id: '12-b22', lessonNumber: 22, title: 'Bài 22: Năng lượng liên kết của hạt nhân' },
      { id: '12-b23', lessonNumber: 23, title: 'Bài 23: Hiện tượng phóng xạ' },
      { id: '12-b24', lessonNumber: 24, title: 'Bài 24: Phản ứng phân hạch và nhiệt hạch' },
      { id: '12-b25', lessonNumber: 25, title: 'Bài 25: Ứng dụng bức xạ trong đời sống và y học' },
      { id: '12-rev-final2', lessonNumber: 'Ôn tập', title: 'Ôn tập cuối kì 2, Luyện thi Tốt nghiệp THPT' }
    ]
  }
];

// =========================================================================
// CÁC MỐC ĐÁNH GIÁ ĐỊNH KỲ (MILESTONES) THEO NĂM HỌC
// =========================================================================

export const MILESTONES: { id: ExamCategory; label: string; short: string; description: string }[] = [
  { id: 'midterm1', label: 'Kiểm tra Giữa Học kỳ I', short: 'GHK1', description: 'Đánh giá kiến thức trọng tâm nửa đầu học kỳ I' },
  { id: 'final1', label: 'Kiểm tra Cuối Học kỳ I', short: 'CHK1', description: 'Đánh giá toàn diện kiến thức chương trình học kỳ I' },
  { id: 'midterm2', label: 'Kiểm tra Giữa Học kỳ II', short: 'GHK2', description: 'Đánh giá kiến thức trọng tâm nửa đầu học kỳ II' },
  { id: 'final2', label: 'Kiểm tra Cuối Học kỳ II', short: 'CHK2', description: 'Đánh giá toàn diện năng lực cả năm học' },
  { id: 'survey', label: 'Khảo sát chất lượng / Thi thử TN THPT', short: 'Thi thử', description: 'Chuẩn định dạng cấu trúc 2025 của Bộ GD&ĐT' },
];

// =========================================================================
// ĐỀ THI MẪU CHO CÁC KHỐI LỚP (PRE-POPULATED EXAMS)
// =========================================================================

// Đề Lớp 12 - Bài 2: Nội năng và Định luật I Nhiệt động lực học
const examGrade12Lesson2: Exam = {
  id: 'exam-1201-thermo-first-law',
  code: '1201',
  title: 'ĐỀ ÔN TẬP: ĐỊNH LUẬT I NHIỆT ĐỘNG LỰC HỌC & NỘI NĂNG',
  subtitle: 'Chương trình GDPT 2018: Lớp 12 • Chương 1: Vật lí nhiệt • Bài 2',
  gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Phần I: Câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D). Mỗi câu đúng 0,25đ.',
    'Phần II: Câu trắc nghiệm Đúng/Sai lũy tiến. Mỗi câu 4 ý (a, b, c, d). Đúng 1 ý: 0,1đ; đúng 2 ý: 0,25đ; đúng 3 ý: 0,5đ; đúng cả 4 ý: 1,0đ.',
    'Phần III: Câu hỏi trả lời ngắn (điền số thập phân/nguyên có kèm hoặc không kèm đơn vị đo). Mỗi câu 0,25đ.'
  ],
  questions: [
    {
      id: 'q12-1',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 1: Biểu thức và quy ước dấu định luật I Nhiệt động lực học',
      points: 0.25,
      stem: 'Trong một quá trình biến đổi, khối khí nhận một nhiệt lượng $Q = 150\\text{ J}$ từ môi trường và đồng thời thực hiện một công $A = 60\\text{ J}$ lên ngoại vật. Độ biến thiên nội năng $\\Delta U$ của khối khí là:',
      options: [
        { id: 'A', text: '$\\Delta U = +90\\text{ J}$' },
        { id: 'B', text: '$\\Delta U = +210\\text{ J}$' },
        { id: 'C', text: '$\\Delta U = -90\\text{ J}$' },
        { id: 'D', text: '$\\Delta U = -210\\text{ J}$' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Theo định luật I: $\\Delta U = A + Q$ với quy ước: khí nhận nhiệt $Q > 0$, khí sinh công $A < 0$.',
        keyFormula: '\\Delta U = Q + A = 150 - 60 = 90\\text{ J}',
        stepByStep: [
          'Khí nhận nhiệt lượng $Q = +150\\text{ J}$.',
          'Khí thực hiện công nên công khí nhận vào là $A = -60\\text{ J}$.',
          'Độ biến thiên nội năng: $\\Delta U = 150 + (-60) = 90\\text{ J}$. Chọn A.'
        ]
      }
    },
    {
      id: 'q12-2',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 2: Chu trình biến đổi nhiệt động của chất khí trên giản đồ p-V',
      points: 1.0,
      stem: 'Một mol khí lí tưởng đơn nguyên tử thực hiện chu trình biến đổi kín $1 \\to 2 \\to 3 \\to 1$ như biểu diễn trên đồ thị áp suất - thể tích $p-V$. Trong đó quá trình $1 \\to 2$ là dãn đẳng nhiệt ở nhiệt độ $T_1 = 300\\text{ K}$, quá trình $2 \\to 3$ là đẳng áp, quá trình $3 \\to 1$ là đẳng tích. Cho $p_1 = 3{,}0\\text{ bar}$, $V_1 = 2{,}0\\text{ lít}$, $V_2 = 6{,}0\\text{ lít}$.',
      diagram: {
        type: 'svg',
        caption: 'Hình: Giản đồ p-V chu trình 1 -> 2 (đẳng nhiệt) -> 3 (đẳng áp) -> 1 (đẳng tích)',
        content: `<svg viewBox="0 0 540 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <defs>
    <marker id="pv-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#1e293b" />
    </marker>
    <marker id="cycle-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563eb" />
    </marker>
  </defs>
  <rect width="540" height="260" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="8" />
  <line x1="50" y1="220" x2="500" y2="220" stroke="#1e293b" stroke-width="2" marker-end="url(#pv-arrow)" />
  <text x="505" y="225" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">V (Lít)</text>
  <line x1="80" y1="230" x2="80" y2="25" stroke="#1e293b" stroke-width="2" marker-end="url(#pv-arrow)" />
  <text x="50" y="22" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">p (bar)</text>
  <line x1="80" y1="70" x2="160" y2="70" stroke="#94a3b8" stroke-dasharray="3,3" />
  <line x1="80" y1="170" x2="400" y2="170" stroke="#94a3b8" stroke-dasharray="3,3" />
  <line x1="160" y1="220" x2="160" y2="70" stroke="#94a3b8" stroke-dasharray="3,3" />
  <line x1="400" y1="220" x2="400" y2="170" stroke="#94a3b8" stroke-dasharray="3,3" />
  <text x="155" y="238" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">2,0</text>
  <text x="395" y="238" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">6,0</text>
  <text x="55" y="75" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">3,0</text>
  <text x="55" y="175" font-family="sans-serif" font-size="12" font-weight="600" fill="#334155">1,0</text>
  <path d="M 160 70 Q 250 130 400 170" fill="none" stroke="#2563eb" stroke-width="3" />
  <line x1="280" y1="117" x2="300" y2="128" stroke="#2563eb" stroke-width="2.5" marker-end="url(#cycle-arrow)" />
  <line x1="400" y1="170" x2="160" y2="170" stroke="#16a34a" stroke-width="3" />
  <line x1="290" y1="170" x2="270" y2="170" stroke="#16a34a" stroke-width="2.5" marker-end="url(#cycle-arrow)" />
  <line x1="160" y1="170" x2="160" y2="70" stroke="#dc2626" stroke-width="3" />
  <line x1="160" y1="130" x2="160" y2="110" stroke="#dc2626" stroke-width="2.5" marker-end="url(#cycle-arrow)" />
  <circle cx="160" cy="70" r="5" fill="#2563eb" />
  <text x="168" y="65" font-family="sans-serif" font-size="13" font-weight="bold" fill="#2563eb">(1)</text>
  <circle cx="400" cy="170" r="5" fill="#16a34a" />
  <text x="410" y="170" font-family="sans-serif" font-size="13" font-weight="bold" fill="#16a34a">(2)</text>
  <circle cx="160" cy="170" r="5" fill="#dc2626" />
  <text x="140" y="185" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">(3)</text>
</svg>`
      },
      items: [
        { id: 'a', statement: 'Áp suất của khối khí tại trạng thái 2 là $p_2 = 1{,}0\\text{ bar}$.', correctAnswer: true, explanation: 'Vì quá trình 1->2 đẳng nhiệt nên $p_1 V_1 = p_2 V_2 \\implies 3{,}0 \\times 2{,}0 = p_2 \\times 6{,}0 \\implies p_2 = 1{,}0\\text{ bar}$.' },
        { id: 'b', statement: 'Trong cả một chu trình kín $1 \\to 2 \\to 3 \\to 1$, độ biến thiên nội năng $\\Delta U_{\\text{cycle}} > 0$.', correctAnswer: false, explanation: 'Nội năng là hàm trạng thái, chu trình kín quay về trạng thái 1 nên $\\Delta U = 0$.' },
        { id: 'c', statement: 'Trong quá trình nén đẳng áp $2 \\to 3$, khối khí thực hiện công lên môi trường ngoài.', correctAnswer: false, explanation: 'Thể tích giảm từ 6L về 2L nên khí nhận công từ môi trường ($A > 0$).' },
        { id: 'd', statement: 'Nhiệt độ tuyệt đối tại trạng thái 3 bằng $100\\text{ K}$.', correctAnswer: true, explanation: '$T_3 = T_2 \\times (V_3/V_2) = 300 \\times (2/6) = 100\\text{ K}$.' }
      ],
      explanation: {
        overview: 'Phân tích các quá trình biến đổi trạng thái của khí lí tưởng trên giản đồ p-V.',
        keyFormula: 'p_1 V_1 = p_2 V_2,\\quad \\frac{V_2}{T_2} = \\frac{V_3}{T_3}',
        stepByStep: [
          'a) Đúng: $p_2 = 3 \\times 2 / 6 = 1{,}0\\text{ bar}$.',
          'b) Sai: Chu trình kín có $\\Delta U = 0$.',
          'c) Sai: Thể tích giảm nên khí nhận công chứ không sinh công.',
          'd) Đúng: Quá trình đẳng áp $T_3 = T_2 (V_3/V_2) = 300 \\times (2/6) = 100\\text{ K}$.'
        ]
      }
    },
    {
      id: 'q12-3',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 3: Tính công khí sinh ra trong quá trình đẳng áp 2 -> 3',
      points: 0.25,
      stem: 'Một khối khí lí tưởng thực hiện dãn đẳng áp ở áp suất không đổi $p = 2{,}5 \\times 10^5\\text{ Pa}$. Khi nhận nhiệt lượng, thể tích của khối khí tăng từ $V_1 = 4{,}0\\text{ lít}$ đến $V_2 = 8{,}0\\text{ lít}$. Tính công $A\'$ mà khối khí đã sinh ra cho môi trường (theo đơn vị Jun - J).',
      correctValue: 1000,
      tolerance: 0.02,
      acceptedUnits: ['J', 'Jun', 'Joules'],
      unitHint: 'J',
      placeholder: 'ví dụ: 1000 J',
      explanation: {
        overview: 'Công trong quá trình đẳng áp: $A\' = p(V_2 - V_1)$.',
        keyFormula: 'A\' = p \\Delta V = 2{,}5 \\times 10^5 \\times (8{,}0 - 4{,}0) \\times 10^{-3} = 1000\\text{ J}',
        stepByStep: [
          'Đổi thể tích: $\\Delta V = 4{,}0\\text{ lít} = 4{,}0 \\times 10^{-3}\\text{ m}^3$.',
          'Công sinh ra: $A\' = 2{,}5 \\times 10^5 \\times 4{,}0 \\times 10^{-3} = 1000\\text{ J}$.'
        ]
      }
    }
  ]
};

// Đề Lớp 12 - Chương 2: Khí lí tưởng & Định luật Boyle, Charles (Bài 9, 10, 11)
const examGrade12Chapter2: Exam = {
  id: 'exam-1202-boyle-charles',
  code: '1202',
  title: 'ĐỀ ĐÁNH GIÁ CHƯƠNG 2: KHÍ LÍ TƯỞNG & ĐỊNH LUẬT BOYLE, CHARLES',
  subtitle: 'Chương trình GDPT 2018: Lớp 12 • Chương 2: Khí lí tưởng',
  gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Phần I: 18 câu trắc nghiệm 4 lựa chọn (A, B, C, D).',
    'Phần II: 4 câu Đúng/Sai lũy tiến chuẩn ma trận Bộ GD&ĐT.',
    'Phần III: 6 câu trả lời ngắn điền giá trị số.'
  ],
  questions: [
    {
      id: 'q12-b-1',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 1: Đường đẳng nhiệt trên hệ toạ độ p-V (Định luật Boyle)',
      points: 0.25,
      stem: 'Trong quá trình biến đổi đẳng nhiệt của một lượng khí lí tưởng xác định, đồ thị biểu diễn mối liên hệ giữa áp suất $p$ và thể tích $V$ trên hệ toạ độ $(p, V)$ có dạng là:',
      options: [
        { id: 'A', text: 'Một nhánh đường hypebol' },
        { id: 'B', text: 'Đường thẳng đi qua gốc tọa độ $O$' },
        { id: 'C', text: 'Đường parabol' },
        { id: 'D', text: 'Đường tròn bán kính tỉ lệ với nhiệt độ' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Theo định luật Boyle: $p \\cdot V = \\text{const} \\implies p = \\frac{\\text{const}}{V}$, đây là phương trình một đường hypebol.',
        stepByStep: ['Phương trình $y = \\frac{k}{x}$ biểu diễn đường hypebol vuông góc trên hệ trục toạ độ.']
      }
    },
    {
      id: 'q12-b-2',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 2: Khảo sát quá trình đẳng nhiệt của khối khí trong xilanh kín',
      points: 1.0,
      stem: 'Một lượng khí xác định có thể tích ban đầu $V_1 = 10\\text{ lít}$ ở áp suất $p_1 = 2{,}0\\text{ atm}$. Người ta nén đẳng nhiệt khối khí đến áp suất $p_2 = 5{,}0\\text{ atm}$. Nhiệt độ phòng duy trì không đổi $t = 27^\\circ\\text{C}$.',
      items: [
        { id: 'a', statement: 'Nhiệt độ tuyệt đối của khối khí là $T = 300\\text{ K}$.', correctAnswer: true },
        { id: 'b', statement: 'Thể tích của khối khí sau khi nén là $V_2 = 4{,}0\\text{ lít}$.', correctAnswer: true },
        { id: 'c', statement: 'Trong quá trình nén đẳng nhiệt, mật độ phân tử khí giảm đi 2,5 lần.', correctAnswer: false },
        { id: 'd', statement: 'Tích số $p \\cdot V$ của khối khí luôn bằng hằng số trong suốt quá trình.', correctAnswer: true }
      ],
      explanation: {
        overview: 'Áp dụng định luật Boyle cho quá trình nén đẳng nhiệt.',
        keyFormula: 'p_1 V_1 = p_2 V_2 \\implies V_2 = \\frac{2{,}0 \\times 10}{5{,}0} = 4{,}0\\text{ lít}',
        stepByStep: [
          'Nhiệt độ tuyệt đối $T = 273 + 27 = 300\\text{ K}$. (a đúng)',
          'Thể tích sau khi nén: $V_2 = p_1 V_1 / p_2 = 4{,}0\\text{ lít}$. (b đúng)',
          'Thể tích giảm 2,5 lần nên mật độ phân tử khí tăng 2,5 lần chứ không giảm. (c sai)',
          'Quá trình đẳng nhiệt tuân theo định luật Boyle nên $p \\cdot V = \\text{hằng số}$. (d đúng)'
        ]
      }
    },
    {
      id: 'q12-b-3',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 3: Áp suất lốp xe sau khi di chuyển trên quãng đường dài (Charles)',
      points: 0.25,
      stem: 'Trước khi xuất phát vào buổi sáng, một lái xe đo áp suất không khí trong lốp xe ô tô thấy chỉ $2{,}20\\text{ bar}$ ở nhiệt độ $20^\\circ\\text{C}$. Sau khi chạy tốc độ cao trên đường cao tốc, nhiệt độ không khí bên trong lốp tăng lên tới $55^\\circ\\text{C}$. Bỏ qua sự giãn nở thể tích của lốp xe. Tính áp suất bên trong lốp xe lúc này (đơn vị bar, làm tròn đến 2 chữ số thập phân).',
      correctValue: 2.46,
      tolerance: 0.03,
      acceptedUnits: ['bar', 'Bar'],
      unitHint: 'bar',
      placeholder: 'ví dụ: 2.46 bar',
      explanation: {
        overview: 'Quá trình đẳng tích (Charles): $\\frac{p_1}{T_1} = \\frac{p_2}{T_2}$.',
        keyFormula: 'T_1 = 293\\text{ K},\\quad T_2 = 328\\text{ K}\\implies p_2 = 2{,}20 \\times \\frac{328}{293} \\approx 2{,}46\\text{ bar}',
        stepByStep: [
          'Nhiệt độ ban đầu: $T_1 = 20 + 273 = 293\\text{ K}$.',
          'Nhiệt độ sau khi xe chạy: $T_2 = 55 + 273 = 328\\text{ K}$.',
          'Áp suất không khí trong lốp: $p_2 = 2{,}20 \\times \\frac{328}{293} \\approx 2{,}46\\text{ bar}$.'
        ]
      }
    }
  ]
};

// Đề Lớp 11 - Bài 13: Sóng dừng (Chương II)
const examGrade11WaveStanding: Exam = {
  id: 'exam-1102-standing-waves',
  code: '1102',
  title: 'ĐỀ ÔN LUYỆN: SÓNG CƠ & HIỆN TƯỢNG SÓNG DỪNG',
  subtitle: 'Chương trình GDPT 2018: Lớp 11 • Chương II: Sóng • Bài 13: Sóng dừng',
  gradeLevel: 'Lớp 11 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Thí sinh áp dụng điều kiện sóng dừng trên dây hai đầu cố định: $L = k\\frac{\\lambda}{2}$.',
    'Khoảng cách giữa hai nút sóng liên tiếp bằng $\\frac{\\lambda}{2}$.'
  ],
  questions: [
    {
      id: 'q11-1',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Dao động & Sóng cơ',
      title: 'Câu 1: Điều kiện xảy ra sóng dừng trên sợi dây hai đầu cố định',
      points: 0.25,
      stem: 'Một sợi dây đàn hồi chiều dài $L$ có hai đầu cố định. Khi trên dây hình thành sóng dừng ổn định với bước sóng $\\lambda$, điều kiện về chiều dài $L$ là:',
      options: [
        { id: 'A', text: '$L = k\\frac{\\lambda}{2}$ với $k = 1, 2, 3, \\dots$' },
        { id: 'B', text: '$L = (2k + 1)\\frac{\\lambda}{4}$ với $k = 0, 1, 2, \\dots$' },
        { id: 'C', text: '$L = k\\lambda$ với $k = 1, 2, 3, \\dots$' },
        { id: 'D', text: '$L = (2k + 1)\\lambda$ với $k = 0, 1, 2, \\dots$' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Với hai đầu cố định là hai nút sóng, chiều dài dây phải bằng số nguyên lần nửa bước sóng.',
        keyFormula: 'L = k \\frac{\\lambda}{2}',
        stepByStep: [
          'Khoảng cách giữa hai nút sóng liên tiếp là $\\lambda/2$.',
          'Hai đầu cố định là hai nút nên chiều dài sợi dây gồm $k$ bó sóng: $L = k\\frac{\\lambda}{2}$. Chọn A.'
        ]
      }
    },
    {
      id: 'q11-2',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Dao động & Sóng cơ',
      title: 'Câu 2: Hình ảnh sóng dừng với 4 bụng sóng trên dây',
      points: 1.0,
      stem: 'Một sợi dây đàn hồi dài $L = 1{,}2\\text{ m}$ hai đầu cố định được kích thích dao động bởi một cần rung có tần số $f = 100\\text{ Hz}$. Trên dây quan sát thấy 4 bụng sóng.',
      diagram: {
        type: 'svg',
        caption: 'Hình: Sóng dừng trên dây hai đầu cố định gồm 4 múi sóng (bụng sóng)',
        content: `<svg viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <rect width="600" height="160" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="8" />
  <line x1="40" y1="80" x2="560" y2="80" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1.5" />
  <path d="M 50 80 Q 112.5 20, 175 80 Q 237.5 140, 300 80 Q 362.5 20, 425 80 Q 487.5 140, 550 80" fill="none" stroke="#2563eb" stroke-width="3" />
  <path d="M 50 80 Q 112.5 140, 175 80 Q 237.5 20, 300 80 Q 362.5 140, 425 80 Q 487.5 20, 550 80" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,4" />
  <circle cx="50" cy="80" r="5" fill="#dc2626" />
  <circle cx="175" cy="80" r="4" fill="#dc2626" />
  <circle cx="300" cy="80" r="4" fill="#dc2626" />
  <circle cx="425" cy="80" r="4" fill="#dc2626" />
  <circle cx="550" cy="80" r="5" fill="#dc2626" />
  <text x="40" y="105" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">Nút A</text>
  <text x="540" y="105" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">Nút B</text>
  <text x="260" y="145" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0284c7">L = 1,2 m (4 bó sóng)</text>
</svg>`
      },
      items: [
        { id: 'a', statement: 'Số nút sóng trên toàn bộ sợi dây (tính cả hai đầu cố định) là 5 nút.', correctAnswer: true },
        { id: 'b', statement: 'Bước sóng của sóng cơ lan truyền trên dây là $\\lambda = 0{,}6\\text{ m}$.', correctAnswer: true },
        { id: 'c', statement: 'Tốc độ truyền sóng trên dây đo được là $v = 30\\text{ m/s}$.', correctAnswer: false },
        { id: 'd', statement: 'Hai điểm dao động thuộc cùng một bó sóng luôn dao động cùng pha với nhau.', correctAnswer: true }
      ],
      explanation: {
        overview: 'Khảo sát đặc trưng của sóng dừng: số bó sóng $k = 4$, số nút $k + 1 = 5$.',
        keyFormula: '\\lambda = \\frac{2L}{k} = \\frac{2 \\times 1{,}2}{4} = 0{,}6\\text{ m},\\quad v = \\lambda f = 0{,}6 \\times 100 = 60\\text{ m/s}',
        stepByStep: [
          'Số nút sóng trên dây: $N = k + 1 = 4 + 1 = 5$ nút. (a đúng)',
          'Bước sóng: $\\lambda = 2L / k = 2 \\times 1{,}2 / 4 = 0{,}6\\text{ m}$. (b đúng)',
          'Tốc độ truyền sóng: $v = \\lambda f = 0{,}6 \\times 100 = 60\\text{ m/s}$. (c sai)',
          'Các phần tử nằm trong cùng một bó sóng luôn dao động cùng pha với nhau. (d đúng)'
        ]
      }
    },
    {
      id: 'q11-3',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Dao động & Sóng cơ',
      title: 'Câu 3: Xác định tần số nhỏ nhất để tạo sóng dừng (Họa âm cơ bản)',
      points: 0.25,
      stem: 'Một dây đàn dài $L = 60\\text{ cm}$ hai đầu cố định có tốc độ truyền sóng ngang là $v = 240\\text{ m/s}$. Tính tần số âm cơ bản (họa âm bậc 1 $f_1$) mà dây đàn phát ra (đơn vị Hz).',
      correctValue: 200,
      tolerance: 0.01,
      acceptedUnits: ['Hz'],
      unitHint: 'Hz',
      placeholder: 'ví dụ: 200 Hz',
      explanation: {
        overview: 'Họa âm bậc 1 ứng với $k = 1$: $f_1 = \\frac{v}{2L}$.',
        keyFormula: 'f_1 = \\frac{240}{2 \\times 0{,}60} = 200\\text{ Hz}',
        stepByStep: [
          'Âm cơ bản phát ra ứng với số bó sóng nhỏ nhất $k = 1$.',
          'Tần số họa âm bậc 1: $f_1 = \\frac{v}{2L} = \\frac{240}{2 \\times 0{,}60} = 200\\text{ Hz}$.'
        ]
      }
    }
  ]
};

// Đề Lớp 10 - Chương III: Các định luật Newton & Ma sát (Bài 14, 15, 18)
const examGrade10Mechanics: Exam = {
  id: 'exam-1001-newton-laws',
  code: '1001',
  title: 'ĐỀ ÔN TẬP: CÁC ĐỊNH LUẬT NEWTON & LỰC MA SÁT',
  subtitle: 'Chương trình GDPT 2018: Lớp 10 • Chương III: Động lực học • Bài 14, 15, 18',
  gradeLevel: 'Lớp 10 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Lấy gia tốc trọng trường $g = 9{,}8\\text{ m/s}^2$ (hoặc $10\\text{ m/s}^2$ khi có hướng dẫn cụ thể).',
    'Vẽ và phân tích hệ các vectơ lực tác dụng lên vật.'
  ],
  questions: [
    {
      id: 'q10-1',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Cơ học & Động lực học',
      title: 'Câu 1: Quán tính và định luật I Newton',
      points: 0.25,
      stem: 'Một hành khách ngồi trên xe buýt đang chuyển động thẳng đều về phía trước. Khi tài xế bất ngờ phanh gấp, người hành khách bị chúi người về phía trước. Hiện tượng này xảy ra là do:',
      options: [
        { id: 'A', text: 'Quán tính của người hành khách' },
        { id: 'B', text: 'Trọng lực đột ngột tăng lên' },
        { id: 'C', text: 'Lực ma sát tác dụng vào lưng ghế đẩy người' },
        { id: 'D', text: 'Lực hướng tâm xuất hiện' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Do có quán tính, vật có xu hướng bảo toàn vận tốc ban đầu khi ngoại lực làm đổi vận tốc xe.',
        stepByStep: [
          'Khi xe đột ngột phanh hãm, phần thân dưới tiếp xúc ghế bị hãm lại theo xe.',
          'Phần thân trên theo quán tính tiếp tục chuyển động với vận tốc cũ, làm người bị chúi về phía trước. Chọn A.'
        ]
      }
    },
    {
      id: 'q10-2',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Cơ học & Động lực học',
      title: 'Câu 2: Khảo sát chuyển động của vật kéo trên sàn nằm ngang',
      points: 1.0,
      stem: 'Một kiện hàng khối lượng $m = 20\\text{ kg}$ đặt trên mặt sàn nằm ngang. Người ta tác dụng một lực kéo $\\vec{F}$ có độ lớn $F = 80\\text{ N}$ theo phương ngang. Hệ số ma sát trượt giữa kiện hàng và sàn là $\\mu = 0{,}25$. Lấy $g = 10\\text{ m/s}^2$.',
      diagram: {
        type: 'svg',
        caption: 'Hình: Phân tích các lực tác dụng lên kiện hàng nằm ngang',
        content: `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <rect width="500" height="180" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="8" />
  <line x1="30" y1="130" x2="470" y2="130" stroke="#334155" stroke-width="2" />
  <rect x="180" y="70" width="100" height="60" fill="#e0e7ff" stroke="#4338ca" stroke-width="2" rx="4" />
  <text x="220" y="105" font-family="sans-serif" font-size="14" font-weight="bold" fill="#312e81">m = 20kg</text>
  <line x1="280" y1="100" x2="380" y2="100" stroke="#16a34a" stroke-width="2.5" marker-end="url(#pv-arrow)" />
  <text x="340" y="90" font-family="sans-serif" font-size="13" font-weight="bold" fill="#16a34a">F = 80N</text>
  <line x1="180" y1="130" x2="110" y2="130" stroke="#dc2626" stroke-width="2.5" marker-end="url(#pv-arrow)" />
  <text x="120" y="120" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">f_ms</text>
</svg>`
      },
      items: [
        { id: 'a', statement: 'Lực pháp tuyến (áp lực) sàn tác dụng lên vật có độ lớn $N = 200\\text{ N}$.', correctAnswer: true },
        { id: 'b', statement: 'Độ lớn của lực ma sát trượt tác dụng lên vật là $f_{mst} = 50\\text{ N}$.', correctAnswer: true },
        { id: 'c', statement: 'Vật đứng yên vì lực ma sát lớn hơn lực kéo.', correctAnswer: false },
        { id: 'd', statement: 'Gia tốc chuyển động của vật là $a = 1{,}5\\text{ m/s}^2$.', correctAnswer: true }
      ],
      explanation: {
        overview: 'Định luật II Newton theo phương ngang: $F - f_{mst} = ma$.',
        keyFormula: 'f_{mst} = \\mu mg = 0{,}25 \\times 20 \\times 10 = 50\\text{ N},\\quad a = \\frac{80 - 50}{20} = 1{,}5\\text{ m/s}^2',
        stepByStep: [
          'Áp lực sàn tác dụng lên vật: $N = P = mg = 20 \\times 10 = 200\\text{ N}$. (a đúng)',
          'Độ lớn lực ma sát trượt: $f_{mst} = \\mu N = 0{,}25 \\times 200 = 50\\text{ N}$. (b đúng)',
          'Vì $F = 80\\text{ N} > f_{mst}$ nên hợp lực khác 0, vật chuyển động có gia tốc chứ không đứng yên. (c sai)',
          'Gia tốc: $a = (F - f_{mst})/m = (80 - 50)/20 = 1{,}5\\text{ m/s}^2$. (d đúng)'
        ]
      }
    },
    {
      id: 'q10-3',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Cơ học & Động lực học',
      title: 'Câu 3: Quãng đường vật đi được sau 4 giây',
      points: 0.25,
      stem: 'Tiếp tục bài toán trên, giả sử ban đầu kiện hàng đứng yên ($v_0 = 0$). Tính quãng đường $s$ mà kiện hàng đi được sau $t = 4{,}0\\text{ giây}$ kể từ lúc bắt đầu tác dụng lực kéo (đơn vị mét - m).',
      correctValue: 12,
      tolerance: 0.05,
      acceptedUnits: ['m', 'mét'],
      unitHint: 'm',
      placeholder: 'ví dụ: 12 m',
      explanation: {
        overview: 'Chuyển động thẳng biến đổi đều không vận tốc đầu: $s = \\frac{1}{2}at^2$.',
        keyFormula: 's = \\frac{1}{2} \\times 1{,}5 \\times (4{,}0)^2 = 12\\text{ m}',
        stepByStep: [
          'Vận tốc đầu $v_0 = 0\\text{ m/s}$.',
          'Quãng đường đi được: $s = \\frac{1}{2}at^2 = \\frac{1}{2} \\times 1{,}5 \\times 4^2 = 12\\text{ m}$.'
        ]
      }
    }
  ]
};

// Đề Lớp 12 - Kiểm tra Cuối Học kỳ I (CHK1)
const examGrade12CHK1: Exam = {
  id: 'exam-12-chk1-national-prep',
  code: 'CHK1-12',
  title: 'KIỂM TRA CUỐI HỌC KỲ I (CHK1) - VẬT LÍ 12',
  subtitle: 'Đánh giá toàn diện: Chương 1 (Vật lí nhiệt) & Chương 2 (Khí lí tưởng)',
  gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
  durationMinutes: 50,
  totalPoints: 10,
  instructions: [
    'Cấu trúc đề thi chuẩn 100% định dạng năm 2025 của Bộ Giáo dục & Đào tạo.',
    'Bao gồm 3 phần: Phần I (Trắc nghiệm nhiều lựa chọn), Phần II (Đúng/Sai), Phần III (Trả lời ngắn).'
  ],
  questions: samplePhysicsExam.questions
};

// Đề Lớp 10 - Kiểm tra Giữa Học kỳ I (GHK1)
const examGrade10GHK1: Exam = {
  id: 'exam-10-ghk1-kinematics',
  code: 'GHK1-10',
  title: 'KIỂM TRA GIỮA HỌC KỲ I (GHK1) - VẬT LÍ 10',
  subtitle: 'Đánh giá trọng tâm: Chương I (Mở đầu & Sai số) & Chương II (Động học chất điểm)',
  gradeLevel: 'Lớp 10 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Thí sinh sử dụng công thức chuyển động biến đổi đều và biểu diễn sai số phép đo.',
    'Đề chuẩn định dạng Bộ GD&ĐT 2025.'
  ],
  questions: examGrade10Mechanics.questions
};

// Đề Lớp 11 - Kiểm tra Giữa Học kỳ I (GHK1)
const examGrade11GHK1: Exam = {
  id: 'exam-11-ghk1-oscillations',
  code: 'GHK1-11',
  title: 'KIỂM TRA GIỮA HỌC KỲ I (GHK1) - VẬT LÍ 11',
  subtitle: 'Đánh giá trọng tâm: Chương I (Dao động điều hòa, Vận tốc, Gia tốc & Năng lượng)',
  gradeLevel: 'Lớp 11 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Áp dụng phương trình li độ $x = A\\cos(\\omega t + \\varphi)$, bảo toàn cơ năng con lắc lò xo.',
    'Đầy đủ 3 phần thi theo chuẩn Bộ GD&ĐT.'
  ],
  questions: examGrade11WaveStanding.questions
};

// Đề Lớp 12 - Chuyên đề Hạt nhân & Phóng xạ (Chương 4)
const examGrade12Nuclear: Exam = {
  id: 'exam-1204-nuclear-physics',
  code: '1204',
  title: 'ĐỀ ĐÁNH GIÁ CHUYÊN ĐỀ: VẬT LÍ HẠT NHÂN & NĂNG LƯỢNG LIÊN KẾT',
  subtitle: 'Chương trình GDPT 2018: Lớp 12 • Chương 4: Vật lí hạt nhân • Bài 21, 22, 23',
  gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Khối lượng prôtôn: $m_p = 1{,}007276\\text{ u}$; khối lượng nơtron: $m_n = 1{,}008665\\text{ u}$.',
    'Năng lượng tương đương $1\\text{ u} = 931{,}5\\text{ MeV/c}^2$.'
  ],
  questions: [
    {
      id: 'q-nuc-1',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Vật lí hạt nhân & Hiện đại',
      title: 'Câu 1: Cấu tạo và độ hụt khối của hạt nhân nguyên tử',
      points: 0.25,
      stem: 'Hạt nhân chì $^{206}_{82}\\text{Pb}$ có cấu tạo gồm bao nhiêu nuclôn, prôtôn và nơtron?',
      options: [
        { id: 'A', text: '82 prôtôn và 124 nơtron' },
        { id: 'B', text: '82 prôtôn và 206 nơtron' },
        { id: 'C', text: '124 prôtôn và 82 nơtron' },
        { id: 'D', text: '206 prôtôn và 82 nơtron' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Số prôtôn $Z = 82$, số nơtron $N = A - Z = 206 - 82 = 124$.',
        stepByStep: [
          'Kí hiệu nguyên tử $^{A}_{Z}\\text{X}$: số khối $A = 206$, điện tích hạt nhân $Z = 82$.',
          'Số nuclôn bằng $A = 206$, số prôtôn bằng $Z = 82$.',
          'Số nơtron: $N = A - Z = 206 - 82 = 124$. Chọn A.'
        ]
      }
    },
    {
      id: 'q-nuc-2',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Vật lí hạt nhân & Hiện đại',
      title: 'Câu 2: Đồ thị năng lượng liên kết riêng và độ bền vững hạt nhân',
      points: 1.0,
      stem: 'Xét đường cong năng lượng liên kết riêng $\\epsilon$ theo số khối $A$ của các hạt nhân trong bảng tuần hoàn.',
      diagram: {
        type: 'svg',
        caption: 'Hình: Đường cong năng lượng liên kết riêng theo số khối A',
        content: `<svg viewBox="0 0 540 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <rect width="540" height="220" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" rx="8" />
  <line x1="50" y1="180" x2="500" y2="180" stroke="#1e293b" stroke-width="2" marker-end="url(#pv-arrow)" />
  <text x="505" y="185" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">Số khối A</text>
  <line x1="70" y1="190" x2="70" y2="20" stroke="#1e293b" stroke-width="2" marker-end="url(#pv-arrow)" />
  <text x="40" y="20" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">ε (MeV/nuclon)</text>
  <path d="M 75 160 Q 130 50 220 50 Q 320 60 480 90" fill="none" stroke="#7c3aed" stroke-width="3" />
  <circle cx="220" cy="50" r="5" fill="#dc2626" />
  <text x="180" y="38" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">Cực đại ~8,8 MeV (Fe, Ni)</text>
</svg>`
      },
      items: [
        { id: 'a', statement: 'Năng lượng liên kết riêng đặc trưng cho mức độ bền vững của hạt nhân.', correctAnswer: true },
        { id: 'b', statement: 'Các hạt nhân có số khối trung bình ($50 < A < 80$) có năng lượng liên kết riêng lớn nhất nên bền vững nhất.', correctAnswer: true },
        { id: 'c', statement: 'Hạt nhân $^{238}_{92}\\text{U}$ bền vững hơn hạt nhân $^{56}_{26}\\text{Fe}$.', correctAnswer: false },
        { id: 'd', statement: 'Năng lượng liên kết của hạt nhân bằng tích của năng lượng liên kết riêng với số khối $A$.', correctAnswer: true }
      ],
      explanation: {
        overview: 'Năng lượng liên kết riêng $\\epsilon = \\frac{W_{lk}}{A}$. Hạt nhân $^{56}\\text{Fe}$ có $\\epsilon \\approx 8{,}8\\text{ MeV/nuclon}$ bền vững nhất.',
        stepByStep: [
          'Năng lượng liên kết riêng là đại lượng đặc trưng cho độ bền vững của hạt nhân. (a đúng)',
          'Hạt nhân có số khối trung bình có $\\epsilon$ lớn nhất (~8,8 MeV/nuclon) nên bền nhất. (b đúng)',
          'Hạt nhân Fe bền vững hơn các hạt nhân nặng như Urani. (c sai)',
          'Năng lượng liên kết toàn phần $W_{lk} = A \\cdot \\epsilon$. (d đúng)'
        ]
      }
    }
  ]
};

// =========================================================================
// DANH MỤC ĐỀ THI MẪU TOÀN DIỆN (FULL EXAM PACKAGES BANK)
// =========================================================================

export const INITIAL_EXAM_PACKAGES: ExamPackage[] = [
  // 1. Đề thi Quốc Gia chuẩn hóa (Lớp 12 - Khảo sát chất lượng)
  {
    id: 'pkg-12-survey-2025',
    grade: 12,
    category: 'survey',
    categoryLabel: 'Khảo sát chất lượng / Thi thử Tốt nghiệp THPT',
    chapterId: '12-c1',
    chapterTitle: 'Chương 1: Vật lí nhiệt & Sóng - Điện',
    lessonId: '12-rev-final2',
    lessonTitle: 'Luyện thi Tốt nghiệp THPT Chuẩn Barem 2025',
    code: 'TN-2025',
    title: 'KỲ THI ĐÁNH GIÁ NĂNG LỰC VẬT LÝ THPT (ĐỀ CHUẨN BỘ GD&ĐT)',
    subtitle: 'Đề thi chuẩn hóa theo Barem Bộ GD&ĐT 2025: Sóng cơ, Điện xoay chiều, Nhiệt học & Quang học',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Chuẩn Bộ GD&ĐT',
    tags: ['Thi thử', 'Bộ GD&ĐT', 'Sóng dừng', 'Nhiệt học', 'Boyle', 'Đồ thị SVG'],
    svgCount: 2,
    katexCount: 14,
    examData: samplePhysicsExam,
    createdAt: '2026-09-20'
  },
  // 2. Lớp 12 - Bài 2: Nội năng và Định luật I Nhiệt động lực học
  {
    id: 'pkg-12-lesson-thermo-first-law',
    grade: 12,
    category: 'lesson',
    categoryLabel: 'Luyện tập theo Bài',
    chapterId: '12-c1',
    chapterTitle: 'Chương 1: Vật lí nhiệt',
    lessonId: '12-b2',
    lessonTitle: 'Bài 2: Nội năng. Định luật I của nhiệt động lực học',
    code: '1201',
    title: 'Đề ôn tập: Định luật I Nhiệt động lực học - Mã Đề 1201',
    subtitle: 'Rèn luyện kĩ năng tính công, nhiệt lượng và phân tích chu trình trên giản đồ p-V',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Thông hiểu',
    tags: ['Nội năng', 'Định luật 1', 'Nhiệt động học', 'Giản đồ p-V', 'SVG'],
    svgCount: 1,
    katexCount: 9,
    examData: examGrade12Lesson2,
    createdAt: '2026-09-22'
  },
  // 3. Lớp 12 - Chương 2: Khí lí tưởng (Boyle, Charles)
  {
    id: 'pkg-12-chapter-ideal-gas',
    grade: 12,
    category: 'chapter',
    categoryLabel: 'Đánh giá theo Chương',
    chapterId: '12-c2',
    chapterTitle: 'Chương 2: Khí lí tưởng',
    lessonId: '12-rev-final1',
    lessonTitle: 'Bài 13: Ôn tập cuối kì 1 (Định luật chất khí)',
    code: '1202',
    title: 'Đề kiểm tra Chương 2: Khí lí tưởng & Định luật Boyle, Charles - Mã Đề 1202',
    subtitle: 'Đánh giá năng lực vận dụng phương trình trạng thái khí lí tưởng và đồ thị biến đổi',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Vận dụng',
    tags: ['Boyle', 'Charles', 'Khí lí tưởng', 'Đẳng nhiệt', 'Đẳng tích'],
    svgCount: 0,
    katexCount: 8,
    examData: examGrade12Chapter2,
    createdAt: '2026-09-24'
  },
  // 4. Lớp 12 - Cuối Học kỳ I (CHK1)
  {
    id: 'pkg-12-chk1',
    grade: 12,
    category: 'final1',
    categoryLabel: 'Kiểm tra Cuối Học kỳ I (CHK1)',
    chapterId: '12-c2',
    chapterTitle: 'Chương 2: Khí lí tưởng',
    lessonId: '12-rev-final1',
    lessonTitle: 'Ôn tập cuối kì 1 toàn diện',
    code: 'CHK1-12',
    title: 'Kiểm tra Cuối Học kỳ I (CHK1) - Vật lí 12 - Mã Đề CHK1-12',
    subtitle: 'Khảo sát chất lượng toàn diện học kỳ I: Vật lí nhiệt & Khí lí tưởng',
    durationMinutes: 50,
    totalPoints: 10,
    difficulty: 'Chuẩn Bộ GD&ĐT',
    tags: ['Cuối kì 1', 'CHK1', 'Vật lí nhiệt', 'Khí lí tưởng', 'Bộ GD&ĐT'],
    svgCount: 2,
    katexCount: 16,
    examData: examGrade12CHK1,
    createdAt: '2026-09-25'
  },
  // 5. Lớp 12 - Chương 4: Vật lí hạt nhân
  {
    id: 'pkg-12-nuclear',
    grade: 12,
    category: 'chapter',
    categoryLabel: 'Đánh giá theo Chương',
    chapterId: '12-c4',
    chapterTitle: 'Chương 4: Vật lí hạt nhân',
    lessonId: '12-rev-final2',
    lessonTitle: 'Ôn tập chương 4: Phóng xạ & Phản ứng hạt nhân',
    code: '1204',
    title: 'Đề chuyên đề: Vật lí hạt nhân & Năng lượng liên kết - Mã Đề 1204',
    subtitle: 'Cấu tạo hạt nhân, độ hụt khối, năng lượng liên kết riêng và định luật phóng xạ',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Vận dụng',
    tags: ['Hạt nhân', 'Phóng xạ', 'Độ hụt khối', 'Năng lượng liên kết', 'SVG'],
    svgCount: 1,
    katexCount: 7,
    examData: examGrade12Nuclear,
    createdAt: '2026-09-26'
  },
  // 6. Lớp 11 - Giữa Học kỳ I (GHK1)
  {
    id: 'pkg-11-ghk1',
    grade: 11,
    category: 'midterm1',
    categoryLabel: 'Kiểm tra Giữa Học kỳ I (GHK1)',
    chapterId: '11-c1',
    chapterTitle: 'Chương I: Dao động',
    lessonId: '11-rev-c1',
    lessonTitle: 'Ôn tập chương I: Dao động điều hòa',
    code: 'GHK1-11',
    title: 'Kiểm tra Giữa Học kỳ I (GHK1) - Vật lí 11 - Mã Đề GHK1-11',
    subtitle: 'Đánh giá trọng tâm: Dao động điều hòa, con lắc lò xo và bài toán năng lượng',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Thông hiểu',
    tags: ['GHK1', 'Dao động điều hòa', 'Con lắc', 'Năng lượng', 'Lớp 11'],
    svgCount: 1,
    katexCount: 10,
    examData: examGrade11GHK1,
    createdAt: '2026-09-21'
  },
  // 7. Lớp 11 - Bài 13: Sóng dừng
  {
    id: 'pkg-11-lesson-standing-wave',
    grade: 11,
    category: 'lesson',
    categoryLabel: 'Luyện tập theo Bài',
    chapterId: '11-c2',
    chapterTitle: 'Chương II: Sóng',
    lessonId: '11-b13',
    lessonTitle: 'Bài 13: Sóng dừng',
    code: '1102',
    title: 'Đề ôn luyện: Sóng cơ & Hiện tượng sóng dừng - Mã Đề 1102',
    subtitle: 'Khảo sát bước sóng, số bụng, số nút và điều kiện cố định / tự do',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Thông hiểu',
    tags: ['Sóng dừng', 'Nút sóng', 'Bụng sóng', 'Bước sóng', 'Họa âm'],
    svgCount: 1,
    katexCount: 9,
    examData: examGrade11WaveStanding,
    createdAt: '2026-09-23'
  },
  // 8. Lớp 10 - Giữa Học kỳ I (GHK1)
  {
    id: 'pkg-10-ghk1',
    grade: 10,
    category: 'midterm1',
    categoryLabel: 'Kiểm tra Giữa Học kỳ I (GHK1)',
    chapterId: '10-c2',
    chapterTitle: 'Chương II: Động học',
    lessonId: '10-rev-mid1',
    lessonTitle: 'Ôn tập giữa kì I (Động học chất điểm)',
    code: 'GHK1-10',
    title: 'Kiểm tra Giữa Học kỳ I (GHK1) - Vật lí 10 - Mã Đề GHK1-10',
    subtitle: 'Đánh giá năng lực: Độ dịch chuyển, đồ thị v-t, chuyển động thẳng biến đổi đều và rơi tự do',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Cơ bản',
    tags: ['GHK1', 'Lớp 10', 'Động học', 'Gia tốc', 'Rơi tự do'],
    svgCount: 1,
    katexCount: 8,
    examData: examGrade10GHK1,
    createdAt: '2026-09-18'
  },
  // 9. Lớp 10 - Bài 14, 15, 18: Các định luật Newton
  {
    id: 'pkg-10-lesson-newton-laws',
    grade: 10,
    category: 'lesson',
    categoryLabel: 'Luyện tập theo Bài',
    chapterId: '10-c3',
    chapterTitle: 'Chương III: Động lực học',
    lessonId: '10-b15',
    lessonTitle: 'Bài 15: Định luật 2 Newton',
    code: '1001',
    title: 'Đề ôn tập: Các định luật Newton & Lực ma sát - Mã Đề 1001',
    subtitle: 'Phân tích tổng hợp lực, định luật 1, 2, 3 Newton và bài toán ma sát trượt',
    durationMinutes: 45,
    totalPoints: 10,
    difficulty: 'Thông hiểu',
    tags: ['Newton', 'Động lực học', 'Ma sát', 'Phản lực', 'Mặt phẳng nghiêng'],
    svgCount: 1,
    katexCount: 9,
    examData: examGrade10Mechanics,
    createdAt: '2026-09-19'
  }
];

// Helper để lấy danh sách đề thi lưu trong safeStorage hoặc fallback mặc định
export function getSavedExamPackages(): ExamPackage[] {
  try {
    const raw = safeStorage.getItem('physixam_bank_data') || safeStorage.getItem('physixam_curriculum_exams');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Không thể đọc physixam_bank_data từ safeStorage:', e);
  }
  return INITIAL_EXAM_PACKAGES;
}

export function saveExamPackagesToStorage(packages: ExamPackage[]): void {
  try {
    const jsonStr = JSON.stringify(packages);
    safeStorage.setItem('physixam_bank_data', jsonStr);
    safeStorage.setItem('physixam_curriculum_exams', jsonStr);
  } catch (e) {
    console.error('Không thể lưu physixam_bank_data:', e);
  }
}

