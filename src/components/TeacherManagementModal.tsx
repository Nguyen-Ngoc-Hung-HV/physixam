import React, { useState } from 'react';
import { 
  X, Code, Plus, CheckCircle2, AlertCircle, 
  Download, Copy, Upload, RotateCcw, Eye, Sparkles, FileText,
  SlidersHorizontal, Check, Trash2, Printer, Wand2, Shuffle,
  ShieldAlert, ShieldCheck, FileUp, Loader2, AlertTriangle, 
  Layers, ArrowRight, Image as ImageIcon, BookmarkCheck
} from 'lucide-react';
import { 
  Exam, Question, MultipleChoiceQuestion, 
  TrueFalseClusterQuestion, ShortAnswerQuestion, PhysicsTopic,
  ExamVariantBundle, AntiCheatConfig
} from '../types/exam';
import { MathRenderer } from './MathRenderer';
import { DiagramViewer } from './DiagramViewer';
import { AIGeneratorTab } from './AIGeneratorTab';
import { ShufflingTab } from './ShufflingTab';
import { AntiCheatConfigTab } from './AntiCheatConfigTab';
import { sampleExamsList, samplePhysicsExam } from '../data/sampleExams';
import { parseWordPhysicsExam, WordParseSummary } from '../utils/wordExamParser';
import { validateAndNormalizeExamJson } from '../utils/examSchemaNormalizer';

interface TeacherManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExam: Exam;
  onUpdateExam: (newExam: Exam) => void;
  onOpenPrint?: (mode: 'exam_only' | 'exam_with_solutions') => void;
  onApplyBundle?: (bundle: ExamVariantBundle) => void;
  onOpenPrintMatrix?: (bundle: ExamVariantBundle) => void;
  antiCheatConfig?: AntiCheatConfig;
  onChangeAntiCheatConfig?: (newConfig: AntiCheatConfig) => void;
  onOpenSaveToBank?: () => void;
}

// Mẫu JSON chuẩn hóa đầy đủ theo yêu cầu của Bộ GD&ĐT
const STANDARD_JSON_TEMPLATE: Exam = {
  id: 'de-thi-chuan-mau-2026',
  title: 'KỲ THI ĐÁNH GIÁ NĂNG LỰC VẬT LÝ THPT',
  subtitle: 'Đề thi chuẩn hóa: Dao động, Sóng cơ & Điện từ học',
  gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
  durationMinutes: 50,
  totalPoints: 10,
  instructions: [
    'Phần I gồm các câu hỏi trắc nghiệm 4 phương án, chọn 1 phương án đúng.',
    'Phần II gồm các câu hỏi trắc nghiệm Đúng/Sai, mỗi câu có 4 ý a, b, c, d.',
    'Phần III gồm các câu hỏi trả lời ngắn, điền kết quả số học kèm đơn vị SI.'
  ],
  questions: [
    {
      id: 'cau-1-mcq-svg',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Dao động & Sóng cơ',
      title: 'Câu 1: Dao động điều hòa của con lắc lò xo',
      points: 0.25,
      stem: 'Một chất điểm dao động điều hòa dọc theo trục $Ox$ với phương trình $x = 6\\cos(4\\pi t - \\pi/3)\\text{ cm}$. Pha ban đầu của dao động là:',
      diagram: {
        type: 'svg',
        caption: 'Hình 1: Đồ thị dao động điều hòa li độ theo thời gian x(t)',
        content: `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" fill="#ffffff" />
  <line x1="30" y1="90" x2="470" y2="90" stroke="#334155" stroke-width="2"/>
  <line x1="50" y1="160" x2="50" y2="20" stroke="#334155" stroke-width="2"/>
  <text x="470" y="85" font-family="sans-serif" font-size="12">t (s)</text>
  <text x="55" y="30" font-family="sans-serif" font-size="12">x (cm)</text>
  <path d="M 50 135 C 90 135, 110 45, 150 45 C 190 45, 210 135, 250 135 C 290 135, 310 45, 350 45 C 390 45, 410 135, 450 135" fill="none" stroke="#2563eb" stroke-width="3"/>
  <circle cx="150" cy="45" r="4" fill="#0284c7"/>
  <text x="135" y="35" font-family="sans-serif" font-size="11" font-weight="bold">+6 cm</text>
</svg>`
      },
      options: [
        { id: 'A', text: '$-\\frac{\\pi}{3}\\text{ rad}$' },
        { id: 'B', text: '$\\frac{\\pi}{3}\\text{ rad}$' },
        { id: 'C', text: '$4\\pi\\text{ rad/s}$' },
        { id: 'D', text: '$6\\text{ cm}$' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Pha ban đầu là góc $\\varphi$ trong phương trình li độ dạng $x = A\\cos(\\omega t + \\varphi)$.',
        keyFormula: 'x = A\\cos(\\omega t + \\varphi) \\implies \\varphi = -\\frac{\\pi}{3}\\text{ rad}',
        stepByStep: [
          'Đối chiếu phương trình dao động $x = 6\\cos(4\\pi t - \\pi/3)\\text{ cm}$ với phương trình tổng quát.',
          'Biên độ dao động $A = 6\\text{ cm}$, tần số góc $\\omega = 4\\pi\\text{ rad/s}$.',
          'Pha ban đầu $\\varphi = -\\frac{\\pi}{3}\\text{ rad}$. Chọn phương án A.'
        ]
      }
    },
    {
      id: 'cau-2-tf-image',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Điện từ học & Mạch điện xoay chiều',
      title: 'Câu 2: Hiện tượng cảm ứng điện từ và từ trường',
      points: 1.0,
      stem: 'Một khung dây dẫn phẳng kín hình tròn có diện tích $S = 20\\text{ cm}^2$ gồm $N = 100$ vòng dây đặt trong từ trường đều có cảm ứng từ $B = 0{,}05\\text{ T}$. Vectơ cảm ứng từ hợp với pháp tuyến của mặt phẳng khung dây một góc $\\alpha = 60^\\circ$.',
      diagram: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        caption: 'Hình 2: Mô phỏng từ trường biến thiên qua khung dây dẫn tròn'
      },
      items: [
        {
          id: 'a',
          statement: 'Từ thông cực đại qua một vòng dây khi $\\alpha = 0^\\circ$ là $\\Phi_0 = 10^{-4}\\text{ Wb}$.',
          correctAnswer: true,
          explanation: 'Từ thông cực đại qua một vòng: $\\Phi_0 = B S = 0{,}05 \\times 20 \\times 10^{-4} = 10^{-4}\\text{ Wb}$. (ĐÚNG)'
        },
        {
          id: 'b',
          statement: 'Tổng từ thông xuyên qua toàn bộ khung dây ở góc $\\alpha = 60^\\circ$ là $5{,}0\\text{ mWb}$.',
          correctAnswer: true,
          explanation: '$\\Phi = N B S \\cos(60^\\circ) = 100 \\times 10^{-4} \\times 0{,}5 = 5 \\times 10^{-3}\\text{ Wb} = 5{,}0\\text{ mWb}$. (ĐÚNG)'
        },
        {
          id: 'c',
          statement: 'Nếu từ trường giảm đều về 0 trong khoảng thời gian $\\Delta t = 0{,}02\\text{ s}$, độ lớn suất điện động cảm ứng xuất hiện trong khung dây là $0{,}5\\text{ V}$.',
          correctAnswer: false,
          explanation: '$|e_c| = \\frac{\\Delta\\Phi}{\\Delta t} = \\frac{5 \\times 10^{-3}}{0{,}02} = 0{,}25\\text{ V}$, không phải $0{,}5\\text{ V}$. (SAI)'
        },
        {
          id: 'd',
          statement: 'Dòng điện cảm ứng xuất hiện trong khung dây có chiều chống lại sự giảm của từ thông ban đầu.',
          correctAnswer: true,
          explanation: 'Theo định luật Len-xơ, dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra có tác dụng chống lại sự biến thiên của từ thông sinh ra nó. (ĐÚNG)'
        }
      ],
      explanation: {
        overview: 'Áp dụng công thức tính từ thông qua khung dây và định luật Fa-ra-đây về cảm ứng điện từ.',
        keyFormula: '\\Phi = N B S \\cos\\alpha,\\quad |e_c| = \\left|\\frac{\\Delta\\Phi}{\\Delta t}\\right|',
        stepByStep: [
          'Ý a: Từ thông cực đại: $\\Phi_{1} = BS = 10^{-4}\\text{ Wb}$. (ĐÚNG)',
          'Ý b: Từ thông toàn phần: $\\Phi = 100 \\times 10^{-4} \\times 0{,}5 = 5\\text{ mWb}$. (ĐÚNG)',
          'Ý c: Suất điện động cảm ứng $|e_c| = 0{,}25\\text{ V}$. (SAI)',
          'Ý d: Tuân theo định luật Len-xơ. (ĐÚNG)'
        ]
      }
    },
    {
      id: 'cau-3-sa-thermo',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Nhiệt học & Thuyết động học',
      title: 'Câu 3: Động năng tịnh tiến trung bình của phân tử khí',
      points: 0.25,
      stem: 'Tính động năng tịnh tiến trung bình $\\bar{E}_d$ của một phân tử khí lí tưởng ở nhiệt độ phòng $T = 300\\text{ K}$ theo đơn vị $10^{-21}\\text{ J}$. Lấy hằng số Boltzmann $k_B = 1{,}38 \\times 10^{-23}\\text{ J/K}$. (Làm tròn kết quả đến 2 chữ số thập phân).',
      correctValue: 6.21,
      tolerance: 0.05,
      acceptedUnits: ['10^-21 J', 'J', ''],
      unitHint: '10^-21 J',
      placeholder: 'ví dụ: 6.21',
      explanation: {
        overview: 'Theo thuyết động học phân tử chất khí, động năng tịnh tiến trung bình của phân tử khí chỉ phụ thuộc vào nhiệt độ tuyệt đối $T$.',
        keyFormula: '\\bar{E}_d = \\frac{3}{2} k_B T',
        stepByStep: [
          'Áp dụng công thức: $$\\bar{E}_d = \\frac{3}{2} (1{,}38 \\times 10^{-23}\\text{ J/K}) \\times 300\\text{ K} = 6{,}21 \\times 10^{-21}\\text{ J}$$.',
          'Giá trị cần điền là $6{,}21$.'
        ]
      }
    }
  ]
};

const SVG_PRESETS = [
  {
    name: 'Đồ thị dao động x-t',
    caption: 'Hình: Đồ thị dao động điều hòa x(t)',
    svg: `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" fill="#ffffff" />
  <line x1="30" y1="90" x2="470" y2="90" stroke="#334155" stroke-width="2"/>
  <line x1="50" y1="160" x2="50" y2="20" stroke="#334155" stroke-width="2"/>
  <text x="470" y="85" font-family="sans-serif" font-size="12">t (s)</text>
  <text x="55" y="30" font-family="sans-serif" font-size="12">x (cm)</text>
  <path d="M 50 90 Q 100 10 150 90 T 250 90 T 350 90 T 450 90" fill="none" stroke="#2563eb" stroke-width="3"/>
  <circle cx="100" cy="50" r="4" fill="#0284c7"/>
  <text x="90" y="35" font-family="sans-serif" font-size="11" font-weight="bold">+A</text>
</svg>`
  },
  {
    name: 'Mạch điện R-L-C',
    caption: 'Hình: Sơ đồ mạch điện xoay chiều RLC nối tiếp',
    svg: `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" fill="#ffffff" rx="8"/>
  <rect x="50" y="30" width="400" height="120" fill="none" stroke="#334155" stroke-width="2.5"/>
  <circle cx="50" cy="90" r="18" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
  <text x="43" y="95" font-family="sans-serif" font-size="14" font-weight="bold">~</text>
  <rect x="150" y="20" width="40" height="20" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
  <text x="160" y="15" font-family="sans-serif" font-size="11" font-weight="bold">R</text>
  <circle cx="270" cy="30" r="12" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
  <text x="267" y="15" font-family="sans-serif" font-size="11" font-weight="bold">L</text>
  <line x1="375" y1="15" x2="375" y2="45" stroke="#7c3aed" stroke-width="2.5"/>
  <line x1="385" y1="15" x2="385" y2="45" stroke="#7c3aed" stroke-width="2.5"/>
  <text x="375" y="10" font-family="sans-serif" font-size="11" font-weight="bold">C</text>
</svg>`
  },
  {
    name: 'Chu trình P-V nhiệt học',
    caption: 'Hình: Đồ thị P-V chu trình biến đổi nhiệt động',
    svg: `<svg viewBox="0 0 450 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="450" height="220" fill="#ffffff"/>
  <line x1="50" y1="180" x2="400" y2="180" stroke="#334155" stroke-width="2"/>
  <line x1="50" y1="180" x2="50" y2="30" stroke="#334155" stroke-width="2"/>
  <text x="390" y="200" font-family="sans-serif" font-size="12">V (m³)</text>
  <text x="20" y="35" font-family="sans-serif" font-size="12">P (Pa)</text>
  <polygon points="120,60 300,120 120,120" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <text x="110" y="55" font-family="sans-serif" font-size="12" font-weight="bold">(1)</text>
  <text x="305" y="125" font-family="sans-serif" font-size="12" font-weight="bold">(2)</text>
  <text x="110" y="135" font-family="sans-serif" font-size="12" font-weight="bold">(3)</text>
</svg>`
  }
];

export const TeacherManagementModal: React.FC<TeacherManagementModalProps> = ({
  isOpen,
  onClose,
  currentExam,
  onUpdateExam,
  onOpenPrint,
  onApplyBundle,
  onOpenPrintMatrix,
  antiCheatConfig,
  onChangeAntiCheatConfig,
  onOpenSaveToBank,
}) => {
  const [activeTab, setActiveTab] = useState<'import_json' | 'question_builder' | 'ai_generator' | 'shuffling' | 'anticheat'>('import_json');
  
  // State Tab 1: JSON Importer
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(currentExam, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);

  // State Trích xuất & Phân tích Đề thi từ tệp Word (.docx / .doc)
  const [isParsingWord, setIsParsingWord] = useState<boolean>(false);
  const [wordParseStep, setWordParseStep] = useState<string>('');
  const [wordParsePercent, setWordParsePercent] = useState<number>(0);
  const [wordParseSummary, setWordParseSummary] = useState<WordParseSummary | null>(null);
  const [wordParseWarnings, setWordParseWarnings] = useState<string[]>([]);
  const [extractedWordExam, setExtractedWordExam] = useState<Exam | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // State Tab 2: Question Builder
  const [builderPart, setBuilderPart] = useState<'Phần I' | 'Phần II' | 'Phần III'>('Phần I');
  const [builderTopic, setBuilderTopic] = useState<PhysicsTopic>('Dao động & Sóng cơ');
  const [builderTitle, setBuilderTitle] = useState('Câu hỏi mới: Khảo sát dao động điều hòa');
  const [builderStem, setBuilderStem] = useState('Một vật dao động điều hòa có chu kì $T = 0{,}5\\text{ s}$. Tần số dao động $f$ của vật là:');
  const [builderPoints, setBuilderPoints] = useState<number>(0.25);
  
  // Sơ đồ
  const [diagramType, setDiagramType] = useState<'none' | 'svg' | 'image'>('svg');
  const [diagramSvgContent, setDiagramSvgContent] = useState(SVG_PRESETS[0].svg);
  const [diagramImageUrl, setDiagramImageUrl] = useState('');
  const [diagramCaption, setDiagramCaption] = useState('Hình 1: Đồ thị dao động điều hòa');

  // Phương án Part I
  const [mcqOptions, setMcqOptions] = useState([
    { id: 'A', text: '$f = 2{,}0\\text{ Hz}$' },
    { id: 'B', text: '$f = 0{,}5\\text{ Hz}$' },
    { id: 'C', text: '$f = 4{,}0\\text{ Hz}$' },
    { id: 'D', text: '$f = 1{,}0\\text{ Hz}$' }
  ]);
  const [mcqCorrect, setMcqCorrect] = useState('A');

  // Nhận định Part II
  const [tfItems, setTfItems] = useState([
    { id: 'a', statement: 'Tần số dao động của vật là $f = 2{,}0\\text{ Hz}$.', correctAnswer: true, explanation: '$f = 1/T = 1/0{,}5 = 2{,}0\\text{ Hz}$.' },
    { id: 'b', statement: 'Tần số góc của dao động là $\\omega = 4\\pi\\text{ rad/s}$.', correctAnswer: true, explanation: '$\\omega = 2\\pi f = 4\\pi\\text{ rad/s}$.' },
    { id: 'c', statement: 'Trong 1 giây vật thực hiện được 0,5 dao động toàn phần.', correctAnswer: false, explanation: 'Trong 1 giây vật thực hiện được $f = 2$ dao động toàn phần.' },
    { id: 'd', statement: 'Chu kì dao động tăng khi biên độ dao động tăng.', correctAnswer: false, explanation: 'Chu kì dao động điều hòa không phụ thuộc vào biên độ.' }
  ]);

  // Part III
  const [saValue, setSaValue] = useState<string>('2.0');
  const [saTolerance, setSaTolerance] = useState<number>(0.05);
  const [saUnit, setSaUnit] = useState<string>('Hz');

  // Lời giải
  const [expOverview, setExpOverview] = useState('Áp dụng công thức liên hệ giữa chu kì và tần số: $f = \\frac{1}{T}$.');
  const [expFormula, setExpFormula] = useState('f = \\frac{1}{T} = \\frac{1}{0{,}5} = 2{,}0\\text{ Hz}');

  if (!isOpen) return null;

  // Xử lý kiểm tra & chuẩn hóa cấu trúc JSON đề thi
  const handleFormatAndNormalizeJson = () => {
    try {
      setJsonError(null);
      const { exam, summary } = validateAndNormalizeExamJson(jsonText);
      setJsonText(JSON.stringify(exam, null, 2));
      setWordParseSummary(null);
      setWordParseWarnings(summary.warnings);
      setExtractedWordExam(exam);
      setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${summary.title}, Tổng số: ${summary.totalQuestions} câu hỏi)`);
    } catch (err: any) {
      setJsonError(err.message || 'Lỗi cú pháp JSON. Vui lòng kiểm tra lại cấu trúc.');
    }
  };

  // Xử lý áp dụng JSON vào kỳ thi
  const handleApplyJson = () => {
    try {
      setJsonError(null);
      const { exam, summary } = validateAndNormalizeExamJson(jsonText);
      onUpdateExam(exam);
      setJsonText(JSON.stringify(exam, null, 2));
      setWordParseSummary(null);
      setExtractedWordExam(exam);
      setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${summary.title}, Tổng số: ${summary.totalQuestions} câu hỏi)`);
      setTimeout(() => {
        setJsonSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setJsonError(err.message || 'Lỗi cú pháp JSON. Vui lòng kiểm tra lại cấu trúc.');
    }
  };

  // Tải đề mẫu chuẩn
  const handleLoadSampleTemplate = () => {
    setJsonText(JSON.stringify(STANDARD_JSON_TEMPLATE, null, 2));
    setJsonError(null);
    setJsonSuccess('Đã tải đề thi mẫu chuẩn định dạng!');
  };

  // Tải lại đề hiện tại
  const handleResetToCurrent = () => {
    setJsonText(JSON.stringify(currentExam, null, 2));
    setJsonError(null);
  };

  // Tải file JSON từ máy tính (hỗ trợ cả định dạng thống nhất & chia theo phần part_1, part_2, part_3)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { exam, summary } = validateAndNormalizeExamJson(content);
        setJsonText(JSON.stringify(exam, null, 2));
        setWordParseSummary(null);
        setWordParseWarnings(summary.warnings);
        setExtractedWordExam(exam);
        setJsonError(null); // Xóa ngay thông báo lỗi đỏ
        setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${summary.title}, Tổng số: ${summary.totalQuestions} câu hỏi)`);
      } catch (err: any) {
        setJsonError(err.message || 'Tệp tải lên không phải là định dạng JSON hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Tải và tự động phân tích tệp Word (.docx / .doc) sang JSON
  const handleWordFile = async (file: File) => {
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.docx') && !nameLower.endsWith('.doc')) {
      setJsonError('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp Word (.docx hoặc .doc).');
      return;
    }

    try {
      setIsParsingWord(true);
      setJsonError(null);
      setJsonSuccess(null);
      setWordParseStep('Đang đọc tệp Word...');
      setWordParsePercent(10);

      const result = await parseWordPhysicsExam(file, (step, percent) => {
        setWordParseStep(step);
        setWordParsePercent(percent);
      });

      // Đảm bảo cấu trúc đề thi trích xuất từ Word được chuẩn hóa đồng bộ
      const { exam: normalizedExam, summary: normSummary } = validateAndNormalizeExamJson(result.exam);

      // Đưa JSON đã trích xuất vào khung soạn thảo
      setJsonText(JSON.stringify(normalizedExam, null, 2));
      setWordParseSummary(result.summary);
      setWordParseWarnings([...result.warnings, ...normSummary.warnings]);
      setExtractedWordExam(normalizedExam);

      setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${normSummary.title}, Tổng số: ${normSummary.totalQuestions} câu hỏi)`);
    } catch (err: any) {
      setJsonError(err.message || 'Không thể trích xuất đề thi từ tệp Word này. Vui lòng kiểm tra lại cấu trúc tệp.');
    } finally {
      setIsParsingWord(false);
    }
  };

  // Áp dụng ngay đề thi trích xuất từ Word vào kỳ thi
  const handleApplyExtractedWordExam = () => {
    if (extractedWordExam) {
      const { exam, summary } = validateAndNormalizeExamJson(extractedWordExam);
      onUpdateExam(exam);
      setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${summary.title}, Tổng số: ${summary.totalQuestions} câu hỏi)`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      handleApplyJson();
    }
  };

  // Xử lý kéo thả tệp Word hoặc JSON
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
        handleWordFile(file);
      } else if (lower.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const content = ev.target?.result as string;
            const { exam, summary } = validateAndNormalizeExamJson(content);
            setJsonText(JSON.stringify(exam, null, 2));
            setWordParseSummary(null);
            setWordParseWarnings(summary.warnings);
            setExtractedWordExam(exam);
            setJsonError(null);
            setJsonSuccess(`Đã tải và nhận diện cấu trúc đề thi thành công! (Tiêu đề: ${summary.title}, Tổng số: ${summary.totalQuestions} câu hỏi)`);
          } catch (err: any) {
            setJsonError(err.message || 'Tệp tải lên không phải là định dạng JSON hợp lệ.');
          }
        };
        reader.readAsText(file);
      } else {
        setJsonError('Vui lòng kéo & thả tệp Word (.docx, .doc) hoặc tệp JSON.');
      }
    }
  };

  // Xuất file JSON
  const handleExportJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `de-thi-vat-li-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Thêm câu hỏi từ Builder vào đề thi
  const handleAddQuestionFromBuilder = () => {
    const newId = `cau-${Date.now()}`;
    let newQ: Question;

    const baseDiagram = diagramType === 'none' ? undefined : {
      type: diagramType,
      caption: diagramCaption,
      content: diagramType === 'svg' ? diagramSvgContent : undefined,
      url: diagramType === 'image' ? diagramImageUrl : undefined,
    };

    if (builderPart === 'Phần I') {
      newQ = {
        id: newId,
        type: 'multiple_choice',
        part: 'Phần I',
        topic: builderTopic,
        title: builderTitle,
        points: builderPoints,
        stem: builderStem,
        diagram: baseDiagram,
        options: mcqOptions,
        correctAnswer: mcqCorrect,
        explanation: {
          overview: expOverview,
          keyFormula: expFormula,
          stepByStep: [expOverview, `Áp dụng: $$${expFormula}$$`]
        }
      };
    } else if (builderPart === 'Phần II') {
      newQ = {
        id: newId,
        type: 'true_false_cluster',
        part: 'Phần II',
        topic: builderTopic,
        title: builderTitle,
        points: builderPoints,
        stem: builderStem,
        diagram: baseDiagram,
        items: tfItems,
        explanation: {
          overview: expOverview,
          keyFormula: expFormula,
          stepByStep: tfItems.map((item) => `${item.id}) ${item.statement} -> ${item.correctAnswer ? 'ĐÚNG' : 'SAI'}: ${item.explanation || ''}`)
        }
      };
    } else {
      newQ = {
        id: newId,
        type: 'short_answer',
        part: 'Phần III',
        topic: builderTopic,
        title: builderTitle,
        points: builderPoints,
        stem: builderStem,
        diagram: baseDiagram,
        correctValue: parseFloat(saValue) || saValue,
        tolerance: saTolerance,
        acceptedUnits: [saUnit],
        unitHint: saUnit,
        placeholder: `ví dụ: ${saValue} ${saUnit}`,
        explanation: {
          overview: expOverview,
          keyFormula: expFormula,
          stepByStep: [expOverview, `Kết quả tính toán: $$${saValue}\\text{ ${saUnit}}$$`]
        }
      };
    }

    const updatedExam: Exam = {
      ...currentExam,
      questions: [...currentExam.questions, newQ],
    };

    onUpdateExam(updatedExam);
    setJsonText(JSON.stringify(updatedExam, null, 2));
    alert(`Đã thêm thành công "${builderTitle}" vào đề thi! Tổng số câu hiện tại: ${updatedExam.questions.length}`);
  };

  // Thêm các câu hỏi được AI sinh vào đề thi hiện tại
  const handleAppendQuestionsFromAI = (newQuestions: Question[]) => {
    const updatedExam: Exam = {
      ...currentExam,
      questions: [...currentExam.questions, ...newQuestions],
    };
    onUpdateExam(updatedExam);
    setJsonText(JSON.stringify(updatedExam, null, 2));
  };

  // Ghi đè toàn bộ đề thi mới từ AI
  const handleReplaceExamFromAI = (newExam: Exam) => {
    onUpdateExam(newExam);
    setJsonText(JSON.stringify(newExam, null, 2));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Tiêu đề Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/80 text-white shadow-sm">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Quản Lý Đề Thi & Soạn Thảo Vật Lí</h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Chế độ Giáo viên
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nhập đề thi qua tệp JSON, xem trước sơ đồ vector SVG và biên soạn câu hỏi theo cấu trúc chuẩn GDPT 2018
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh chuyển đổi Tab */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('import_json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'import_json'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Tab 1: Nhập đề thi JSON</span>
            </button>

            <button
              onClick={() => setActiveTab('question_builder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'question_builder'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tab 2: Trình tạo câu hỏi trực tiếp</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_generator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'ai_generator'
                  ? 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Tab 3: AI Soạn & Quét đề</span>
            </button>

            <button
              onClick={() => setActiveTab('shuffling')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'shuffling'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shuffle className="w-4 h-4 text-emerald-400" />
              <span>Tab 4: Trộn & Xuất mã đề</span>
            </button>

            <button
              onClick={() => setActiveTab('anticheat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'anticheat'
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Tab 5: Cấu hình Giám sát thi</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenSaveToBank && (
              <button
                type="button"
                onClick={() => {
                  try {
                    const { exam } = validateAndNormalizeExamJson(jsonText);
                    onUpdateExam(exam);
                  } catch {}
                  onOpenSaveToBank();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition cursor-pointer shadow-2xs"
                title="Lưu cấu trúc đề thi này vào Ngân hàng đề thi GDPT 2018"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>💾 Lưu vào Ngân hàng đề</span>
              </button>
            )}

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Đề hiện tại: <span className="font-bold text-slate-800">{currentExam.questions.length} câu</span>
            </div>
          </div>
        </div>

        {/* Vùng nội dung Tab */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-5">
          
          {/* ================= TAB 1: NHẬP ĐỀ THI JSON & WORD ================= */}
          {activeTab === 'import_json' && (
            <div 
              className="space-y-4"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              
              {/* Thanh thao tác nhanh */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  
                  {/* NÚT NỔI BẬT: Tải file Word (.docx / .doc) tự động chuyển sang JSON */}
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-indigo-200 transition cursor-pointer relative group border border-blue-400/30">
                    <FileText className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition" />
                    <span>📄 Tải file Word (.docx / .doc)</span>
                    <span className="px-1.5 py-0.5 rounded-full text-3xs font-extrabold bg-amber-400 text-slate-900 uppercase tracking-tight shadow-2xs">
                      Tự động chuyển sang JSON
                    </span>
                    <input
                      type="file"
                      accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleWordFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải file JSON</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <button
                    onClick={handleFormatAndNormalizeJson}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                    title="Tự động kiểm tra, chuẩn hóa và tối ưu cấu trúc đề thi JSON"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kiểm tra & Chuẩn hóa</span>
                  </button>

                  <button
                    onClick={handleLoadSampleTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tải đề mẫu</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jsonText);
                      alert('Đã sao chép cấu trúc đề thi JSON!');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép JSON</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất file JSON</span>
                  </button>

                  {onOpenPrint && (
                    <button
                      onClick={() => onOpenPrint('exam_with_solutions')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                      title="Mở hộp thoại in đề thi hoặc in kèm đáp án & lời giải chi tiết"
                    >
                      <Printer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>In đề thi / PDF</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetToCurrent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục ban đầu</span>
                  </button>
                </div>

                <div className="text-2xs text-slate-400">
                  Hỗ trợ Word 3 Phần GDPT 2018 & Nhúng hình ảnh Base64
                </div>
              </div>

              {/* Vùng kéo thả tệp thông minh */}
              <div
                className={`p-3 sm:p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDraggingFile
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-400 scale-[1.01]'
                    : 'border-slate-300 bg-white/70 text-slate-600 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>Kéo & thả tệp Word (.docx, .doc) hoặc JSON vào đây</span>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-100 text-emerald-800">
                        Nhận diện *, màu đỏ, gạch chân
                      </span>
                    </div>
                    <div className="text-2xs text-slate-500">
                      Tự động trích xuất Phần I (MCQ), Phần II (Đúng/Sai), Phần III (Trả lời ngắn), sơ đồ hình vẽ Base64 và chuẩn hoá KaTeX
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer">
                    Chọn tệp Word từ máy
                    <input
                      type="file"
                      accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleWordFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Thanh tiến trình phân tích tệp Word */}
              {isParsingWord && (
                <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-2xl shadow-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      <span>{wordParseStep || 'Đang xử lý tệp Word...'}</span>
                    </div>
                    <span className="font-extrabold text-indigo-600">{wordParsePercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${wordParsePercent}%` }}
                    />
                  </div>
                  <p className="text-2xs text-slate-500 italic">
                    Hệ thống đang quét các câu hỏi, tự động trích xuất sơ đồ hình vẽ Base64, nhận diện đáp án hoa thị (*), màu đỏ, gạch chân và chuyển đổi công thức sang KaTeX...
                  </p>
                </div>
              )}

              {/* Thẻ xem trước kết quả trích xuất đề thi Word (Preview Summary Card) */}
              {wordParseSummary && (
                <div className="p-4 bg-white border-2 border-indigo-200 rounded-2xl shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>Đã trích xuất thành công cấu trúc đề thi từ tệp Word</span>
                          <span className="px-2 py-0.5 rounded-full text-3xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            GDPT 2018
                          </span>
                        </h4>
                        <p className="text-2xs text-slate-600">
                          Đã trích xuất: <strong className="text-blue-700">{wordParseSummary.part1Count} câu Phần I</strong>,{' '}
                          <strong className="text-emerald-700">{wordParseSummary.part2Count} câu Phần II</strong>,{' '}
                          <strong className="text-sky-700">{wordParseSummary.part3Count} câu Phần III</strong>{' '}
                          (Kèm <strong className="text-purple-700">{wordParseSummary.imageCount} hình vẽ nhúng</strong>)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApplyExtractedWordExam}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Áp dụng vào kỳ thi ngay</span>
                      </button>
                    </div>
                  </div>

                  {/* Lưới các thẻ đếm chỉ số */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-2xs">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900">
                      <div className="text-slate-500 font-medium">Phần I (Trắc nghiệm 4 LC):</div>
                      <div className="font-extrabold text-sm text-blue-700">{wordParseSummary.part1Count} câu</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-900">
                      <div className="text-slate-500 font-medium">Phần II (Đúng/Sai 4 ý):</div>
                      <div className="font-extrabold text-sm text-emerald-700">{wordParseSummary.part2Count} câu</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 text-sky-900">
                      <div className="text-slate-500 font-medium">Phần III (Trả lời ngắn):</div>
                      <div className="font-extrabold text-sm text-sky-700">{wordParseSummary.part3Count} câu</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 text-purple-900">
                      <div className="text-slate-500 font-medium">Hình vẽ & Sơ đồ nhúng:</div>
                      <div className="font-extrabold text-sm text-purple-700 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>{wordParseSummary.imageCount} hình</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${wordParseSummary.needsReviewCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="text-slate-500 font-medium">Cần rà soát đáp án:</div>
                      <div className={`font-extrabold text-sm ${wordParseSummary.needsReviewCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {wordParseSummary.needsReviewCount} câu
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo rà soát nếu có */}
                  {wordParseWarnings.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-2xs text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Thông báo rà soát ({wordParseWarnings.length} câu đã được gắn cờ "needs_review": true để thầy/cô dễ kiểm tra):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 max-h-24 overflow-y-auto">
                        {wordParseWarnings.slice(0, 4).map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                        {wordParseWarnings.length > 4 && (
                          <li className="italic text-amber-700">Và {wordParseWarnings.length - 4} câu khác xem chi tiết trong khung JSON bên dưới...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Thông báo lỗi / thành công */}
              {jsonError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold">Lỗi kiểm tra cấu trúc JSON / tệp Word: </span>
                    <span>{jsonError}</span>
                  </div>
                </div>
              )}

              {jsonSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-150 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{jsonSuccess}</span>
                </div>
              )}

              {/* Vùng soạn thảo mã JSON */}
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-slate-400 text-2xs rounded-t-2xl border-t border-x border-slate-800">
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-mono text-slate-300">exam_structure.json</span>
                    {wordParseSummary && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-3xs font-semibold">
                        Nội dung từ tệp Word ({wordParseSummary.totalQuestions} câu)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    Thầy/cô có thể xem, chỉnh sửa trực tiếp dữ liệu JSON trước khi cập nhật
                  </div>
                </div>
                <textarea
                  rows={16}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (jsonError) setJsonError(null);
                  }}
                  placeholder="Dán mã nguồn đề thi định dạng JSON hoặc tải lên tệp Word (.docx / .doc) tại đây..."
                  className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 rounded-b-2xl border-b border-x border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed overflow-x-auto shadow-inner"
                />
              </div>

              {/* Nút Cập nhật đề thi & Lưu vào Ngân hàng */}
              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <p className="text-xs text-slate-500">
                  * Khi cập nhật, toàn bộ bài thi sẽ được làm mới, thời gian đếm ngược và bảng câu hỏi sẽ được thiết lập lại.
                </p>

                <div className="flex items-center gap-2">
                  {onOpenSaveToBank && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const { exam } = validateAndNormalizeExamJson(jsonText);
                          onUpdateExam(exam);
                        } catch {}
                        onOpenSaveToBank();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 shadow-2xs transition cursor-pointer"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span>💾 Lưu vào Ngân hàng đề</span>
                    </button>
                  )}

                  <button
                    onClick={handleApplyJson}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Áp dụng vào kỳ thi</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 2: TRÌNH TẠO CÂU HỎI TRỰC TIẾP ================= */}
          {activeTab === 'question_builder' && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Thiết lập thông tin câu hỏi mới</span>
                </h3>

                {/* Phần thi & Chủ đề */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Dạng câu hỏi (Phần thi):</label>
                    <select
                      value={builderPart}
                      onChange={(e) => setBuilderPart(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Phần I">Phần I: Trắc nghiệm 4 lựa chọn</option>
                      <option value="Phần II">Phần II: Đúng/Sai (Cụm 4 ý)</option>
                      <option value="Phần III">Phần III: Trả lời ngắn</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Chủ đề Vật lí:</label>
                    <select
                      value={builderTopic}
                      onChange={(e) => setBuilderTopic(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Dao động & Sóng cơ">Dao động & Sóng cơ</option>
                      <option value="Điện từ học & Mạch điện xoay chiều">Điện từ học & Mạch điện xoay chiều</option>
                      <option value="Nhiệt học & Thuyết động học">Nhiệt học & Thuyết động học</option>
                      <option value="Quang học & Sóng ánh sáng">Quang học & Sóng ánh sáng</option>
                      <option value="Cơ học & Động lực học">Cơ học & Động lực học</option>
                      <option value="Vật lí hạt nhân & Hiện đại">Vật lí hạt nhân & Hiện đại</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Điểm số câu:</label>
                    <input
                      type="number"
                      step="0.05"
                      value={builderPoints}
                      onChange={(e) => setBuilderPoints(parseFloat(e.target.value) || 0.25)}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Tiêu đề & Đề bài */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tiêu đề câu hỏi:</label>
                    <input
                      type="text"
                      value={builderTitle}
                      onChange={(e) => setBuilderTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">
                        Nội dung đề bài (Hỗ trợ công thức KaTeX $inline$ và $$display$$):
                      </label>
                      <span className="text-3xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">KaTeX</span>
                    </div>
                    <textarea
                      rows={3}
                      value={builderStem}
                      onChange={(e) => setBuilderStem(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />

                    {/* Xem trước KaTeX trực tiếp */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800">
                      <span className="text-3xs uppercase font-bold text-slate-400 block mb-1">Xem trước đề bài:</span>
                      <MathRenderer content={builderStem} />
                    </div>
                  </div>
                </div>

                {/* Thiết lập sơ đồ hình vẽ (SVG hoặc Ảnh URL) */}
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span>Sơ đồ & Hình vẽ minh họa</span>
                    </label>

                    {/* Lựa chọn loại sơ đồ */}
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setDiagramType('none')}
                        className={`px-2.5 py-1 rounded-md transition ${diagramType === 'none' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                      >
                        Không có sơ đồ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiagramType('svg')}
                        className={`px-2.5 py-1 rounded-md transition ${diagramType === 'svg' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                      >
                        Sơ đồ véc-tơ SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiagramType('image')}
                        className={`px-2.5 py-1 rounded-md transition ${diagramType === 'image' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                      >
                        Ảnh từ URL
                      </button>
                    </div>
                  </div>

                  {/* Nhập chú thích */}
                  {diagramType !== 'none' && (
                    <div className="space-y-1">
                      <label className="text-2xs font-semibold text-slate-600">Chú thích hình vẽ (Caption):</label>
                      <input
                        type="text"
                        value={diagramCaption}
                        onChange={(e) => setDiagramCaption(e.target.value)}
                        placeholder="ví dụ: Hình 1: Đồ thị dao động điều hòa"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Sơ đồ SVG */}
                  {diagramType === 'svg' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-semibold text-slate-600">Mẫu SVG có sẵn:</span>
                        <div className="flex items-center gap-1.5">
                          {SVG_PRESETS.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => {
                                setDiagramSvgContent(p.svg);
                                setDiagramCaption(p.caption);
                              }}
                              className="px-2 py-0.5 rounded text-2xs bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <textarea
                          rows={6}
                          value={diagramSvgContent}
                          onChange={(e) => setDiagramSvgContent(e.target.value)}
                          className="w-full p-2.5 font-mono text-2xs bg-slate-900 text-sky-300 rounded-xl border border-slate-700"
                        />
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px]">
                          <span className="text-3xs uppercase font-bold text-slate-400 mb-2">Xem trước SVG</span>
                          <div
                            className="w-full max-w-[280px] flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: diagramSvgContent }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ảnh URL */}
                  {diagramType === 'image' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-2xs font-semibold text-slate-600">Đường dẫn ảnh trực tuyến (Image URL):</label>
                        <input
                          type="text"
                          value={diagramImageUrl}
                          onChange={(e) => setDiagramImageUrl(e.target.value)}
                          placeholder="https://example.com/physics-diagram.png"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-center min-h-[120px]">
                        {diagramImageUrl ? (
                          <img src={diagramImageUrl} alt="Xem trước" className="max-h-28 object-contain rounded" />
                        ) : (
                          <span className="text-xs text-slate-400">Chưa nhập đường dẫn ảnh</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cấu hình câu trả lời theo Dạng câu hỏi */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  
                  {/* Dạng 1: Trắc nghiệm 4 lựa chọn */}
                  {builderPart === 'Phần I' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-800">
                        Cấu hình 4 phương án A, B, C, D (Chọn nút tròn để đặt đáp án đúng):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mcqOptions.map((opt, idx) => (
                          <div key={opt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                            <input
                              type="radio"
                              name="mcq-correct"
                              checked={mcqCorrect === opt.id}
                              onChange={() => setMcqCorrect(opt.id)}
                              className="w-4 h-4 text-indigo-600 cursor-pointer"
                            />
                            <span className="font-bold text-xs text-indigo-700 w-4">{opt.id}:</span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...mcqOptions];
                                updated[idx].text = e.target.value;
                                setMcqOptions(updated);
                              }}
                              className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dạng 2: Đúng / Sai 4 ý */}
                  {builderPart === 'Phần II' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-800">
                        Cấu hình 4 nhận định (a, b, c, d):
                      </label>
                      <div className="space-y-2">
                        {tfItems.map((item, idx) => (
                          <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-bold text-xs bg-white px-2 py-1 rounded border border-slate-200 text-indigo-700">{item.id}</span>
                              <input
                                type="text"
                                value={item.statement}
                                onChange={(e) => {
                                  const updated = [...tfItems];
                                  updated[idx].statement = e.target.value;
                                  setTfItems(updated);
                                }}
                                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...tfItems];
                                  updated[idx].correctAnswer = true;
                                  setTfItems(updated);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${item.correctAnswer ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...tfItems];
                                  updated[idx].correctAnswer = false;
                                  setTfItems(updated);
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!item.correctAnswer ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dạng 3: Trả lời ngắn */}
                  {builderPart === 'Phần III' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Giá trị số đáp án:</label>
                        <input
                          type="text"
                          value={saValue}
                          onChange={(e) => setSaValue(e.target.value)}
                          placeholder="ví dụ: 2.0"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Đơn vị đo:</label>
                        <input
                          type="text"
                          value={saUnit}
                          onChange={(e) => setSaUnit(e.target.value)}
                          placeholder="ví dụ: Hz hoặc J"
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Dung sai (sai số %):</label>
                        <input
                          type="number"
                          step="0.01"
                          value={saTolerance}
                          onChange={(e) => setSaTolerance(parseFloat(e.target.value) || 0.05)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* Lời giải & Công thức then chốt */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Công thức then chốt:</label>
                      <input
                        type="text"
                        value={expFormula}
                        onChange={(e) => setExpFormula(e.target.value)}
                        placeholder="f = 1/T"
                        className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Tóm tắt lời giải:</label>
                      <input
                        type="text"
                        value={expOverview}
                        onChange={(e) => setExpOverview(e.target.value)}
                        placeholder="Áp dụng công thức..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Nút thêm câu hỏi vào đề thi */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddQuestionFromBuilder}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm câu hỏi này vào đề thi</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 3: AI SOẠN & QUÉT ĐỀ (GEMINI API) ================= */}
          {activeTab === 'ai_generator' && (
            <AIGeneratorTab
              currentExam={currentExam}
              onAppendQuestions={handleAppendQuestionsFromAI}
              onReplaceExam={handleReplaceExamFromAI}
            />
          )}

          {/* ================= TAB 4: TRỘN & XUẤT MÃ ĐỀ THI ================= */}
          {activeTab === 'shuffling' && (
            <ShufflingTab
              currentExam={currentExam}
              onApplyBundle={(newBundle) => {
                if (onApplyBundle) onApplyBundle(newBundle);
              }}
              onOpenPrintMatrix={(newBundle) => {
                if (onOpenPrintMatrix) onOpenPrintMatrix(newBundle);
              }}
            />
          )}

          {/* ================= TAB 5: CẤU HÌNH GIÁM SÁT THI & CHỐNG GIAN LẬN ================= */}
          {activeTab === 'anticheat' && (
            <AntiCheatConfigTab
              config={antiCheatConfig || {
                enabled: true,
                requireFullscreen: true,
                trackTabSwitching: true,
                maxViolations: 3,
                preventCopyAndShortcuts: true,
              }}
              onChangeConfig={(newCfg) => {
                if (onChangeAntiCheatConfig) onChangeAntiCheatConfig(newCfg);
              }}
            />
          )}

        </div>

        {/* Chân trang Modal */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>PhysiXam Exam Authoring Studio • Chuẩn hóa định dạng đề thi Vật lí THPT</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium transition cursor-pointer"
          >
            Đóng bảng quản lý
          </button>
        </div>

      </div>
    </div>
  );
};
