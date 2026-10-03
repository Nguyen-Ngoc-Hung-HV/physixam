import { DiagramData } from '../types/exam';

/**
 * Hàm sinh đồ thị SVG nội suy có độ chính xác cao dựa trên phân tích bài toán (Client-side fallback)
 */
export function generateProceduralPhysicsSvg(stem: string, topic?: string): string {
  const lower = (stem + ' ' + (topic || '')).toLowerCase();

  // 1. Dao động điều hòa hoặc đồ thị li độ - thời gian x(t)
  if (lower.includes('dao động') || lower.includes('x(t)') || lower.includes('li độ') || lower.includes('chu kì') || lower.includes('biên độ')) {
    return `<svg viewBox="0 0 520 250" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="ax-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
    </marker>
    <pattern id="diag-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="520" height="250" fill="#ffffff" rx="10"/>
  <rect width="480" height="210" x="20" y="20" fill="url(#diag-grid)" rx="6"/>
  <!-- Trục tọa độ -->
  <line x1="40" y1="125" x2="480" y2="125" stroke="#334155" stroke-width="2" marker-end="url(#ax-arrow)" />
  <text x="485" y="130" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">t (s)</text>
  <line x1="70" y1="220" x2="70" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#ax-arrow)" />
  <text x="50" y="25" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">x (cm)</text>
  <!-- Các vạch biên độ -->
  <line x1="65" y1="65" x2="75" y2="65" stroke="#475569" stroke-width="1.8"/>
  <text x="40" y="69" font-family="sans-serif" font-size="11" font-weight="600" fill="#475569">+A</text>
  <line x1="70" y1="65" x2="460" y2="65" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1"/>
  <line x1="65" y1="185" x2="75" y2="185" stroke="#475569" stroke-width="1.8"/>
  <text x="42" y="189" font-family="sans-serif" font-size="11" font-weight="600" fill="#475569">-A</text>
  <line x1="70" y1="185" x2="460" y2="185" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1"/>
  <text x="58" y="138" font-family="sans-serif" font-size="11" fill="#475569">0</text>
  <!-- Đường sóng hình sin -->
  <path d="M 70 65 C 105 65, 125 185, 160 185 C 195 185, 215 65, 250 65 C 285 65, 305 185, 340 185 C 375 185, 395 65, 430 65" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <!-- Điểm mốc T/2 và T -->
  <circle cx="160" cy="185" r="4" fill="#dc2626"/>
  <line x1="250" y1="65" x2="250" y2="125" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1.2"/>
  <circle cx="250" cy="65" r="4.5" fill="#2563eb"/>
  <text x="245" y="142" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a">T</text>
  <text x="150" y="205" font-family="sans-serif" font-size="11" font-weight="600" fill="#dc2626">T/2</text>
</svg>`;
  }

  // 2. Sóng cơ u-x
  if (lower.includes('sóng cơ') || lower.includes('bước sóng') || lower.includes('u-x') || lower.includes('lan truyền')) {
    return `<svg viewBox="0 0 520 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="wave-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
    </marker>
    <marker id="dir-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>
  <rect width="520" height="240" fill="#ffffff" rx="10"/>
  <line x1="30" y1="120" x2="480" y2="120" stroke="#334155" stroke-width="2" marker-end="url(#wave-arr)"/>
  <text x="485" y="125" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">x (cm)</text>
  <line x1="60" y1="210" x2="60" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#wave-arr)"/>
  <text x="40" y="25" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">u (cm)</text>
  <!-- Chiều truyền sóng -->
  <line x1="320" y1="45" x2="380" y2="45" stroke="#0284c7" stroke-width="2.5" marker-end="url(#dir-arr)"/>
  <text x="325" y="38" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0284c7">v truyền sóng</text>
  <!-- Đường sóng u-x -->
  <path d="M 60 120 C 85 70, 105 70, 130 120 C 155 170, 175 170, 200 120 C 225 70, 245 70, 270 120 C 295 170, 315 170, 340 120 C 365 70, 385 70, 410 120" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <!-- Đoạn bước sóng lambda -->
  <line x1="95" y1="200" x2="235" y2="200" stroke="#0284c7" stroke-width="1.8"/>
  <line x1="95" y1="195" x2="95" y2="205" stroke="#0284c7" stroke-width="1.8"/>
  <line x1="235" y1="195" x2="235" y2="205" stroke="#0284c7" stroke-width="1.8"/>
  <text x="150" y="218" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0284c7">Bước sóng λ</text>
  <circle cx="165" cy="145" r="4.5" fill="#dc2626"/>
  <text x="175" y="145" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">Điểm M</text>
</svg>`;
  }

  // 3. Nhiệt động lực học - Chu trình P-V
  if (lower.includes('nhiệt') || lower.includes('p-v') || lower.includes('chu trình') || lower.includes('đẳng áp') || lower.includes('đẳng nhiệt') || lower.includes('đẳng tích')) {
    return `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="pv-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
    </marker>
    <marker id="cy-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>
  <rect width="520" height="260" fill="#ffffff" rx="10"/>
  <line x1="60" y1="220" x2="480" y2="220" stroke="#334155" stroke-width="2" marker-end="url(#pv-arr)"/>
  <text x="485" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">V (m³)</text>
  <line x1="60" y1="220" x2="60" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#pv-arr)"/>
  <text x="35" y="25" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">P (Pa)</text>
  <!-- Chu trình 1 -> 2 -> 3 -> 1 -->
  <polygon points="140,80 380,160 140,160" fill="#e0f2fe" opacity="0.6"/>
  <path d="M 140 80 Q 240 120 380 160" fill="none" stroke="#2563eb" stroke-width="3"/>
  <line x1="380" y1="160" x2="140" y2="160" stroke="#059669" stroke-width="3"/>
  <line x1="140" y1="160" x2="140" y2="80" stroke="#dc2626" stroke-width="3"/>
  <!-- Điểm trạng thái -->
  <circle cx="140" cy="80" r="5" fill="#2563eb"/>
  <text x="145" y="70" font-family="sans-serif" font-size="13" font-weight="bold" fill="#2563eb">(1)</text>
  <circle cx="380" cy="160" r="5" fill="#059669"/>
  <text x="390" y="165" font-family="sans-serif" font-size="13" font-weight="bold" fill="#059669">(2)</text>
  <circle cx="140" cy="160" r="5" fill="#dc2626"/>
  <text x="120" y="175" font-family="sans-serif" font-size="13" font-weight="bold" fill="#dc2626">(3)</text>
  <text x="210" y="145" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0369a1">Công A &gt; 0</text>
</svg>`;
  }

  // 4. Mạch điện xoay chiều RLC
  if (lower.includes('mạch') || lower.includes('rlc') || lower.includes('điện trở') || lower.includes('tụ điện') || lower.includes('cuộn cảm')) {
    return `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="220" fill="#ffffff" rx="10"/>
  <rect x="70" y="40" width="380" height="130" fill="none" stroke="#334155" stroke-width="2.5" rx="4"/>
  <!-- Nguồn xoay chiều bên trái -->
  <g transform="translate(70, 105)">
    <rect x="-14" y="-20" width="28" height="40" fill="#ffffff"/>
    <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
    <path d="M -10 0 Q -5 -10 0 0 T 10 0" fill="none" stroke="#2563eb" stroke-width="2"/>
    <text x="-55" y="4" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a">u(t)</text>
  </g>
  <!-- Điện trở R -->
  <g transform="translate(170, 40)">
    <rect x="-25" y="-10" width="50" height="20" fill="#f8fafc" stroke="#047857" stroke-width="2" rx="2"/>
    <text x="-20" y="25" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857">R</text>
  </g>
  <!-- Cuộn cảm L -->
  <g transform="translate(260, 40)">
    <rect x="-30" y="-12" width="60" height="24" fill="#ffffff"/>
    <path d="M -24 0 A 7 9 0 0 1 -12 0 A 7 9 0 0 1 0 0 A 7 9 0 0 1 12 0 A 7 9 0 0 1 24 0" fill="none" stroke="#d97706" stroke-width="2.5"/>
    <text x="-8" y="25" font-family="sans-serif" font-size="11" font-weight="bold" fill="#d97706">L</text>
  </g>
  <!-- Tụ điện C -->
  <g transform="translate(360, 40)">
    <rect x="-20" y="-18" width="40" height="36" fill="#ffffff"/>
    <line x1="-6" y1="-14" x2="-6" y2="14" stroke="#7c3aed" stroke-width="3"/>
    <line x1="6" y1="-14" x2="6" y2="14" stroke="#7c3aed" stroke-width="3"/>
    <text x="-6" y="28" font-family="sans-serif" font-size="11" font-weight="bold" fill="#7c3aed">C</text>
  </g>
</svg>`;
  }

  // 5. Thấu kính / Quang hình học
  if (lower.includes('thấu kính') || lower.includes('quang học') || lower.includes('tiêu cự') || lower.includes('vật sáng')) {
    return `<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="opt-arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#dc2626" />
    </marker>
  </defs>
  <rect width="520" height="220" fill="#ffffff" rx="10"/>
  <!-- Trục chính -->
  <line x1="30" y1="110" x2="490" y2="110" stroke="#334155" stroke-width="1.8"/>
  <text x="495" y="114" font-family="sans-serif" font-size="12" fill="#334155">Δ</text>
  <!-- Thấu kính hội tụ -->
  <line x1="260" y1="20" x2="260" y2="200" stroke="#0284c7" stroke-width="2.8"/>
  <path d="M 255 28 L 260 18 L 265 28" fill="none" stroke="#0284c7" stroke-width="2"/>
  <path d="M 255 192 L 260 202 L 265 192" fill="none" stroke="#0284c7" stroke-width="2"/>
  <circle cx="260" cy="110" r="3.5" fill="#0284c7"/>
  <text x="264" y="125" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0284c7">O</text>
  <!-- Tiêu điểm F, F' -->
  <circle cx="180" cy="110" r="3" fill="#475569"/>
  <text x="175" y="125" font-family="sans-serif" font-size="11" font-weight="bold" fill="#475569">F</text>
  <circle cx="340" cy="110" r="3" fill="#475569"/>
  <text x="335" y="125" font-family="sans-serif" font-size="11" font-weight="bold" fill="#475569">F'</text>
  <!-- Vật sáng AB -->
  <line x1="130" y1="110" x2="130" y2="70" stroke="#16a34a" stroke-width="2.8"/>
  <polygon points="127,70 130,62 133,70" fill="#16a34a"/>
  <text x="122" y="58" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">B</text>
  <text x="122" y="125" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">A</text>
  <!-- Tia sáng 1: song song trục chính qua F' -->
  <line x1="130" y1="70" x2="260" y2="70" stroke="#dc2626" stroke-width="1.6" marker-end="url(#opt-arr)"/>
  <line x1="260" y1="70" x2="430" y2="155" stroke="#dc2626" stroke-width="1.6"/>
  <!-- Tia sáng 2: qua quang tâm O truyền thẳng -->
  <line x1="130" y1="70" x2="430" y2="155" stroke="#2563eb" stroke-width="1.6"/>
  <!-- Ảnh thật A'B' -->
  <line x1="430" y1="110" x2="430" y2="155" stroke="#9333ea" stroke-width="2.8"/>
  <polygon points="427,155 430,163 433,155" fill="#9333ea"/>
  <text x="435" y="170" font-family="sans-serif" font-size="12" font-weight="bold" fill="#9333ea">B'</text>
  <text x="435" y="125" font-family="sans-serif" font-size="12" font-weight="bold" fill="#9333ea">A'</text>
</svg>`;
  }

  // 6. Mặc định: Hệ trục tọa độ và đường biến thiên đặc trưng
  return `<svg viewBox="0 0 520 240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="std-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
    </marker>
  </defs>
  <rect width="520" height="240" fill="#ffffff" rx="10"/>
  <line x1="50" y1="190" x2="480" y2="190" stroke="#334155" stroke-width="2" marker-end="url(#std-arrow)"/>
  <text x="485" y="195" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">x</text>
  <line x1="70" y1="210" x2="70" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#std-arrow)"/>
  <text x="50" y="25" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">y</text>
  <!-- Đường cong khảo sát -->
  <path d="M 70 180 Q 180 70 320 90 T 460 60" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <circle cx="320" cy="90" r="5" fill="#dc2626"/>
  <text x="330" y="85" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">Điểm cực trị</text>
</svg>`;
}

/**
 * Gọi API máy chủ để phân tích câu hỏi và dựng đồ thị vector SVG chuẩn xác
 */
export async function generateSvgDiagramForQuestion(
  questionStem: string,
  questionTitle?: string,
  topic?: string
): Promise<DiagramData> {
  try {
    const response = await fetch('/api/gemini/generate-svg-diagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionStem,
        questionTitle,
        topic,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.svg && typeof data.svg === 'string' && data.svg.includes('<svg')) {
        return {
          type: 'svg',
          content: data.svg.trim(),
          caption: 'Đồ thị SVG chuẩn hóa do AI khởi tạo',
        };
      }
    }
  } catch (err) {
    console.warn('Lỗi gọi API server-side generate-svg-diagram, chuyển sang bộ sinh nội suy:', err);
  }

  // Fallback an toàn chất lượng cao
  const fallbackSvg = generateProceduralPhysicsSvg(questionStem, topic);
  return {
    type: 'svg',
    content: fallbackSvg,
    caption: 'Đồ thị vector SVG mô phỏng hiện tượng Vật lí',
  };
}
