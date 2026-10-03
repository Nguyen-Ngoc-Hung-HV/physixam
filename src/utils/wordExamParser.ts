import JSZip from 'jszip';
import mammoth from 'mammoth';
import { Exam, Question, MultipleChoiceQuestion, TrueFalseClusterQuestion, ShortAnswerQuestion, PhysicsTopic, CognitiveLevel } from '../types/exam';
import { sanitizeMathAndUnits } from './mathSanitizer';
import { extractCognitiveLevelFromText } from './cognitiveLevel';

export interface WordParseSummary {
  totalQuestions: number;
  part1Count: number;
  part2Count: number;
  part3Count: number;
  imageCount: number;
  needsReviewCount: number;
}

export interface WordExamParseResult {
  exam: Exam;
  summary: WordParseSummary;
  warnings: string[];
}

interface StyledRun {
  text: string;
  isRed: boolean;
  isUnderline: boolean;
  isBold: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  imageId?: string;
}

interface ParsedParagraph {
  text: string;
  rawText: string;
  hasRed: boolean;
  hasUnderline: boolean;
  runs: StyledRun[];
  images: string[]; // Base64 data URLs
}

/**
 * Chuyển đổi các kí tự Hy Lạp, chỉ số dưới/trên, đơn vị Vật lí thông dụng sang chuẩn KaTeX
 * và dọn dẹp các artifact, lỗi số mũ khoa học (e.g. ..0^{X}3)
 */
export function convertTextToKaTeX(input: string): string {
  if (!input) return '';
  return sanitizeMathAndUnits(input);
}

/**
 * Kiểm tra mã màu hex có thuộc dải màu đỏ hay không
 */
function isColorRed(colorHex?: string | null): boolean {
  if (!colorHex) return false;
  const c = colorHex.trim().toUpperCase();
  if (c === 'RED' || c === 'CRIMSON' || c === 'DARKRED') return true;
  if (c.startsWith('#')) return isColorRed(c.slice(1));
  if (c.length === 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      // Đỏ mạnh, xanh lá và xanh dương thấp
      return r > 160 && g < 110 && b < 110;
    }
  }
  return false;
}

/**
 * Phân tích tệp Word (.docx) sang danh sách đoạn văn có định dạng và hình ảnh
 */
async function extractDocxParagraphs(
  arrayBuffer: ArrayBuffer,
  onProgress?: (step: string, percent: number) => void
): Promise<{ paragraphs: ParsedParagraph[]; titleHint?: string }> {
  onProgress?.('Đang mở gói tệp Word (Unzipping)...', 15);
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Trích xuất quan hệ hình ảnh từ word/_rels/document.xml.rels
  onProgress?.('Đang trích xuất quan hệ hình ảnh & tài nguyên nhúng...', 30);
  const imageMap: Record<string, string> = {}; // rId -> Base64 data URL

  const relsFile = zip.file('word/_rels/document.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('text');
    const parser = new DOMParser();
    const relsDoc = parser.parseFromString(relsXml, 'application/xml');
    const relationships = relsDoc.getElementsByTagName('Relationship');

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const rId = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      const type = rel.getAttribute('Type') || '';

      if (rId && target && (type.includes('image') || target.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i))) {
        // Đường dẫn trong zip: target thường là "media/image1.png" hoặc "word/media/image1.png"
        let fullPath = target.startsWith('/') ? target.slice(1) : target;
        if (!fullPath.startsWith('word/')) {
          fullPath = `word/${fullPath}`;
        }

        const imgEntry = zip.file(fullPath);
        if (imgEntry) {
          const mimeType = target.endsWith('.png') ? 'image/png' :
            target.match(/\.jpe?g$/i) ? 'image/jpeg' :
            target.endsWith('.webp') ? 'image/webp' :
            target.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
          
          const base64Data = await imgEntry.async('base64');
          imageMap[rId] = `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
  }

  // 2. Trích xuất cấu trúc văn bản từ word/document.xml
  onProgress?.('Đang phân tích cấu trúc đoạn văn, màu sắc và gạch chân...', 50);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('Không tìm thấy tệp word/document.xml trong file Word này.');
  }

  const docXml = await docFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXml, 'application/xml');

  const pNodes = xmlDoc.getElementsByTagName('w:p');
  const parsedParagraphs: ParsedParagraph[] = [];
  let titleHint: string | undefined;

  for (let pIdx = 0; pIdx < pNodes.length; pIdx++) {
    const pNode = pNodes[pIdx];
    const runs: StyledRun[] = [];
    const pImages: string[] = [];

    // Lấy các run trong đoạn
    const rNodes = pNode.getElementsByTagName('w:r');
    for (let rIdx = 0; rIdx < rNodes.length; rIdx++) {
      const rNode = rNodes[rIdx];
      const rPr = rNode.getElementsByTagName('w:rPr')[0];

      let isRed = false;
      let isUnderline = false;
      let isBold = false;
      let isSubscript = false;
      let isSuperscript = false;

      if (rPr) {
        const colorEl = rPr.getElementsByTagName('w:color')[0];
        if (colorEl) {
          const val = colorEl.getAttribute('w:val');
          isRed = isColorRed(val);
        }

        const uEl = rPr.getElementsByTagName('w:u')[0];
        if (uEl) {
          const uVal = uEl.getAttribute('w:val');
          if (uVal && uVal !== 'none') isUnderline = true;
        }

        const bEl = rPr.getElementsByTagName('w:b')[0];
        if (bEl) {
          const bVal = bEl.getAttribute('w:val');
          if (bVal !== '0' && bVal !== 'false') isBold = true;
        }

        const vertAlignEl = rPr.getElementsByTagName('w:vertAlign')[0];
        if (vertAlignEl) {
          const vaVal = vertAlignEl.getAttribute('w:val');
          if (vaVal === 'subscript') isSubscript = true;
          if (vaVal === 'superscript') isSuperscript = true;
        }
      }

      // Kiểm tra hình vẽ được nhúng trong run
      const drawings = rNode.getElementsByTagName('a:blip');
      for (let d = 0; d < drawings.length; d++) {
        const embedId = drawings[d].getAttribute('r:embed');
        if (embedId && imageMap[embedId]) {
          pImages.push(imageMap[embedId]);
        }
      }
      const vImages = rNode.getElementsByTagName('v:imagedata');
      for (let v = 0; v < vImages.length; v++) {
        const vId = vImages[v].getAttribute('r:id');
        if (vId && imageMap[vId]) {
          pImages.push(imageMap[vId]);
        }
      }

      // Lấy text trong <w:t> hoặc math <m:t>
      const tNodes = rNode.getElementsByTagName('w:t');
      let text = '';
      for (let t = 0; t < tNodes.length; t++) {
        text += tNodes[t].textContent || '';
      }
      const mtNodes = rNode.getElementsByTagName('m:t');
      for (let mt = 0; mt < mtNodes.length; mt++) {
        text += mtNodes[mt].textContent || '';
      }

      if (text || pImages.length > 0) {
        // Xử lý subscript/superscript nếu có thẻ định dạng
        let processedText = text;
        if (isSubscript && processedText) {
          processedText = `_{${processedText}}`;
        } else if (isSuperscript && processedText) {
          processedText = `^{${processedText}}`;
        }

        runs.push({
          text: processedText,
          isRed,
          isUnderline,
          isBold,
          isSubscript,
          isSuperscript,
        });
      }
    }

    const rawText = runs.map(r => r.text).join('').trim();
    if (rawText.length > 0 || pImages.length > 0) {
      const hasRed = runs.some(r => r.isRed);
      const hasUnderline = runs.some(r => r.isUnderline);
      const convertedText = convertTextToKaTeX(rawText);

      parsedParagraphs.push({
        text: convertedText,
        rawText,
        hasRed,
        hasUnderline,
        runs,
        images: pImages,
      });

      // Nhận diện tiêu đề đề thi nếu xuất hiện ở các dòng đầu
      if (!titleHint && pIdx < 6) {
        if (/kỳ thi|đề thi|kiểm tra|khảo sát|vật lí|vật lý/i.test(rawText)) {
          titleHint = rawText.replace(/^[#\s\-*]+/, '');
        }
      }
    }
  }

  return { paragraphs: parsedParagraphs, titleHint };
}

/**
 * Phân tích fallback bằng Mammoth nếu tệp không phải chuẩn OpenXML hoặc khi cần dự phòng
 */
async function fallbackMammothExtract(arrayBuffer: ArrayBuffer): Promise<{ text: string; images: string[] }> {
  try {
    const images: string[] = [];
    const result = await mammoth.convertToHtml({ arrayBuffer }, {
      convertImage: mammoth.images.imgElement((image) => {
        return image.read('base64').then((buf) => {
          const src = `data:${image.contentType};base64,${buf}`;
          images.push(src);
          return { src };
        });
      })
    });
    return { text: result.value || '', images };
  } catch (err) {
    return { text: '', images: [] };
  }
}

/**
 * Tự động phân loại chủ đề Vật lí từ ngữ cảnh câu hỏi
 */
export function detectPhysicsTopic(text: string): PhysicsTopic {
  const lower = text.toLowerCase();
  if (/hạt nhân|phóng xạ|năng lượng liên kết|đồng vị|proton|neutron|khối lượng nghỉ|độ hụt khối|alpha|beta|gamma/i.test(lower)) {
    return 'Vật lí hạt nhân & Hiện đại';
  }
  if (/nhiệt|nhiệt độ|nội năng|nhiệt dung riêng|nhiệt nóng chảy|nhiệt hóa hơi|khí lí tưởng|áp suất|thể tích|boyle|charles|kelvin|nhiệt kế/i.test(lower)) {
    return 'Nhiệt học & Thuyết động học';
  }
  if (/từ trường|cảm ứng từ|từ thông|suất điện động|dòng điện|mạch|xoay chiều|lorentz|faraday|lenz|ampe|ampe kế|vôn kế|điện từ/i.test(lower)) {
    return 'Điện từ học & Mạch điện xoay chiều';
  }
  if (/quang|khúc xạ|phản xạ|thấu kính|lăng kính|ánh sáng|giao thoa ánh sáng|tán sắc|chiết suất/i.test(lower)) {
    return 'Quang học & Sóng ánh sáng';
  }
  if (/dao động|con lắc|chu kì|tần số|pha ban đầu|biên độ|li độ|sóng cơ|sóng dừng|bước sóng|bụng sóng|nút sóng/i.test(lower)) {
    return 'Dao động & Sóng cơ';
  }
  return 'Cơ học & Động lực học';
}

/**
 * Engine thông minh phân tích toàn bộ đề thi Word theo cấu trúc 3 Phần chuẩn GDPT 2018
 */
export async function parseWordPhysicsExam(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<WordExamParseResult> {
  const warnings: string[] = [];
  onProgress?.('Đang đọc tệp tin Word từ trình duyệt...', 10);
  const arrayBuffer = await file.arrayBuffer();

  let paragraphs: ParsedParagraph[] = [];
  let examTitleHint: string | undefined;

  try {
    const extracted = await extractDocxParagraphs(arrayBuffer, onProgress);
    paragraphs = extracted.paragraphs;
    examTitleHint = extracted.titleHint;
  } catch (err) {
    // Dự phòng khi tệp là .doc (nhị phân) hoặc XML lỗi
    onProgress?.('Đang sử dụng bộ giải mã mở rộng cho tệp Word...', 40);
    const mammothRes = await fallbackMammothExtract(arrayBuffer);
    if (mammothRes.text) {
      const lines = mammothRes.text.replace(/<[^>]+>/g, '\n').split('\n').filter(l => l.trim().length > 0);
      paragraphs = lines.map(line => ({
        text: convertTextToKaTeX(line),
        rawText: line,
        hasRed: false,
        hasUnderline: false,
        runs: [{ text: line, isRed: false, isUnderline: false, isBold: false, isSubscript: false, isSuperscript: false }],
        images: []
      }));
      warnings.push('Tệp Word được đọc qua chế độ tương thích văn bản thuần.');
    } else {
      throw new Error('Không thể đọc cấu trúc tệp Word. Vui lòng đảm bảo tệp có định dạng .docx chuẩn.');
    }
  }

  onProgress?.('Đang phân tích cấu trúc 3 phần (Phần I, Phần II, Phần III)...', 65);

  const questions: Question[] = [];
  let currentPart: 'Phần I' | 'Phần II' | 'Phần III' = 'Phần I';
  let pendingImages: string[] = [];

  interface RawQuestionAccumulator {
    part: 'Phần I' | 'Phần II' | 'Phần III';
    qNumber: number;
    title: string;
    stemLines: string[];
    images: string[];
    // Part I options
    options: { id: string; text: string; isAsterisk: boolean; isRed: boolean; isUnderline: boolean }[];
    part1TrailingAnswer?: string;
    // Part II items
    items: { id: string; text: string; isAsterisk: boolean; isRed: boolean; isUnderline: boolean; explicitTF?: boolean }[];
    part2TrailingPattern?: string;
    // Part III
    part3AnswerText?: string;
    explanationLines: string[];
  }

  const rawQuestions: RawQuestionAccumulator[] = [];
  let currentQ: RawQuestionAccumulator | null = null;

  // Regex nhận diện Phần thi
  const part1Regex = /phần\s+(?:i|1|thứ\s+nhất)\b|trắc\s+nghiệm\s+nhiều\s+phương\s+án/i;
  const part2Regex = /phần\s+(?:ii|2|thứ\s+hai)\b|trắc\s+nghiệm\s+đúng\s*[\/-]?\s*sai/i;
  const part3Regex = /phần\s+(?:iii|3|thứ\s+ba)\b|trả\s+lời\s+ngắn/i;

  // Regex bắt đầu câu hỏi
  const questionStartRegex = /^(?:câu|câu\s+hỏi|bài)\s+(\d+)[\s:.-]+(.*)$/i;

  // Regex phương án A, B, C, D (đầu dòng)
  const optionLineRegex = /^(\*?)([A-D])[\.\:\)]\s+(.*)$/;

  // Regex nhận định a, b, c, d trong Phần II
  const statementLineRegex = /^(\*?)([a-d])[\.\:\)]\s+(.*)$/;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = p.text;
    const raw = p.rawText;

    // Tích lũy hình vẽ nếu gặp ngoài câu hỏi
    if (p.images.length > 0) {
      pendingImages.push(...p.images);
    }

    // 1. Kiểm tra chuyển Phần thi
    if (part1Regex.test(raw) && !questionStartRegex.test(raw)) {
      currentPart = 'Phần I';
      continue;
    }
    if (part2Regex.test(raw) && !questionStartRegex.test(raw)) {
      currentPart = 'Phần II';
      continue;
    }
    if (part3Regex.test(raw) && !questionStartRegex.test(raw)) {
      currentPart = 'Phần III';
      continue;
    }

    // 2. Kiểm tra bắt đầu Câu hỏi mới
    const qMatch = raw.match(questionStartRegex);
    if (qMatch) {
      if (currentQ) {
        rawQuestions.push(currentQ);
      }

      const qNum = parseInt(qMatch[1], 10) || (rawQuestions.length + 1);
      const remainingStem = qMatch[2] ? convertTextToKaTeX(qMatch[2]) : '';

      currentQ = {
        part: currentPart,
        qNumber: qNum,
        title: `Câu ${qNum}`,
        stemLines: remainingStem ? [remainingStem] : [],
        images: [...pendingImages, ...p.images],
        options: [],
        items: [],
        explanationLines: [],
      };
      pendingImages = [];
      continue;
    }

    // Nếu chưa vào câu hỏi nào nhưng có chữ, bỏ qua tiêu đề hoặc lưu pending
    if (!currentQ) continue;

    // Thêm hình ảnh nếu xuất hiện trong câu
    if (p.images.length > 0 && !currentQ.images.includes(p.images[0])) {
      currentQ.images.push(...p.images);
    }

    // 3. Phân tích nội dung theo từng Phần
    if (currentQ.part === 'Phần I') {
      // 3.1 Kiểm tra xem dòng có chứa phương án dạng tách rời (A. ... B. ... C. ... D. ...)
      const inlineMatches = Array.from(raw.matchAll(/(?:^|\s+)(\*?)([A-D])[\.\:\)]\s+([^\n\r]*?)(?=(?:\s+\*?[A-D][\.\:\)]|$))/g));
      if (inlineMatches.length >= 2) {
        // Tồn tại ít nhất 2 phương án cùng dòng
        for (const m of inlineMatches) {
          const isAst = m[1] === '*';
          const optId = m[2].toUpperCase();
          const optContent = convertTextToKaTeX(m[3].trim());
          
          // Kiểm tra xem run tương ứng có màu đỏ hoặc gạch chân không
          const isRed = p.hasRed && p.runs.some(r => r.isRed && r.text.includes(m[2]));
          const isUnderline = p.hasUnderline && p.runs.some(r => r.isUnderline && r.text.includes(m[2]));

          currentQ.options.push({
            id: optId,
            text: optContent,
            isAsterisk: isAst,
            isRed,
            isUnderline,
          });
        }
        continue;
      }

      // 3.2 Kiểm tra phương án đơn lẻ trên một dòng
      const optSingleMatch = raw.match(optionLineRegex);
      if (optSingleMatch) {
        const isAst = optSingleMatch[1] === '*';
        const optId = optSingleMatch[2].toUpperCase();
        const optText = convertTextToKaTeX(optSingleMatch[3].trim());

        // Kiểm tra run đầu tiên hoặc nhãn có màu đỏ / gạch chân
        const isRed = p.hasRed && (p.runs[0]?.isRed || p.runs.some(r => r.isRed && r.text.includes(optId)));
        const isUnderline = p.hasUnderline && (p.runs[0]?.isUnderline || p.runs.some(r => r.isUnderline && r.text.includes(optId)));

        currentQ.options.push({
          id: optId,
          text: optText,
          isAsterisk: isAst,
          isRed,
          isUnderline,
        });
        continue;
      }

      // 3.3 Kiểm tra đáp án ở cuối câu: "Đáp án: A" hoặc "Chọn B" hoặc "Hướng dẫn giải: Chọn C"
      const ansMatch = raw.match(/(?:đáp\s+án|chọn|phương\s+án\s+đúng)[\s:]+(\*?[A-D])\b/i);
      if (ansMatch) {
        currentQ.part1TrailingAnswer = ansMatch[1].replace('*', '').toUpperCase();
        currentQ.explanationLines.push(text);
        continue;
      }

      // 3.4 Kiểm tra lời giải / hướng dẫn
      if (/^(?:lời\s+giải|hướng\s+dẫn|hdg)[\s:]+/i.test(raw)) {
        currentQ.explanationLines.push(text);
        continue;
      }

      // Nếu đã có phương án mà vẫn còn text -> coi là lời giải hoặc phần giải thích thêm
      if (currentQ.options.length >= 4) {
        currentQ.explanationLines.push(text);
      } else {
        // Vẫn là nội dung câu hỏi (stem)
        currentQ.stemLines.push(text);
      }
    } else if (currentQ.part === 'Phần II') {
      // Nhận định a, b, c, d
      const stmtMatch = raw.match(statementLineRegex);
      if (stmtMatch) {
        const isAst = stmtMatch[1] === '*';
        const stmtId = stmtMatch[2].toLowerCase();
        let stmtText = stmtMatch[3].trim();

        // Kiểm tra xem cuối câu có ghi rõ (Đúng) / (Sai) / [Đ] / [S] không
        let explicitTF: boolean | undefined;
        if (/\((?:đúng|đ|true|t)\)|\[(?:đúng|đ|true|t)\]/i.test(stmtText)) {
          explicitTF = true;
          stmtText = stmtText.replace(/\((?:đúng|đ|true|t)\)|\[(?:đúng|đ|true|t)\]/gi, '').trim();
        } else if (/\((?:sai|s|false|f)\)|\[(?:sai|s|false|f)\]/i.test(stmtText)) {
          explicitTF = false;
          stmtText = stmtText.replace(/\((?:sai|s|false|f)\)|\[(?:sai|s|false|f)\]/gi, '').trim();
        }

        const isRed = p.hasRed && (p.runs[0]?.isRed || p.runs.some(r => r.isRed && r.text.includes(stmtId)));
        const isUnderline = p.hasUnderline && (p.runs[0]?.isUnderline || p.runs.some(r => r.isUnderline && r.text.includes(stmtId)));

        currentQ.items.push({
          id: stmtId,
          text: convertTextToKaTeX(stmtText),
          isAsterisk: isAst,
          isRed,
          isUnderline,
          explicitTF,
        });
        continue;
      }

      // Kiểm tra chuỗi đáp án cuối câu dạng: "Đáp án: Đ-Đ-S-Đ" hoặc "Đáp án: DDSD" hoặc "Đáp án: T-T-F-T"
      const tfPatternMatch = raw.match(/(?:đáp\s+án|kết\s+quả)[\s:]+([ĐDSSTTFđdssttf\s\-,]+)/i);
      if (tfPatternMatch) {
        currentQ.part2TrailingPattern = tfPatternMatch[1].replace(/[\s\-,]/g, '').toUpperCase();
        currentQ.explanationLines.push(text);
        continue;
      }

      // Kiểm tra lời giải
      if (/^(?:lời\s+giải|hướng\s+dẫn|hdg)[\s:]+/i.test(raw)) {
        currentQ.explanationLines.push(text);
        continue;
      }

      if (currentQ.items.length >= 4) {
        currentQ.explanationLines.push(text);
      } else {
        currentQ.stemLines.push(text);
      }
    } else {
      // Phần III: Trả lời ngắn
      const saMatch = raw.match(/(?:đáp\s+số|đáp\s+án|kết\s+quả|giá\s+trị)[\s:]+([+-]?\d+[\.,]?\d*)\s*([^\n\r]*)/i);
      if (saMatch) {
        currentQ.part3AnswerText = saMatch[1].replace(',', '.') + (saMatch[2] ? ` ${saMatch[2].trim()}` : '');
        currentQ.explanationLines.push(text);
        continue;
      }

      if (/^(?:lời\s+giải|hướng\s+dẫn|hdg)[\s:]+/i.test(raw)) {
        currentQ.explanationLines.push(text);
        continue;
      }

      currentQ.stemLines.push(text);
    }
  }

  // Đẩy câu hỏi cuối cùng vào danh sách
  if (currentQ) {
    rawQuestions.push(currentQ);
  }

  onProgress?.('Đang trích xuất hình vẽ và nhận diện đáp án (*, màu đỏ, gạch chân)...', 85);

  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;
  let imageCount = 0;
  let needsReviewCount = 0;

  // 4. Chuẩn hóa thành đối tượng Question hoàn chỉnh
  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const rawQ = rawQuestions[idx];
    const fullStem = rawQ.stemLines.join('\n\n') || `Nội dung ${rawQ.title}`;
    const topic = detectPhysicsTopic(fullStem);

    // Nhận diện mức độ nhận thức từ lời dẫn hoặc tiêu đề
    const stemCognitive = extractCognitiveLevelFromText(fullStem);
    const titleCognitive = extractCognitiveLevelFromText(rawQ.title);
    const detectedLevel: CognitiveLevel = 
      stemCognitive.level || 
      titleCognitive.level || 
      (rawQ.part === 'Phần I' ? 'NB' : rawQ.part === 'Phần II' ? 'TH' : 'VD');

    // Xử lý sơ đồ / hình ảnh đính kèm
    let diagram: Question['diagram'] = undefined;
    if (rawQ.images && rawQ.images.length > 0) {
      diagram = {
        type: 'image',
        url: rawQ.images[0],
        caption: `Hình ${idx + 1}: Hình vẽ mô tả đính kèm trong đề Word`,
      };
      imageCount += rawQ.images.length;
    }

    if (rawQ.part === 'Phần I') {
      part1Count++;
      // Xác định đáp án đúng
      let detectedCorrect = rawQ.part1TrailingAnswer;
      if (!detectedCorrect) {
        const markedOption = rawQ.options.find(o => o.isAsterisk || o.isRed || o.isUnderline);
        if (markedOption) {
          detectedCorrect = markedOption.id;
        }
      }

      const needsReview = !detectedCorrect;
      if (needsReview) {
        needsReviewCount++;
        warnings.push(`${rawQ.title}: Chưa nhận diện được đáp án đúng (tự động gắn cờ needs_review).`);
      }

      // Đảm bảo có đủ 4 phương án A, B, C, D
      const defaultOptions = ['A', 'B', 'C', 'D'];
      const finalOptions = defaultOptions.map(id => {
        const found = rawQ.options.find(o => o.id === id);
        return {
          id,
          text: found?.text || `Phương án ${id}`,
        };
      });

      const mcq: MultipleChoiceQuestion = {
        id: `word-q-${idx + 1}-mcq`,
        type: 'multiple_choice',
        part: 'Phần I',
        topic,
        level: detectedLevel,
        title: rawQ.title,
        points: 0.25,
        stem: fullStem,
        diagram,
        options: finalOptions,
        correctAnswer: (detectedCorrect || 'A') as 'A' | 'B' | 'C' | 'D',
        needs_review: needsReview,
        explanation: {
          overview: rawQ.explanationLines[0] || `Đáp án đúng là ${detectedCorrect || 'A'}.`,
          stepByStep: rawQ.explanationLines.length > 0 ? rawQ.explanationLines : [
            `Phân tích các phương án và chọn phương án ${detectedCorrect || 'A'}.`,
            'Kiểm tra lại điều kiện bài toán Vật lí.'
          ]
        }
      };
      questions.push(mcq);

    } else if (rawQ.part === 'Phần II') {
      part2Count++;
      const defaultItemIds = ['a', 'b', 'c', 'd'];
      const defaultItemLevels: CognitiveLevel[] = ['NB', 'TH', 'VD', 'VDC'];
      let needsReview = false;

      // Nhận diện đáp án cho 4 ý a, b, c, d
      const finalItems = defaultItemIds.map((itemId, itemIdx) => {
        const found = rawQ.items.find(it => it.id === itemId);
        let isCorrect = false;
        let determined = false;

        // Nhận diện mức độ nhận thức từng mệnh đề
        const itemCognitive = extractCognitiveLevelFromText(found?.text || '');
        const itemLevel: CognitiveLevel = itemCognitive.level || defaultItemLevels[itemIdx] || 'TH';

        // 1. Kiểm tra explicit (Đúng) / (Sai)
        if (found?.explicitTF !== undefined) {
          isCorrect = found.explicitTF;
          determined = true;
        }

        // 2. Kiểm tra chuỗi trailing pattern (ví dụ: DDSD -> Đ-Đ-S-Đ)
        if (!determined && rawQ.part2TrailingPattern && rawQ.part2TrailingPattern.length > itemIdx) {
          const char = rawQ.part2TrailingPattern[itemIdx];
          if (char === 'Đ' || char === 'D' || char === 'T') {
            isCorrect = true;
            determined = true;
          } else if (char === 'S' || char === 'F') {
            isCorrect = false;
            determined = true;
          }
        }

        // 3. Kiểm tra dấu hoa thị *, màu đỏ, gạch chân
        if (!determined && found) {
          if (found.isAsterisk || found.isRed || found.isUnderline) {
            isCorrect = true;
            determined = true;
          }
        }

        if (!determined) {
          needsReview = true;
        }

        return {
          id: itemId as 'a' | 'b' | 'c' | 'd',
          statement: found?.text || `Mệnh đề ${itemId}`,
          correctAnswer: isCorrect,
          level: itemLevel,
          explanation: `Nhận định ${itemId}) là ${isCorrect ? 'ĐÚNG' : 'SAI'}.`
        };
      });

      if (needsReview) {
        needsReviewCount++;
        warnings.push(`${rawQ.title}: Cần rà soát đáp án Đúng/Sai cho một số nhận định a, b, c, d.`);
      }

      const tfQuestion: TrueFalseClusterQuestion = {
        id: `word-q-${idx + 1}-tf`,
        type: 'true_false_cluster',
        part: 'Phần II',
        topic,
        level: detectedLevel,
        title: rawQ.title,
        points: 1.0,
        stem: fullStem,
        diagram,
        items: finalItems,
        needs_review: needsReview,
        explanation: {
          overview: rawQ.explanationLines[0] || `Lời giải phân tích 4 nhận định của ${rawQ.title}.`,
          stepByStep: rawQ.explanationLines.length > 0 ? rawQ.explanationLines : finalItems.map(it => `${it.id}) ${it.statement} -> ${it.correctAnswer ? 'ĐÚNG' : 'SAI'}`)
        }
      };
      questions.push(tfQuestion);

    } else {
      // Phần III: Trả lời ngắn
      part3Count++;
      let val = 0;
      let unit = '';
      let needsReview = false;

      if (rawQ.part3AnswerText) {
        const parts = rawQ.part3AnswerText.trim().split(/\s+/);
        const parsedVal = parseFloat(parts[0]);
        if (!isNaN(parsedVal)) {
          val = parsedVal;
          unit = parts.slice(1).join(' ');
        } else {
          needsReview = true;
        }
      } else {
        needsReview = true;
      }

      if (needsReview) {
        needsReviewCount++;
        warnings.push(`${rawQ.title}: Chưa trích xuất được số liệu đáp án trả lời ngắn.`);
      }

      const saQuestion: ShortAnswerQuestion = {
        id: `word-q-${idx + 1}-sa`,
        type: 'short_answer',
        part: 'Phần III',
        topic,
        level: detectedLevel,
        title: rawQ.title,
        points: 0.25,
        stem: fullStem,
        diagram,
        correctValue: val,
        tolerance: 0.05,
        acceptedUnits: unit ? [unit] : [],
        unitHint: unit || undefined,
        placeholder: unit ? `ví dụ: ${val} ${unit}` : `ví dụ: ${val}`,
        needs_review: needsReview,
        explanation: {
          overview: rawQ.explanationLines[0] || `Kết quả tính toán: ${val} ${unit}`.trim(),
          stepByStep: rawQ.explanationLines.length > 0 ? rawQ.explanationLines : [
            'Áp dụng công thức định luật Vật lí phù hợp.',
            `Tính toán được đáp số: $$${val}\\text{ ${unit}}$$.`
          ]
        }
      };
      questions.push(saQuestion);
    }
  }

  onProgress?.('Chuyển đổi thành công sang cấu trúc JSON!', 100);

  // Tạo cấu trúc Exam hoàn chỉnh
  const cleanTitle = (examTitleHint || file.name.replace(/\.[^/.]+$/, ''))
    .replace(/^[\s\-#]+/, '')
    .trim();

  const generatedExam: Exam = {
    id: `exam-imported-${Date.now()}`,
    title: cleanTitle.toUpperCase().startsWith('KỲ THI') || cleanTitle.toUpperCase().startsWith('ĐỀ THI')
      ? cleanTitle
      : `ĐỀ THI VẬT LÍ: ${cleanTitle}`,
    subtitle: `Đề thi trích xuất tự động từ tệp Word (.docx) - Cấu trúc GDPT 2018`,
    gradeLevel: 'Lớp 12 (Chương trình GDPT 2018)',
    durationMinutes: questions.length > 20 ? 50 : 45,
    totalPoints: 10,
    instructions: [
      'Phần I gồm các câu hỏi trắc nghiệm nhiều phương án lựa chọn (chọn 1 phương án đúng).',
      'Phần II gồm các câu hỏi trắc nghiệm Đúng/Sai (mỗi câu gồm 4 ý a, b, c, d).',
      'Phần III gồm các câu hỏi trắc nghiệm trả lời ngắn (điền kết quả số học kèm đơn vị).'
    ],
    questions,
  };

  return {
    exam: generatedExam,
    summary: {
      totalQuestions: questions.length,
      part1Count,
      part2Count,
      part3Count,
      imageCount,
      needsReviewCount,
    },
    warnings,
  };
}
