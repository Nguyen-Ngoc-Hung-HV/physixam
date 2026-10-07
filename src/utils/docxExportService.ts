import { 
  Document, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, 
  ImageRun, Footer, PageNumber, Packer
} from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { 
  Exam, Question, ExamVariantBundle, DiagramData, 
  MultipleChoiceQuestion, TrueFalseClusterQuestion, ShortAnswerQuestion 
} from '../types/exam';
import { resolveQuestionDiagram } from './diagramResolver';

/**
 * Chuyển đổi công thức LaTeX / Toán / Vật lí sang ký tự Unicode chuẩn mực cho văn bản Word
 */
export function latexToUnicodeMath(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let str = input;

  // 0. Xóa bỏ hoàn toàn phần trailing dotted line "Đáp số: ....." nếu câu hỏi có chứa
  str = str.replace(/Đáp số:\s*\.{2,}.*$/gi, '').trim();

  // 1. Thay thế {,} bằng dấu phẩy thập phân thông thường ',' (ví dụ: 2{,}0 cm -> 2,0 cm, 60{,}0 cm -> 60,0 cm)
  str = str.replace(/\{,\}/g, ',');

  // 2. Ký tự Hy Lạp thông dụng trong Vật lí
  const greekMap: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'θ', '\\lambda': 'λ', '\\Lambda': 'Λ',
    '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\Pi': 'Π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\Sigma': 'Σ', '\\tau': 'τ',
    '\\phi': 'φ', '\\varphi': 'φ', '\\Phi': 'Φ', '\\chi': 'χ',
    '\\psi': 'ψ', '\\Psi': 'Ψ', '\\omega': 'ω', '\\Omega': 'Ω'
  };
  for (const [cmd, sym] of Object.entries(greekMap)) {
    str = str.split(cmd).join(sym);
  }

  // 3. Hàm lượng giác, logarit, giới hạn
  str = str.replace(/\\cos\b/g, 'cos');
  str = str.replace(/\\sin\b/g, 'sin');
  str = str.replace(/\\tan\b/g, 'tan');
  str = str.replace(/\\cot\b/g, 'cot');
  str = str.replace(/\\ln\b/g, 'ln');
  str = str.replace(/\\log\b/g, 'log');
  str = str.replace(/\\exp\b/g, 'exp');
  str = str.replace(/\\lim\b/g, 'lim');

  // Mũi tên suy ra / chuyển tiếp: \to -> →, \rightarrow -> →
  str = str.replace(/\\to\b/g, '→');
  str = str.replace(/\\rightarrow\b/g, '→');
  str = str.replace(/\\longrightarrow\b/g, '→');
  str = str.replace(/\\Rightarrow\b/g, '⇒');
  str = str.replace(/\\Leftrightarrow\b/g, '⇔');

  // Min / Max dạng chỉ số: e.g. I_{\min}, I_\min -> I_min; I_{\max}, I_\max -> I_max
  str = str.replace(/_\{?\\(?:min|MIN)\}?/g, '_min');
  str = str.replace(/_\{?\\(?:max|MAX)\}?/g, '_max');
  str = str.replace(/\\min\b/g, 'min');
  str = str.replace(/\\max\b/g, 'max');

  // 4. Toán tử và ký hiệu số học
  str = str.replace(/\\cdot/g, '·');
  str = str.replace(/\\times/g, '×');
  str = str.replace(/\\pm/g, '±');
  str = str.replace(/\\mp/g, '∓');
  str = str.replace(/\\leq?/g, '≤');
  str = str.replace(/\\geq?/g, '≥');
  str = str.replace(/\\neq?/g, '≠');
  str = str.replace(/\\approx/g, '≈');
  str = str.replace(/\\sim/g, '~');
  str = str.replace(/\\infty/g, '∞');
  str = str.replace(/\\degree/g, '°');
  str = str.replace(/\^\\circ/g, '°');
  str = str.replace(/\^\{\\circ\}/g, '°');
  str = str.replace(/\\circ/g, '°');

  // 5. Căn bậc hai \sqrt{x} -> √(x)
  str = str.replace(/\\sqrt\[(\d+)\]\{([^{}]+)\}/g, '√[$1]($2)');
  str = str.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // 6. Phân số \frac{a}{b} hoặc \frac{0,8}{π} -> 0,8/π hoặc a/b
  let prevStr = '';
  while (prevStr !== str && /\\d?frac\{[^{}]+\}\{[^{}]+\}/.test(str)) {
    prevStr = str;
    str = str.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num, den) => {
      const cleanNum = num.trim();
      const cleanDen = den.trim();
      return `${cleanNum}/${cleanDen}`;
    });
  }

  // 7. Vectơ \vec{F} -> F⃗
  str = str.replace(/\\(?:vec|overrightarrow)\{([^{}]+)\}/g, '$1⃗');

  // 8. Xử lý \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}, \overline{...}
  str = str.replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]+)\}/g, '$1');
  str = str.replace(/\\overline\{([^{}]+)\}/g, '$1̄');

  // 9. Khoảng trắng LaTeX: \, \; \quad \qquad
  str = str.replace(/\\(?:,|;|quad|qquad|!)/g, ' ');

  // 10. Dấu ngoặc co giãn \left( ... \right)
  str = str.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  str = str.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  str = str.replace(/\\left\\\{/g, '{').replace(/\\right\\\}/g, '}');
  str = str.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');

  // 11. Chỉ số trên lũy thừa 10^{-4} -> 10⁻⁴, 10^5 -> 10⁵
  const supDigits: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'm': 'ᵐ', 't': 'ᵗ'
  };
  str = str.replace(/\^\{([0-9+\-nmt]+)\}/g, (_m, digits) => {
    return Array.from(digits as string).map(d => supDigits[d] || `^${d}`).join('');
  });
  str = str.replace(/\^([0-9+\-nmt])(?![0-9a-zA-Z])/g, (_m, d) => supDigits[d] || `^${d}`);

  // 12. Chỉ số dưới x_M, v_M, x_1, v_0, A'B'
  // x_{M} -> x_M, v_{M} -> v_M
  str = str.replace(/_\{([a-zA-Z0-9'+\-_]+)\}/g, '_$1');

  // Số dưới đơn lẻ: x_1, v_0
  const subDigits: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
  };
  str = str.replace(/_([0-9])\b/g, (_m, d) => subDigits[d] || `_${d}`);

  // 13. Xóa bỏ dấu ngoặc nhọn cô đơn còn sót do cú pháp LaTeX như {M}, {cm}
  str = str.replace(/\{([a-zA-Z0-9'+\-_]+)\}/g, '$1');

  // 14. Xóa bỏ dấu $ và $$
  str = str.replace(/\$\$/g, '');
  str = str.replace(/\$/g, '');

  // 15. Dọn dẹp khoảng trắng kép
  str = str.replace(/[ \t]+/g, ' ').trim();

  return str;
}

/**
 * Chuyển Base64 string thành Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Chuyển đổi SVG hoặc Base64 Image sang PNG Uint8Array cho Word docx
 */
export async function convertDiagramToImageData(
  diagram?: DiagramData
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  if (!diagram) return null;

  try {
    // 1. Trường hợp SVG raw string
    if (diagram.type === 'svg' && diagram.content) {
      return await svgStringToPngBytes(diagram.content);
    }

    // 2. Trường hợp ảnh data URL (PNG, JPEG, v.v.)
    const src = diagram.url || diagram.content || '';
    if (src.startsWith('data:image/png;base64,')) {
      const base64 = src.replace('data:image/png;base64,', '');
      const bytes = base64ToUint8Array(base64);
      return { bytes, width: 360, height: 180 };
    }
    if (src.startsWith('data:image/jpeg;base64,') || src.startsWith('data:image/jpg;base64,')) {
      const base64 = src.replace(/^data:image\/jpe?g;base64,/, '');
      const bytes = base64ToUint8Array(base64);
      return { bytes, width: 360, height: 180 };
    }
    if (src.startsWith('data:image/svg+xml')) {
      const svgContent = decodeURIComponent(src.split(',')[1] || '');
      return await svgStringToPngBytes(svgContent);
    }
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1] || '';
      const bytes = base64ToUint8Array(base64);
      return { bytes, width: 360, height: 180 };
    }

    // 3. Trường hợp URL ảnh ngoài (http/https)
    if (src.startsWith('http') || src.startsWith('/')) {
      return await imageUrlToPngBytes(src);
    }
  } catch (err) {
    console.warn('Lỗi xử lý hình ảnh cho file Word:', err);
  }

  return null;
}

/**
 * Vẽ SVG lên canvas offscreen để xuất ra PNG bytes
 */
function svgStringToPngBytes(
  svgString: string
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      let processedSvg = svgString.trim();
      let width = 450;
      let height = 220;

      const viewBoxMatch = processedSvg.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
      if (viewBoxMatch) {
        const vbW = parseFloat(viewBoxMatch[3]);
        const vbH = parseFloat(viewBoxMatch[4]);
        if (vbW > 0 && vbH > 0) {
          width = Math.min(500, Math.round(vbW));
          height = Math.round((width / vbW) * vbH);
        }
      }

      if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        processedSvg = processedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const renderWidth = Math.max(100, img.naturalWidth || width || 450);
          const renderHeight = Math.max(80, img.naturalHeight || height || 220);
          canvas.width = renderWidth;
          canvas.height = renderHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, renderWidth, renderHeight);
            ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
            const dataUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            const bytes = base64ToUint8Array(base64);
            const targetWidth = Math.min(380, renderWidth);
            const targetHeight = Math.round((targetWidth / renderWidth) * renderHeight);
            resolve({ bytes, width: targetWidth, height: targetHeight });
            return;
          }
        } catch {}
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Tải ảnh URL ngoài và vẽ ra canvas để lấy PNG bytes
 */
function imageUrlToPngBytes(
  src: string
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const renderWidth = img.naturalWidth || 360;
          const renderHeight = img.naturalHeight || 200;
          canvas.width = renderWidth;
          canvas.height = renderHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
            const dataUrl = canvas.toDataURL('image/png');
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            const bytes = base64ToUint8Array(base64);
            const targetWidth = Math.min(360, renderWidth);
            const targetHeight = Math.round((targetWidth / renderWidth) * renderHeight);
            resolve({ bytes, width: targetWidth, height: targetHeight });
            return;
          }
        } catch {}
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Helper tạo TableCell chứa TextRun
 */
function makeCell(
  text: string, 
  bold: boolean = false, 
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT
): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text, bold, font: 'Times New Roman', size: 21 }),
        ],
      }),
    ],
  });
}

/**
 * Tạo tài liệu Word (.docx) chuẩn cấu trúc Bộ GD&ĐT cho một mã đề thi cụ thể
 */
export async function generateWordExamCodeDocx(
  exam: Exam,
  variantCode: string
): Promise<Blob> {
  const code = variantCode || exam.code || '101';

  // 1. Phân loại câu hỏi theo Phần I, II, III
  const part1Questions = exam.questions.filter((q) => q.part === 'Phần I') as MultipleChoiceQuestion[];
  const part2Questions = exam.questions.filter((q) => q.part === 'Phần II') as TrueFalseClusterQuestion[];
  const part3Questions = exam.questions.filter((q) => q.part === 'Phần III') as ShortAnswerQuestion[];

  // 2. Chuyển đổi toàn bộ sơ đồ/hình ảnh trước khi tạo Word
  const questionImages: Map<string, { bytes: Uint8Array; width: number; height: number } | null> = new Map();
  for (const q of exam.questions) {
    const diag = resolveQuestionDiagram(q);
    if (diag) {
      const imgData = await convertDiagramToImageData(diag);
      questionImages.set(q.id, imgData);
    }
  }

  // 3. Khởi tạo danh sách Paragraphs cho tài liệu
  const docParagraphs: (Paragraph | Table)[] = [];

  // BẢNG TIÊU ĐỀ ĐẦU TRANG CHUẨN BỘ GD&ĐT (2 Cột, không viền)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG', bold: true, font: 'Times New Roman', size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'TRƯỜNG THPT HÙNG VƯƠNG', bold: true, font: 'Times New Roman', size: 21 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '-----------------------', font: 'Times New Roman', size: 18, color: '64748b' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(Đề kiểm tra có 04 trang)', italics: true, font: 'Times New Roman', size: 19 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'KIỂM TRA ĐÁNH GIÁ NĂNG LỰC VẬT LÝ', bold: true, font: 'Times New Roman', size: 22 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'NĂM HỌC 2026 - 2027', font: 'Times New Roman', size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Môn: VẬT LÍ - Lớp 12', bold: true, font: 'Times New Roman', size: 21 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Thời gian làm bài: ${exam.durationMinutes || 45} phút (không kể phát đề)`, italics: true, font: 'Times New Roman', size: 20 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [
                  new TextRun({ text: `MÃ ĐỀ THI: ${code}`, bold: true, font: 'Times New Roman', size: 24, color: '1e3a8a' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docParagraphs.push(headerTable);

  // DÒNG KẺ PHÂN CÁCH
  docParagraphs.push(
    new Paragraph({
      spacing: { before: 100, after: 100 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '____________________________________________________________________', font: 'Times New Roman', size: 18, color: '94a3b8' }),
      ],
    })
  );

  // KHUNG THÔNG TIN THÍ SINH
  const studentInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '94a3b8' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '94a3b8' },
      left: { style: BorderStyle.SINGLE, size: 6, color: '94a3b8' },
      right: { style: BorderStyle.SINGLE, size: 6, color: '94a3b8' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Họ và tên thí sinh: ............................................................................', font: 'Times New Roman', size: 21 }),
                  new TextRun({ text: '   Số báo danh: .....................', font: 'Times New Roman', size: 21 }),
                  new TextRun({ text: '   Lớp: ...........', font: 'Times New Roman', size: 21 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  docParagraphs.push(studentInfoTable);

  // =========================================================================
  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (18 CÂU)
  // =========================================================================
  docParagraphs.push(
    new Paragraph({
      spacing: { before: 240, after: 100 },
      children: [
        new TextRun({ text: 'PHẦN I. ', bold: true, font: 'Times New Roman', size: 22 }),
        new TextRun({ 
          text: `Câu trắc nghiệm nhiều phương án lựa chọn. Thí sinh trả lời từ câu 1 đến câu ${part1Questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.`,
          font: 'Times New Roman',
          size: 21,
          italics: true
        }),
      ],
    })
  );

  part1Questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const cleanStem = latexToUnicodeMath(q.stem);

    // Dòng thân câu hỏi
    docParagraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: `Câu ${qNum}. `, bold: true, font: 'Times New Roman', size: 21 }),
          new TextRun({ text: cleanStem, font: 'Times New Roman', size: 21 }),
        ],
      })
    );

    // Chèn sơ đồ / hình vẽ nếu có
    const imgData = questionImages.get(q.id);
    if (imgData) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 40 },
          children: [
            new ImageRun({
              data: imgData.bytes,
              transformation: { width: imgData.width, height: imgData.height },
              type: 'png',
            }),
          ],
        })
      );
      const diag = resolveQuestionDiagram(q);
      if (diag?.caption) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: latexToUnicodeMath(diag.caption), font: 'Times New Roman', size: 19, italics: true }),
            ],
          })
        );
      }
    }

    // 4 phương án A, B, C, D
    if (q.options && q.options.length > 0) {
      const optA = q.options.find((o) => o.id === 'A')?.text || '';
      const optB = q.options.find((o) => o.id === 'B')?.text || '';
      const optC = q.options.find((o) => o.id === 'C')?.text || '';
      const optD = q.options.find((o) => o.id === 'D')?.text || '';

      const maxLen = Math.max(optA.length, optB.length, optC.length, optD.length);

      if (maxLen <= 18) {
        docParagraphs.push(
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 240 },
            children: [
              new TextRun({ text: 'A. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${latexToUnicodeMath(optA)}            `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: 'B. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${latexToUnicodeMath(optB)}            `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: 'C. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${latexToUnicodeMath(optC)}            `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: 'D. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: latexToUnicodeMath(optD), font: 'Times New Roman', size: 21 }),
            ],
          })
        );
      } else if (maxLen <= 42) {
        docParagraphs.push(
          new Paragraph({
            indent: { left: 240 },
            children: [
              new TextRun({ text: 'A. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${latexToUnicodeMath(optA)}                        `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: 'B. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: latexToUnicodeMath(optB), font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            indent: { left: 240 },
            children: [
              new TextRun({ text: 'C. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `${latexToUnicodeMath(optC)}                        `, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: 'D. ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: latexToUnicodeMath(optD), font: 'Times New Roman', size: 21 }),
            ],
          })
        );
      } else {
        ['A', 'B', 'C', 'D'].forEach((id, oIdx) => {
          const optText = q.options.find((o) => o.id === id)?.text || '';
          docParagraphs.push(
            new Paragraph({
              spacing: { after: oIdx === 3 ? 100 : 20 },
              indent: { left: 240 },
              children: [
                new TextRun({ text: `${id}. `, bold: true, font: 'Times New Roman', size: 21 }),
                new TextRun({ text: latexToUnicodeMath(optText), font: 'Times New Roman', size: 21 }),
              ],
            })
          );
        });
      }
    }
  });

  // =========================================================================
  // PHẦN II: TRẮC NGHIỆM ĐÚNG SAI (4 CÂU CHÙM a, b, c, d)
  // =========================================================================
  docParagraphs.push(
    new Paragraph({
      spacing: { before: 260, after: 100 },
      children: [
        new TextRun({ text: 'PHẦN II. ', bold: true, font: 'Times New Roman', size: 22 }),
        new TextRun({ 
          text: `Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu ${part2Questions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
          font: 'Times New Roman',
          size: 21,
          italics: true
        }),
      ],
    })
  );

  part2Questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const cleanStem = latexToUnicodeMath(q.stem);

    docParagraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: `Câu ${qNum}. `, bold: true, font: 'Times New Roman', size: 21 }),
          new TextRun({ text: cleanStem, font: 'Times New Roman', size: 21 }),
        ],
      })
    );

    // Chèn sơ đồ / hình vẽ nếu có
    const imgData = questionImages.get(q.id);
    if (imgData) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 40 },
          children: [
            new ImageRun({
              data: imgData.bytes,
              transformation: { width: imgData.width, height: imgData.height },
              type: 'png',
            }),
          ],
        })
      );
      const diag = resolveQuestionDiagram(q);
      if (diag?.caption) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({ text: latexToUnicodeMath(diag.caption), font: 'Times New Roman', size: 19, italics: true }),
            ],
          })
        );
      }
    }

    // 4 ý a), b), c), d)
    if (q.items && q.items.length > 0) {
      q.items.forEach((item, itemIdx) => {
        const itemLetter = item.id ? item.id.toLowerCase() : ['a', 'b', 'c', 'd'][itemIdx];
        docParagraphs.push(
          new Paragraph({
            spacing: { after: itemIdx === q.items.length - 1 ? 100 : 30 },
            indent: { left: 240 },
            children: [
              new TextRun({ text: `${itemLetter}) `, bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: latexToUnicodeMath(item.statement), font: 'Times New Roman', size: 21 }),
            ],
          })
        );
      });
    }
  });

  // =========================================================================
  // PHẦN III: TRẢ LỜI NGẮN (6 CÂU)
  // =========================================================================
  docParagraphs.push(
    new Paragraph({
      spacing: { before: 260, after: 100 },
      children: [
        new TextRun({ text: 'PHẦN III. ', bold: true, font: 'Times New Roman', size: 22 }),
        new TextRun({ 
          text: `Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời từ câu 1 đến câu ${part3Questions.length}. Viết câu trả lời vào phiếu trả lời trắc nghiệm.`,
          font: 'Times New Roman',
          size: 21,
          italics: true
        }),
      ],
    })
  );

  part3Questions.forEach((q, idx) => {
    const qNum = idx + 1;
    let cleanStem = latexToUnicodeMath(q.stem);
    cleanStem = cleanStem.replace(/Đáp số:\s*\.{2,}.*$/gi, '').replace(/\.{10,}.*$/g, '').trim();

    docParagraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 100 },
        children: [
          new TextRun({ text: `Câu ${qNum}. `, bold: true, font: 'Times New Roman', size: 21 }),
          new TextRun({ text: cleanStem, font: 'Times New Roman', size: 21 }),
        ],
      })
    );

    // Chèn sơ đồ / hình vẽ nếu có
    const imgData = questionImages.get(q.id);
    if (imgData) {
      docParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 40 },
          children: [
            new ImageRun({
              data: imgData.bytes,
              transformation: { width: imgData.width, height: imgData.height },
              type: 'png',
            }),
          ],
        })
      );
      const diag = resolveQuestionDiagram(q);
      if (diag?.caption) {
        docParagraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: latexToUnicodeMath(diag.caption), font: 'Times New Roman', size: 19, italics: true }),
            ],
          })
        );
      }
    }
  });

  // =========================================================================
  // CUỐI TRANG: CHÚ THÍCH HẾT
  // =========================================================================
  docParagraphs.push(
    new Paragraph({
      spacing: { before: 280, after: 40 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '-------------------------- HẾT --------------------------', bold: true, font: 'Times New Roman', size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '• Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.', italics: true, font: 'Times New Roman', size: 20 }),
      ],
    })
  );

  // Tạo Document với cấu hình chuẩn A4
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2 cm
              bottom: 1134, // 2 cm
              left: 1417, // 2.5 cm
              right: 1134, // 2 cm
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `Mã đề ${code} - Trang `, font: 'Times New Roman', size: 18, italics: true }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 18,
                    italics: true,
                  }),
                  new TextRun({ text: ' / ', font: 'Times New Roman', size: 18, italics: true }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Times New Roman',
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        children: docParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * File 2: Xuất file Excel đáp án TN Maker tương thích tuyệt đối mẫu template BTPRO của ứng dụng TN Maker
 */
export function generateTNMakerExcel(bundle: ExamVariantBundle): Uint8Array {
  const variants = bundle.variants || [];
  const codes = variants.map((v) => v.code || '101');

  // Chuẩn bị cấu trúc mảng AOA (Array of Arrays) theo mẫu chuẩn BTPRO
  const aoa: any[][] = [];

  // Hàng tiêu đề: Cột A là "Câu\Mã đề", các cột tiếp theo là các mã đề thi
  aoa.push(['Câu\\Mã đề', ...codes]);

  // Phân tách từng phần thi cho từng mã đề
  const variantParts = variants.map((v) => {
    const p1 = v.questions.filter((q) => q.part === 'Phần I') as MultipleChoiceQuestion[];
    const p2 = v.questions.filter((q) => q.part === 'Phần II') as TrueFalseClusterQuestion[];
    const p3 = v.questions.filter((q) => q.part === 'Phần III') as ShortAnswerQuestion[];
    return { p1, p2, p3 };
  });

  // =========================================================================
  // 1. Rows 1 đến 18 (Phần I - Trắc nghiệm 4 lựa chọn):
  // Cột A: "1", "2", ..., "18" -> Giá trị: Ký tự chữ hoa "A", "B", "C", hoặc "D"
  // =========================================================================
  for (let i = 0; i < 18; i++) {
    const rowNum = (i + 1).toString();
    const row: any[] = [rowNum];
    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const q = variantParts[vIdx].p1[i];
      const ans = q?.correctAnswer ? q.correctAnswer.toUpperCase().trim() : 'A';
      row.push(ans);
    }
    aoa.push(row);
  }

  // =========================================================================
  // 2. Rows 19 đến 22 (Phần II - Trắc nghiệm Đúng/Sai chùm a,b,c,d):
  // Cột A: "1", "2", "3", "4" -> Giá trị: Đúng 4 ký tự biểu diễn các lệnh hỏi (ví dụ: "SĐSS", "SSĐĐ")
  // =========================================================================
  for (let i = 0; i < 4; i++) {
    const rowNum = (i + 1).toString();
    const row: any[] = [rowNum];
    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const q = variantParts[vIdx].p2[i];
      let pattern = '';
      if (q && q.items && q.items.length > 0) {
        pattern = q.items.map((it) => (it.correctAnswer ? 'Đ' : 'S')).join('');
      } else {
        pattern = 'ĐĐĐĐ';
      }
      row.push(pattern);
    }
    aoa.push(row);
  }

  // =========================================================================
  // 3. Rows 23 đến 28 (Phần III - Trắc nghiệm Trả lời ngắn):
  // Cột A: "1", "2", "3", "4", "5", "6" -> Giá trị: Kết quả số (ví dụ: 25, 37, 48, -40, 4520, 22.4)
  // =========================================================================
  for (let i = 0; i < 6; i++) {
    const rowNum = (i + 1).toString();
    const row: any[] = [rowNum];
    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const q = variantParts[vIdx].p3[i];
      let val: any = q?.correctValue;
      if (val !== undefined && val !== null) {
        if (typeof val === 'number') {
          row.push(val);
        } else if (typeof val === 'string') {
          const cleanStr = val.trim().replace(',', '.');
          const num = Number(cleanStr);
          row.push(!isNaN(num) && cleanStr !== '' ? num : val.trim());
        } else {
          row.push(val);
        }
      } else {
        row.push('');
      }
    }
    aoa.push(row);
  }

  // Khởi tạo Workbook và Worksheet
  const wb = XLSX.utils.book_new();
  const wsBTPRO = XLSX.utils.aoa_to_sheet(aoa);

  // Định dạng độ rộng cột
  const colWidths = [{ wch: 14 }];
  codes.forEach(() => colWidths.push({ wch: 12 }));
  wsBTPRO['!cols'] = colWidths;

  // Tên sheet BẮT BUỘC là "BTPRO" theo đúng đặc tả của ứng dụng TN Maker
  XLSX.utils.book_append_sheet(wb, wsBTPRO, 'BTPRO');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * File 3: Bảng Ma Trận Đáp Án Tổng Hợp so sánh đề gốc và tất cả các mã đề
 */
export function generateMasterMatrixExcel(bundle: ExamVariantBundle): Uint8Array {
  const originalExam: Exam = bundle.originalExam || bundle.variants[0];
  const matrixData: any[] = [];

  if (originalExam) {
    originalExam.questions.forEach((origQ: Question, qIdx: number) => {
      const origNum = qIdx + 1;
      let origAns = '';
      if (origQ.type === 'multiple_choice') {
        origAns = (origQ as MultipleChoiceQuestion).correctAnswer || '';
      } else if (origQ.type === 'true_false_cluster') {
        origAns = ((origQ as TrueFalseClusterQuestion).items || [])
          .map((it) => `${it.id}:${it.correctAnswer ? 'Đ' : 'S'}`)
          .join('; ');
      } else if (origQ.type === 'short_answer') {
        const sa = origQ as ShortAnswerQuestion;
        origAns = sa.correctValue !== undefined ? `${sa.correctValue} ${sa.unitHint || ''}`.trim() : '';
      }

      const row: any = {
        'STT Câu': origNum,
        'Phần thi': origQ.part,
        'Chủ đề kiến thức': origQ.topic,
        'Tóm tắt câu hỏi': latexToUnicodeMath(origQ.stem).slice(0, 50) + '...',
        'Đáp án Đề gốc': origAns,
      };

      // Tìm vị trí câu hỏi này trong từng mã đề hoán vị
      bundle.variants.forEach((v: Exam) => {
        const code = v.code || '101';
        const foundIdx = v.questions.findIndex((vq: Question) => vq.id === origQ.id);
        if (foundIdx >= 0) {
          const vq = v.questions[foundIdx];
          let vAns = '';
          if (vq.type === 'multiple_choice') {
            vAns = (vq as MultipleChoiceQuestion).correctAnswer || '';
          } else if (vq.type === 'true_false_cluster') {
            vAns = ((vq as TrueFalseClusterQuestion).items || [])
              .map((it) => `${it.id}:${it.correctAnswer ? 'Đ' : 'S'}`)
              .join(';');
          } else if (vq.type === 'short_answer') {
            const sa = vq as ShortAnswerQuestion;
            vAns = sa.correctValue !== undefined ? `${sa.correctValue}` : '';
          }
          row[`Mã ${code}`] = `Câu ${foundIdx + 1}: [${vAns}]`;
        } else {
          row[`Mã ${code}`] = '-';
        }
      });

      matrixData.push(row);
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(matrixData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 26 },
    { wch: 35 },
    { wch: 22 },
    ...bundle.variants.map(() => ({ wch: 18 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Ma_Tran_Dap_An_Tong_Hop');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * File 4: Bản Đặc Tả Và Ma Trận Đề Kiểm Tra (Word docx)
 */
export async function generateSpecificationDocx(exam: Exam): Promise<Blob> {
  const p1 = exam.questions.filter((q) => q.part === 'Phần I');
  const p2 = exam.questions.filter((q) => q.part === 'Phần II');
  const p3 = exam.questions.filter((q) => q.part === 'Phần III');

  // Thống kê chủ đề
  const topicCounts: Record<string, { p1: number; p2: number; p3: number }> = {};
  exam.questions.forEach((q) => {
    if (!topicCounts[q.topic]) {
      topicCounts[q.topic] = { p1: 0, p2: 0, p3: 0 };
    }
    if (q.part === 'Phần I') topicCounts[q.topic].p1++;
    if (q.part === 'Phần II') topicCounts[q.topic].p2++;
    if (q.part === 'Phần III') topicCounts[q.topic].p3++;
  });

  const matrixTableRows: TableRow[] = [
    new TableRow({
      children: [
        makeCell('TT', true, AlignmentType.CENTER),
        makeCell('Chủ đề kiến thức', true),
        makeCell('Phần I (MCQ)', true, AlignmentType.CENTER),
        makeCell('Phần II (Đ/S)', true, AlignmentType.CENTER),
        makeCell('Phần III (Ngắn)', true, AlignmentType.CENTER),
        makeCell('Tổng câu', true, AlignmentType.CENTER),
        makeCell('Tỷ lệ điểm', true, AlignmentType.CENTER),
      ],
    }),
  ];

  let tt = 1;
  let sumP1 = 0, sumP2 = 0, sumP3 = 0;
  for (const [topic, c] of Object.entries(topicCounts)) {
    const tot = c.p1 + c.p2 + c.p3;
    sumP1 += c.p1;
    sumP2 += c.p2;
    sumP3 += c.p3;
    const pts = (c.p1 * 0.25) + (c.p2 * 1.0) + (c.p3 * 0.25);
    const pct = Math.round((pts / (exam.totalPoints || 10)) * 100);

    matrixTableRows.push(
      new TableRow({
        children: [
          makeCell(tt.toString(), false, AlignmentType.CENTER),
          makeCell(topic),
          makeCell(c.p1.toString(), false, AlignmentType.CENTER),
          makeCell(c.p2.toString(), false, AlignmentType.CENTER),
          makeCell(c.p3.toString(), false, AlignmentType.CENTER),
          makeCell(tot.toString(), true, AlignmentType.CENTER),
          makeCell(`${pct}%`, false, AlignmentType.CENTER),
        ],
      })
    );
    tt++;
  }

  // Hàng tổng cộng
  matrixTableRows.push(
    new TableRow({
      children: [
        makeCell('', true),
        makeCell('TỔNG CỘNG', true),
        makeCell(sumP1.toString(), true, AlignmentType.CENTER),
        makeCell(sumP2.toString(), true, AlignmentType.CENTER),
        makeCell(sumP3.toString(), true, AlignmentType.CENTER),
        makeCell((sumP1 + sumP2 + sumP3).toString(), true, AlignmentType.CENTER),
        makeCell('100%', true, AlignmentType.CENTER),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'SỞ GIÁO DỤC & ĐÀO TẠO TP ĐÀ NẴNG', bold: true, font: 'Times New Roman', size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'TRƯỜNG THPT HÙNG VƯƠNG', bold: true, font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: '-----------------------', font: 'Times New Roman', size: 18, color: '64748b' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: 'BẢN ĐẶC TẢ VÀ MA TRẬN ĐỀ THI ĐÁNH GIÁ NĂNG LỰC VẬT LÝ', bold: true, font: 'Times New Roman', size: 24, color: '1e3a8a' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'NĂM HỌC 2026 - 2027', font: 'Times New Roman', size: 20 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({ text: `Môn: VẬT LÍ - ${exam.gradeLevel ? exam.gradeLevel.replace(/\s*\(?Chương trình GDPT 2018\)?/gi, '').trim() : 'Lớp 12'} • Thời gian làm bài: ${exam.durationMinutes || 45} phút (không kể phát đề)`, italics: true, font: 'Times New Roman', size: 21 }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: 'I. KHUNG MA TRẬN ĐỀ THI (CẤU TRÚC 3 PHẦN BỘ GD&ĐT)', bold: true, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: matrixTableRows,
          }),

          new Paragraph({
            spacing: { before: 280, after: 100 },
            children: [
              new TextRun({ text: 'II. QUY ĐỊNH THANG ĐIỂM & ĐÁNH GIÁ NĂNG LỰC', bold: true, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: '1. Phần I (Trắc nghiệm nhiều lựa chọn): ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `Gồm ${p1.length} câu. Mỗi câu đúng được 0,25 điểm. Tổng điểm tối đa: ${(p1.length * 0.25).toFixed(2)} điểm.`, font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: '2. Phần II (Trắc nghiệm Đúng/Sai theo chùm): ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `Gồm ${p2.length} câu. Thang điểm theo số lượng ý đúng trong một câu: đúng 1 ý = 0,10 điểm; đúng 2 ý = 0,25 điểm; đúng 3 ý = 0,50 điểm; đúng 4 ý = 1,00 điểm. Tổng điểm tối đa: ${(p2.length * 1.0).toFixed(2)} điểm.`, font: 'Times New Roman', size: 21 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({ text: '3. Phần III (Trắc nghiệm trả lời ngắn): ', bold: true, font: 'Times New Roman', size: 21 }),
              new TextRun({ text: `Gồm ${p3.length} câu. Mỗi câu trả lời đúng giá trị số học và đơn vị được 0,25 điểm. Tổng điểm tối đa: ${(p3.length * 0.25).toFixed(2)} điểm.`, font: 'Times New Roman', size: 21 }),
            ],
          }),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: 'III. BẢN ĐẶC TẢ CHI TIẾT CÂU HỎI VÀ NĂNG LỰC VẬT LÍ', bold: true, font: 'Times New Roman', size: 22 }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  makeCell('Câu số', true, AlignmentType.CENTER),
                  makeCell('Phần', true),
                  makeCell('Chủ đề kiến thức', true),
                  makeCell('Cấp độ tư duy', true),
                  makeCell('Yêu cầu cần đạt (Năng lực)', true),
                ],
              }),
              ...exam.questions.map((q: Question, idx: number) => {
                let cognitive = 'Nhận biết';
                if (q.part === 'Phần II') cognitive = 'Thông hiểu - Vận dụng';
                if (q.part === 'Phần III') cognitive = 'Vận dụng cao';
                return new TableRow({
                  children: [
                    makeCell((idx + 1).toString(), false, AlignmentType.CENTER),
                    makeCell(q.part),
                    makeCell(q.topic),
                    makeCell(cognitive),
                    makeCell(latexToUnicodeMath(q.stem).slice(0, 80) + '...'),
                  ],
                });
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Đóng gói trọn bộ ZIP gồm tất cả các đề Word, Excel TN Maker, Ma trận và Bản đặc tả
 */
export async function exportComprehensiveExamZipPackage(
  bundle: ExamVariantBundle,
  onProgress?: (stepText: string, percent: number) => void
): Promise<void> {
  const zip = new JSZip();
  const variants = bundle.variants;
  const totalVariants = variants.length;

  if (onProgress) onProgress('Đang khởi tạo gói nén đề thi...', 5);

  // 1. Tạo thư mục De_Thi_Word/ và các file Word cho từng mã đề
  const wordFolder = zip.folder('De_Thi_Word');
  for (let i = 0; i < totalVariants; i++) {
    const v: Exam = variants[i];
    const code = v.code || `${101 + i}`;
    const percent = Math.round(10 + (i / totalVariants) * 50);

    if (onProgress) {
      onProgress(`Đang tạo file Word mã đề ${code} (${i + 1}/${totalVariants})...`, percent);
    }

    const docxBlob = await generateWordExamCodeDocx(v, code);
    if (wordFolder) {
      wordFolder.file(`De_Kiem_Tra_Ma_${code}.docx`, docxBlob);
    }
  }

  // 2. Tạo File 2: Dap_An_TN_Maker.xlsx
  if (onProgress) onProgress('Đang xuất file đáp án chấm quét TN Maker (.xlsx)...', 65);
  const tnMakerBytes = generateTNMakerExcel(bundle);
  zip.file('Dap_An_TN_Maker.xlsx', tnMakerBytes);

  // 3. Tạo File 3: Bang_Ma_Tran_Dap_An_Tong_Hop.xlsx
  if (onProgress) onProgress('Đang xuất Bảng ma trận so sánh đáp án tổng hợp (.xlsx)...', 75);
  const matrixBytes = generateMasterMatrixExcel(bundle);
  zip.file('Bang_Ma_Tran_Dap_An_Tong_Hop.xlsx', matrixBytes);

  // 4. Tạo File 4: Ban_Dac_Ta_Va_Ma_Tran_De.docx
  if (onProgress) onProgress('Đang xuất Bản đặc tả và khung ma trận đề (.docx)...', 85);
  const baseExam = bundle.originalExam || bundle.variants[0];
  const specBlob = await generateSpecificationDocx(baseExam);
  zip.file('Ban_Dac_Ta_Va_Ma_Tran_De.docx', specBlob);

  // 5. Đóng gói ZIP và tải xuống
  if (onProgress) onProgress('Đang đóng gói file ZIP hoàn chỉnh...', 95);
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rawTitle = bundle.variants[0]?.title || 'Vat_Li';
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_').slice(0, 30);
  const filename = `Tron_Bo_De_Thi_Va_Cham_Thi_${cleanTitle}_${dateStr}.zip`;

const blobUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    
    // Giả lập click chuẩn cho Safari WebKit
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
    link.dispatchEvent(clickEvt);

    // Trì hoãn 15 giây mới thu hồi URL để Safari kịp nạp luồng tải file về máy
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch (e) {}
    }, 15000);

  if (onProgress) onProgress('Hoàn tất tải về trọn bộ đề thi và chấm thi!', 100);
}
