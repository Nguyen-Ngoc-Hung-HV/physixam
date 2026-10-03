import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PHYSICS_PROMPT = `Bạn là chuyên gia hàng đầu về Khảo thí môn Vật lí THPT tại Việt Nam (theo Chương trình Giáo dục Phổ thông 2018 của Bộ Giáo dục và Đào tạo).

Nhiệm vụ: Trích xuất hoặc khởi tạo đề thi/câu hỏi môn Vật lí đạt chuẩn cấu trúc khảo thí mới nhất, hỗ trợ biểu diễn công thức KaTeX và đồ thị vector SVG nội tuyến.

QUY TẮC BẮT BUỘC:
1. KÝ HIỆU TOÁN & VẬT LÍ:
   - Tất cả ký hiệu, đại lượng, đơn vị và công thức PHẢI được đặt trong cú pháp KaTeX:
     * Nội dòng: $x = A\\cos(\\omega t + \\varphi)$, $v = \\lambda f$, $10^{-21}\\text{ J}$, $T = 300\\text{ K}$.
     * Khối công thức: $$W = \\frac{1}{2}kA^2$$, $$\\Delta U = A + Q$$.
   - Tuyệt đối không dùng ký tự Unicode đơn giản thay cho công thức (ví dụ: dùng $\\omega$, không dùng w; dùng $\\Delta t$, không dùng delta t).

2. ĐỒ THỊ VÀ SƠ ĐỒ VECTOR (SVG INLINE):
   - Khi câu hỏi có đồ thị (dao động $x-t$, sóng cơ $u-x$, chu trình nhiệt động $P-V$, tia sáng quang học, mạch xoay chiều RLC), BẮT BUỘC sinh mã SVG chất lượng cao:
     * Cung cấp trong trường "diagram":
       {
         "type": "svg",
         "caption": "Hình minh họa: ...",
         "content": "<svg viewBox=\\"0 0 500 200\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>"
       }
     * Mã SVG phải có viewBox cân đối, các trục tọa độ rõ nét, mũi tên trục, nhãn chữ, vạch chia và đường đồ thị màu sắc tương phản rõ (ví dụ: nét đồ thị stroke="#2563eb", stroke-width="2.5").

3. CẤU TRÚC 3 PHẦN CHUẨN BỘ GD&ĐT 2025:
   - Phần I (Trắc nghiệm nhiều lựa chọn):
     * "type": "multiple_choice", "part": "Phần I", "points": 0.25
     * "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]
     * "correctAnswer": "A" | "B" | "C" | "D"
   - Phần II (Trắc nghiệm Đúng/Sai):
     * "type": "true_false_cluster", "part": "Phần II", "points": 1.0
     * "items": 4 ý a, b, c, d. Mỗi ý gồm:
       {"id": "a", "statement": "Nội dung nhận định...", "correctAnswer": true/false, "explanation": "Giải thích ngắn vì sao đúng/sai"}
   - Phần III (Trắc nghiệm Trả lời ngắn):
     * "type": "short_answer", "part": "Phần III", "points": 0.25
     * "correctValue": giá trị số (ví dụ: 12.5 hoặc -4)
     * "tolerance": 0.05
     * "unitHint": "m/s", "acceptedUnits": ["m/s", ""]

4. LỜI GIẢI CHI TIẾT (Bắt buộc cho mọi câu):
   "explanation": {
     "overview": "Tổng quan phương pháp giải",
     "keyFormula": "Công thức then chốt dạng KaTeX (không bọc $$)",
     "stepByStep": ["Bước 1: ...", "Bước 2: ..."]
   }

5. ĐỊNH DẠNG ĐẦU RA:
   Chỉ xuất DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
   {
     "title": "Tên kỳ thi / đề thi",
     "subtitle": "Chủ đề / Đơn vị kiến thức",
     "durationMinutes": 50,
     "questions": [ ... các câu hỏi theo định dạng trên ... ]
   }`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được thiết lập trong biến môi trường hệ thống.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  const distPath = path.resolve(__dirname, 'dist');
  const isDev = process.env.npm_lifecycle_event === 'dev';
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (!isDev && fs.existsSync(path.join(distPath, 'index.html')));

  // If running inside AI Studio dev container (NGINX_PORT=8080), listen on DEFAULT_APP_PORT (3000)
  // If running on Cloud Run in production, listen on process.env.PORT (8080)
  const isDevContainer = Boolean(process.env.NGINX_PORT && process.env.DEFAULT_APP_PORT);
  const PORT = isDevContainer
    ? Number(process.env.DEFAULT_APP_PORT) || 3000
    : Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  // API health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mode: isProd ? 'production' : 'development',
    });
  });

  // POST /api/gemini/generate-from-prompt
  app.post('/api/gemini/generate-from-prompt', async (req: Request, res: Response) => {
    try {
      const { promptText, topic, difficulty } = req.body;
      if (!promptText) {
        res.status(400).json({ error: 'Thiếu nội dung yêu cầu (promptText).' });
        return;
      }

      const ai = getGeminiClient();
      const fullPrompt = `Hãy khởi tạo các câu hỏi trắc nghiệm Vật lí THPT mới theo yêu cầu sau:
- Chủ đề trọng tâm: ${topic || 'Vật lí THPT'}
- Mức độ nhận thức: ${difficulty || 'Vận dụng'}
- Yêu cầu chi tiết từ giáo viên: ${promptText}

Bắt buộc tuân thủ:
1. Đảm bảo cấu trúc chuẩn 3 phần (Phần I trắc nghiệm 4 lựa chọn, Phần II đúng sai 4 ý a,b,c,d, Phần III trả lời ngắn).
2. Mọi công thức đều viết bằng KaTeX ($...$).
3. Nếu có liên quan đến đồ thị hoặc mạch điện, bắt buộc vẽ thẻ <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">...</svg> chi tiết trong trường diagram.
4. Kèm lời giải chi tiết và công thức then chốt cho từng câu.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_PHYSICS_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Mô hình không phản hồi văn bản.' });
        return;
      }

      res.json({ text });
    } catch (err: any) {
      console.error('Lỗi API /api/gemini/generate-from-prompt:', err);
      res.status(500).json({
        error: err?.message || 'Lỗi xử lý yêu cầu AI tạo đề thi.',
      });
    }
  });

  // POST /api/gemini/generate-from-image
  app.post('/api/gemini/generate-from-image', async (req: Request, res: Response) => {
    try {
      const { base64Data, mimeType, additionalNotes } = req.body;
      if (!base64Data) {
        res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh (base64Data).' });
        return;
      }

      const ai = getGeminiClient();
      const promptText = `Trích xuất toàn bộ các câu hỏi vật lí từ hình ảnh/tài liệu này sang định dạng JSON đề thi chuẩn hóa của hệ thống PhysiXam.
Chuyển đổi toàn bộ công thức toán học và vật lí sang KaTeX ($...$).
Nếu câu hỏi có hình vẽ, đồ thị (đồ thị sóng, dao động, mạch điện, đồ thị PV, tia sáng), hãy tạo một đồ thị vector <svg> nội tuyến sắc nét trong trường 'diagram' tương ứng.
${additionalNotes ? `Yêu cầu bổ sung của giáo viên: ${additionalNotes}` : ''}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          systemInstruction: SYSTEM_PHYSICS_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text;
      if (!text) {
        res.status(502).json({ error: 'Mô hình không phản hồi văn bản.' });
        return;
      }

      res.json({ text });
    } catch (err: any) {
      console.error('Lỗi API /api/gemini/generate-from-image:', err);
      res.status(500).json({
        error: err?.message || 'Lỗi xử lý yêu cầu AI quét ảnh đề thi.',
      });
    }
  });

  // POST /api/gemini/generate-svg-diagram
  app.post('/api/gemini/generate-svg-diagram', async (req: Request, res: Response) => {
    try {
      const { questionStem, questionTitle, topic } = req.body;
      if (!questionStem) {
        res.status(400).json({ error: 'Thiếu nội dung câu hỏi (questionStem).' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Bạn là chuyên gia mô phỏng đồ họa vector SVG cho môn Vật lí THPT Việt Nam (Chương trình GDPT 2018).
Phân tích bài toán Vật lí sau:
- Tiêu đề: ${questionTitle || 'Bài toán Vật lí'}
- Chủ đề: ${topic || 'Vật lí'}
- Đề bài: ${questionStem}

Nhiệm vụ: Hãy vẽ một đồ thị hoặc sơ đồ vector <svg viewBox="0 0 540 250" xmlns="http://www.w3.org/2000/svg">...</svg> chính xác và đẹp mắt nhất cho bài toán trên.
Quy tắc:
1. Chỉ trả về DUY NHẤT một chuỗi XML SVG hoàn chỉnh, bắt đầu bằng <svg và kết thúc bằng </svg>. Tuyệt đối không bọc trong markdown codeblock.
2. Vẽ đầy đủ:
   - Hệ trục tọa độ với mũi tên nhọn (marker-end) và nhãn đại lượng, đơn vị (font-family sans-serif).
   - Vạch chia và giá trị số liệu trên trục nếu đề bài có dữ liệu cụ thể.
   - Nét vẽ đường cong/sơ đồ rõ nét (stroke-width từ 2.5 đến 3px, màu sắc stroke="#2563eb" hoặc "#059669" hoặc "#dc2626").
   - Điểm đặc biệt, mốc thời gian hoặc trạng thái khảo sát (circle r="4.5").
   - Lưới mờ nếu là đồ thị dao động/sóng/chu trình.
3. Kích thước chuẩn viewBox="0 0 540 250" hoặc viewBox="0 0 520 240".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      let svgText = response.text || '';
      // Loại bỏ markdown codeblock nếu model trả về
      if (svgText.includes('```xml')) {
        svgText = svgText.split('```xml')[1].split('```')[0].trim();
      } else if (svgText.includes('```svg')) {
        svgText = svgText.split('```svg')[1].split('```')[0].trim();
      } else if (svgText.includes('```')) {
        svgText = svgText.split('```')[1].split('```')[0].trim();
      }

      // Trích xuất từ <svg đến </svg>
      const svgStart = svgText.indexOf('<svg');
      const svgEnd = svgText.lastIndexOf('</svg>');
      if (svgStart !== -1 && svgEnd !== -1) {
        svgText = svgText.substring(svgStart, svgEnd + 6);
      }

      res.json({ svg: svgText.trim() });
    } catch (err: any) {
      console.error('Lỗi API /api/gemini/generate-svg-diagram:', err);
      res.status(500).json({
        error: err?.message || 'Lỗi dựng đồ thị vector SVG bằng AI.',
      });
    }
  });

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PhysiXam Server listening on 0.0.0.0:${PORT} (${
        isProd ? 'production static' : 'development'
      })`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
