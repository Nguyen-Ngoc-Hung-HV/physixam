import { Exam } from '../types/exam';

export const samplePhysicsExam: Exam = {
  id: 'physics-national-prep-2026',
  title: 'KIỂM TRA ĐÁNH GIÁ NĂNG LỰC VẬT LÝ',
  subtitle: 'NĂM HỌC 2026 - 2027 • Môn: VẬT LÍ - Lớp 12',
  gradeLevel: 'Lớp 12',
  durationMinutes: 45,
  totalPoints: 10,
  instructions: [
    'Đề thi áp dụng cấu trúc định dạng chuẩn năm 2025 của Bộ GD&ĐT:',
    '• Phần I gồm các câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D). Mỗi câu trả lời đúng được 0,25 điểm.',
    '• Phần II gồm các câu hỏi trắc nghiệm Đúng/Sai lũy tiến. Mỗi câu gồm 4 lệnh hỏi a, b, c, d. Điểm tính theo barem: Đúng 1 ý = 0,1đ | Đúng 2 ý = 0,25đ | Đúng 3 ý = 0,5đ | Đúng cả 4 ý = 1,0đ.',
    '• Phần III gồm các câu hỏi trắc nghiệm Trả lời ngắn. Mỗi câu trả lời đúng được 0,25 điểm. Hỗ trợ nhập số nguyên, số thập phân (chấp nhận cả dấu chấm hoặc dấu phẩy) và có thể kèm hoặc không kèm đơn vị đo.',
    'Hằng số vật lí quy ước: $c = 3 \\times 10^8\\text{ m/s}$, $g = 9{,}8\\text{ m/s}^2$ (hoặc $10\\text{ m/s}^2$ khi có ghi chú), $R = 8{,}31\\text{ J/(mol}\\cdot\\text{K)}$.'
  ],
  questions: [
    // ================= PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN =================
    // CÂU 1
    {
      id: 'q1-wave-graph',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Dao động & Sóng cơ',
      level: 'NB',
      title: 'Câu 1: Quá trình truyền sóng cơ hình sin trên sợi dây đàn hồi',
      points: 0.25,
      stem: 'Một sóng hình sin lan truyền dọc theo chiều dương của trục $Ox$ với tốc độ truyền sóng không đổi $v = 1{,}2\\text{ m/s}$. Hình bên là hình ảnh đồ thị li độ - khoảng cách ($u-x$) của sợi dây tại thời điểm $t = 0$. Điểm $M$ trên dây có tọa độ $x_M = 15\\text{ cm}$.\n\nTần số dao động $f$ của nguồn sóng và vận tốc dao động $v_M$ của phần tử môi trường tại điểm $M$ ở thời điểm $t = 0$ là:',
      diagram: {
        type: 'svg',
        caption: 'Hình 1: Đồ thị li độ - toạ độ u(x) tại thời điểm t = 0 thể hiện bước sóng λ và vị trí điểm M',
        content: `<svg viewBox="0 0 700 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" stroke-width="1"/>
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#334155" />
    </marker>
    <marker id="wave-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284c7" />
    </marker>
  </defs>
  <rect width="700" height="320" fill="#ffffff" />
  <rect width="660" height="280" x="20" y="20" fill="url(#grid)" />
  <line x1="40" y1="160" x2="660" y2="160" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" />
  <text x="665" y="165" font-family="sans-serif" font-size="14" font-weight="600" fill="#0f172a">x (cm)</text>
  <line x1="80" y1="280" x2="80" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#arrow)" />
  <text x="65" y="25" font-family="sans-serif" font-size="14" font-weight="600" fill="#0f172a">u (cm)</text>
  <g transform="translate(410, 45)">
    <rect x="-10" y="-18" width="190" height="32" rx="6" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>
    <text x="0" y="4" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0369a1">Tốc độ sóng v = 1,2 m/s</text>
    <line x1="140" y1="0" x2="165" y2="0" stroke="#0284c7" stroke-width="2.5" marker-end="url(#wave-arrow)"/>
  </g>
  <line x1="75" y1="80" x2="85" y2="80" stroke="#475569" stroke-width="2"/>
  <text x="46" y="85" font-family="sans-serif" font-size="12" fill="#475569">+4,0</text>
  <line x1="75" y1="240" x2="85" y2="240" stroke="#475569" stroke-width="2"/>
  <text x="48" y="245" font-family="sans-serif" font-size="12" fill="#475569">-4,0</text>
  <text x="68" y="175" font-family="sans-serif" font-size="12" fill="#475569">0</text>
  <line x1="80" y1="80" x2="620" y2="80" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1.2"/>
  <line x1="80" y1="240" x2="620" y2="240" stroke="#cbd5e1" stroke-dasharray="4,4" stroke-width="1.2"/>
  <line x1="200" y1="155" x2="200" y2="165" stroke="#475569" stroke-width="1.5"/>
  <text x="193" y="180" font-family="sans-serif" font-size="12" fill="#475569">20</text>
  <line x1="320" y1="155" x2="320" y2="165" stroke="#475569" stroke-width="1.5"/>
  <text x="313" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">40</text>
  <line x1="440" y1="155" x2="440" y2="165" stroke="#475569" stroke-width="1.5"/>
  <text x="433" y="180" font-family="sans-serif" font-size="12" fill="#475569">60</text>
  <line x1="560" y1="155" x2="560" y2="165" stroke="#475569" stroke-width="1.5"/>
  <text x="553" y="180" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">80</text>
  <line x1="80" y1="290" x2="320" y2="290" stroke="#0284c7" stroke-width="1.5" />
  <line x1="80" y1="285" x2="80" y2="295" stroke="#0284c7" stroke-width="1.5" />
  <line x1="320" y1="285" x2="320" y2="295" stroke="#0284c7" stroke-width="1.5" />
  <text x="175" y="306" font-family="sans-serif" font-size="12" font-weight="600" fill="#0284c7">Bước sóng λ = 40 cm</text>
  <path d="M 80 160 C 105 105, 115 80, 140 80 C 165 80, 175 105, 200 160 C 225 215, 235 240, 260 240 C 285 240, 295 215, 320 160 C 345 105, 355 80, 380 80 C 405 80, 415 105, 440 160 C 465 215, 475 240, 500 240 C 525 240, 535 215, 560 160 C 585 105, 595 80, 620 80" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="170" cy="103.4" r="5.5" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
  <text x="175" y="96" font-family="sans-serif" font-size="14" font-weight="bold" fill="#dc2626">M (x = 15 cm)</text>
  <line x1="170" y1="103.4" x2="170" y2="65" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow)"/>
  <text x="178" y="70" font-family="sans-serif" font-size="12" font-weight="600" fill="#dc2626">v_M</text>
  <circle cx="140" cy="80" r="4" fill="#0284c7" />
  <text x="115" y="65" font-family="sans-serif" font-size="11" fill="#475569">Đỉnh sóng</text>
</svg>`
      },
      options: [
        { id: 'A', text: '$f = 3{,}0\\text{ Hz}$ và phần tử $M$ đang chuyển động đi lên với tốc độ $v_M = 37{,}7\\text{ cm/s}$' },
        { id: 'B', text: '$f = 3{,}0\\text{ Hz}$ và phần tử $M$ đang chuyển động đi xuống với tốc độ $v_M = 37{,}7\\text{ cm/s}$' },
        { id: 'C', text: '$f = 1{,}5\\text{ Hz}$ và phần tử $M$ đang chuyển động đi lên với tốc độ $v_M = 26{,}6\\text{ cm/s}$' },
        { id: 'D', text: '$f = 6{,}0\\text{ Hz}$ và phần tử $M$ đang đứng yên tức thời ($v_M = 0$)' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Từ đồ thị hình dạng sóng tại $t = 0$, xác định bước sóng $\\lambda = 40\\text{ cm}$, tần số dao động $f = 3{,}0\\text{ Hz}$ và chiều chuyển động của phần tử $M$.',
        keyFormula: '\\lambda = 40\\text{ cm},\\quad f = \\frac{v}{\\lambda} = 3{,}0\\text{ Hz},\\quad |v_M| = \\omega \\sqrt{A^2 - u_M^2}',
        stepByStep: [
          'Bước 1: Đọc bước sóng từ khoảng cách giữa 2 đỉnh liên tiếp: $\\lambda = 40\\text{ cm} = 0{,}40\\text{ m}$.',
          'Bước 2: Tần số sóng: $f = \\frac{v}{\\lambda} = \\frac{1{,}2}{0{,}40} = 3{,}0\\text{ Hz}$, tần số góc $\\omega = 6\\pi\\text{ rad/s}$.',
          'Bước 3: Tại $x_M = 15\\text{ cm}$, li độ $u_M = 4\\sin(3\\pi/4) = 2\\sqrt{2}\\text{ cm}$. Sóng truyền sang phải nên sườn trước (chứa điểm M) đang đi LÊN.',
          'Bước 4: Tốc độ dao động: $|v_M| = \\omega \\sqrt{A^2 - u_M^2} = 6\\pi \\cdot 2\\sqrt{2} \\approx 37{,}7\\text{ cm/s}$. Chọn A.'
        ]
      }
    },

    // CÂU 2
    {
      id: 'q2-ray-optics',
      type: 'multiple_choice',
      part: 'Phần I',
      topic: 'Quang học & Sóng ánh sáng',
      level: 'TH',
      title: 'Câu 2: Hiện tượng tạo ảnh của vật sáng qua thấu kính hội tụ mỏng',
      points: 0.25,
      stem: 'Một vật sáng phẳng nhỏ $AB$ có chiều cao $h = 2{,}0\\text{ cm}$ đặt vuông góc với trục chính của một thấu kính hội tụ mỏng có tiêu cự $f = 20{,}0\\text{ cm}$. Khoảng cách từ vật đến quang tâm thấu kính là $d = 30{,}0\\text{ cm}$.\n\nXác định khoảng cách $d\'$ từ ảnh đến thấu kính và chiều cao $h\'$ của ảnh thật $A\'B\'$ thu được:',
      diagram: {
        type: 'svg',
        caption: 'Hình 2: Đường truyền của các tia sáng đặc biệt qua thấu kính hội tụ mỏng',
        content: `<svg viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <defs>
    <marker id="ray-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#dc2626" />
    </marker>
    <marker id="ray2-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563eb" />
    </marker>
  </defs>
  <rect width="680" height="260" fill="#ffffff" rx="8"/>
  <line x1="30" y1="130" x2="650" y2="130" stroke="#334155" stroke-width="1.8"/>
  <text x="655" y="134" font-family="sans-serif" font-size="12" fill="#334155">Δ</text>
  <line x1="320" y1="20" x2="320" y2="240" stroke="#0284c7" stroke-width="3"/>
  <path d="M 314 30 L 320 18 L 326 30" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <path d="M 314 230 L 320 242 L 326 230" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <circle cx="320" cy="130" r="3.5" fill="#0284c7"/>
  <text x="325" y="145" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0284c7">O</text>
  <circle cx="220" cy="130" r="3" fill="#475569"/>
  <text x="215" y="148" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">F</text>
  <circle cx="420" cy="130" r="3" fill="#475569"/>
  <text x="415" y="148" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">F'</text>
  <line x1="170" y1="130" x2="170" y2="90" stroke="#16a34a" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="162" y="148" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">B</text>
  <text x="162" y="85" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">A</text>
  <text x="130" y="112" font-family="sans-serif" font-size="11" fill="#16a34a">h = 2cm</text>
  <line x1="170" y1="90" x2="320" y2="90" stroke="#dc2626" stroke-width="1.8"/>
  <line x1="235" y1="90" x2="255" y2="90" stroke="#dc2626" stroke-width="1.8" marker-end="url(#ray-arrow)"/>
  <line x1="320" y1="90" x2="620" y2="210" stroke="#dc2626" stroke-width="1.8"/>
  <line x1="460" y1="146" x2="480" y2="154" stroke="#dc2626" stroke-width="1.8" marker-end="url(#ray-arrow)"/>
  <line x1="170" y1="90" x2="620" y2="210" stroke="#2563eb" stroke-width="1.8"/>
  <line x1="240" y1="108.6" x2="255" y2="112.6" stroke="#2563eb" stroke-width="1.8" marker-end="url(#ray2-arrow)"/>
  <line x1="460" y1="167.3" x2="480" y2="172.6" stroke="#2563eb" stroke-width="1.8" marker-end="url(#ray2-arrow)"/>
  <line x1="620" y1="130" x2="620" y2="210" stroke="#9333ea" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="625" y="145" font-family="sans-serif" font-size="12" font-weight="bold" fill="#9333ea">B'</text>
  <text x="625" y="215" font-family="sans-serif" font-size="12" font-weight="bold" fill="#9333ea">A'</text>
  <text x="630" y="175" font-family="sans-serif" font-size="11" fill="#9333ea">h' = 4cm</text>
</svg>`
      },
      options: [
        { id: 'A', text: '$d\' = 60{,}0\\text{ cm}$, ảnh thật có chiều cao $h\' = 4{,}0\\text{ cm}$ (ngược chiều với vật)' },
        { id: 'B', text: '$d\' = 40{,}0\\text{ cm}$, ảnh thật có chiều cao $h\' = 2{,}0\\text{ cm}$ (ngược chiều với vật)' },
        { id: 'C', text: '$d\' = 60{,}0\\text{ cm}$, ảnh ảo có chiều cao $h\' = 4{,}0\\text{ cm}$ (cùng chiều với vật)' },
        { id: 'D', text: '$d\' = 15{,}0\\text{ cm}$, ảnh thật có chiều cao $h\' = 1{,}0\\text{ cm}$ (ngược chiều với vật)' }
      ],
      correctAnswer: 'A',
      explanation: {
        overview: 'Áp dụng công thức thấu kính mỏng và tỉ số phóng đại tuyến tính.',
        keyFormula: '\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d\'},\\quad k = -\\frac{d\'}{d}',
        stepByStep: [
          'Vị trí ảnh: $\\frac{1}{d\'} = \\frac{1}{20{,}0} - \\frac{1}{30{,}0} = \\frac{1}{60{,}0} \\implies d\' = 60{,}0\\text{ cm} > 0$ (ảnh thật).',
          'Độ phóng đại: $k = -\\frac{d\'}{d} = -\\frac{60}{30} = -2$.',
          'Chiều cao ảnh: $h\' = |k| \\cdot h = 2 \\times 2{,}0 = 4{,}0\\text{ cm}$ (ngược chiều). Chọn A.'
        ]
      }
    },

    // ================= PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI =================
    // CÂU 3 (Phần II)
    {
      id: 'q3-ac-circuit',
      type: 'true_false_cluster',
      part: 'Phần II',
      topic: 'Điện từ học & Mạch điện xoay chiều',
      level: 'VD',
      title: 'Câu 3: Phân tích hiện tượng cộng hưởng trong mạch điện xoay chiều RLC nối tiếp',
      points: 1.0,
      stem: 'Đặt điện áp xoay chiều $u = 120\\sqrt{2}\\cos(100\\pi t)\\text{ V}$ vào hai đầu đoạn mạch gồm điện trở thuần $R = 40\\,\\Omega$, cuộn cảm thuần có độ tự cảm $L = \\frac{0{,}8}{\\pi}\\text{ H}$ và một tụ điện có điện dung $C$ thay đổi được mắc nối tiếp. Một vôn kế xoay chiều lí tưởng được mắc vào hai đầu tụ điện $C$ như sơ đồ hình vẽ bên dưới.',
      diagram: {
        type: 'svg',
        caption: 'Hình 3: Sơ đồ mạch điện xoay chiều RLC mắc nối tiếp với tụ điện C thay đổi được',
        content: `<svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <rect width="680" height="280" fill="#ffffff" rx="12"/>
  <rect width="660" height="260" x="10" y="10" fill="#f8fafc" rx="8" stroke="#e2e8f0" stroke-width="1.5"/>
  <rect x="90" y="50" width="500" height="150" fill="none" stroke="#334155" stroke-width="3" rx="4"/>
  <g transform="translate(90, 125)">
    <rect x="-16" y="-30" width="32" height="60" fill="#f8fafc"/>
    <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#2563eb" stroke-width="2.5"/>
    <path d="M -14 0 Q -7 -14 0 0 T 14 0" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round"/>
    <text x="-75" y="-5" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">u(t)</text>
    <text x="-80" y="14" font-family="sans-serif" font-size="10" fill="#64748b">120√2 V</text>
  </g>
  <g transform="translate(210, 50)">
    <rect x="-35" y="-12" width="70" height="24" fill="#f8fafc"/>
    <rect x="-30" y="-10" width="60" height="20" fill="#f1f5f9" stroke="#047857" stroke-width="2.5" rx="2"/>
    <text x="-24" y="30" font-family="sans-serif" font-size="13" font-weight="bold" fill="#047857">R = 40 Ω</text>
  </g>
  <g transform="translate(360, 50)">
    <rect x="-42" y="-15" width="84" height="30" fill="#f8fafc"/>
    <path d="M -36 0 A 9 12 0 0 1 -18 0 A 9 12 0 0 1 0 0 A 9 12 0 0 1 18 0 A 9 12 0 0 1 36 0" fill="none" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
    <text x="-50" y="32" font-family="sans-serif" font-size="12" font-weight="bold" fill="#d97706">L = 0,8/π H</text>
  </g>
  <g transform="translate(490, 50)">
    <rect x="-25" y="-25" width="50" height="50" fill="#f8fafc"/>
    <line x1="-8" y1="-20" x2="-8" y2="20" stroke="#7c3aed" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="8" y1="-20" x2="8" y2="20" stroke="#7c3aed" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="-16" y1="22" x2="16" y2="-22" stroke="#dc2626" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="-12" y="36" font-family="sans-serif" font-size="13" font-weight="bold" fill="#7c3aed">C</text>
  </g>
  <g transform="translate(490, 0)">
    <path d="M 445 50 L 445 100 L 465 100" fill="none" stroke="#64748b" stroke-width="2"/>
    <path d="M 535 50 L 535 100 L 515 100" fill="none" stroke="#64748b" stroke-width="2"/>
    <circle cx="445" cy="50" r="3.5" fill="#334155"/>
    <circle cx="535" cy="50" r="3.5" fill="#334155"/>
    <circle cx="490" cy="100" r="18" fill="#ffffff" stroke="#64748b" stroke-width="2"/>
    <text x="484" y="106" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a">V</text>
  </g>
  <g transform="translate(290, 200)">
    <line x1="40" y1="0" x2="-40" y2="0" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="-15" y="-10" font-family="sans-serif" font-size="12" font-weight="600" fill="#2563eb">i(t)</text>
  </g>
</svg>`
      },
      items: [
        {
          id: 'a',
          level: 'NB',
          statement: 'Cảm kháng của cuộn dây trong mạch có giá trị không đổi là $Z_L = 80\\,\\Omega$.',
          correctAnswer: true,
          explanation: 'Cảm kháng: $Z_L = \\omega L = 100\\pi \\cdot \\frac{0{,}8}{\\pi} = 80\\,\\Omega$.'
        },
        {
          id: 'b',
          level: 'TH',
          statement: 'Để trong mạch xảy ra hiện tượng cộng hưởng điện, điện dung của tụ điện phải được điều chỉnh đến giá trị $C = \\frac{1{,}25 \\times 10^{-4}}{\\pi}\\text{ F}$.',
          correctAnswer: true,
          explanation: 'Cộng hưởng điện khi $Z_C = Z_L = 80\\,\\Omega \\implies C = \\frac{1}{\\omega \\cdot 80} = \\frac{1{,}25\\times 10^{-4}}{\\pi}\\text{ F}$.'
        },
        {
          id: 'c',
          level: 'VD',
          statement: 'Khi trong mạch xảy ra cộng hưởng điện, cường độ dòng điện hiệu dụng trong mạch đạt giá trị nhỏ nhất là $I_{\\min} = 1{,}5\\text{ A}$.',
          correctAnswer: false,
          explanation: 'Khi cộng hưởng, tổng trở cực tiểu $Z = R$ nên cường độ dòng điện hiệu dụng đạt cực đại: $I_{\\max} = U/R = 120/40 = 3{,}0\\text{ A}$.'
        },
        {
          id: 'd',
          level: 'VDC',
          statement: 'Khi điều chỉnh $C$ để số chỉ vôn kế đạt giá trị cực đại thì điện áp giữa hai đầu tụ điện sớm pha hơn điện áp hai đầu mạch một góc $\\pi/2$.',
          correctAnswer: false,
          explanation: 'Điện áp $u_C$ luôn trễ pha $\\pi/2$ so với $i$, do đó luôn trễ pha hơn $u$.'
        }
      ],
      explanation: {
        overview: 'Khảo sát hiện tượng cộng hưởng điện, tính cảm kháng $Z_L$, điện dung $C_0$ để cộng hưởng và mối liên hệ pha trong mạch $RLC$.',
        keyFormula: 'Z_L = \\omega L = 80\\,\\Omega,\\quad Z_C = \\frac{1}{\\omega C},\\quad I_{\\max} = \\frac{U}{R} = 3\\text{ A}',
        stepByStep: [
          'a) $Z_L = 100\\pi \\cdot (0{,}8/\\pi) = 80\\,\\Omega$. (ĐÚNG)',
          'b) $Z_C = Z_L = 80\\,\\Omega \\implies C = \\frac{1{,}25\\times 10^{-4}}{\\pi}\\text{ F}$. (ĐÚNG)',
          'c) Khi cộng hưởng, dòng điện đạt cực đại $I = 3\\text{ A}$, không phải cực tiểu. (SAI)',
          'd) Điện áp $u_C$ trễ pha hơn $u$. (SAI)'
        ]
      }
    },

    // ================= PHẦN III: TRẢ LỜI NGẮN =================
    // CÂU 4 (Phần III)
    {
      id: 'q4-thermo-cycle',
      type: 'short_answer',
      part: 'Phần III',
      topic: 'Nhiệt học & Thuyết động học',
      level: 'VDC',
      title: 'Câu 4: Công cơ học sinh ra trong một chu trình biến đổi nhiệt động của khí lí tưởng',
      points: 0.25,
      stem: 'Một mol khí lí tưởng đơn nguyên tử thực hiện chu trình kín $1 \\to 2 \\to 3 \\to 1$ được biểu diễn trên đồ thị chỉ công $P-V$ như hình vẽ bên.\n- Trạng thái 1 có áp suất $P_1 = 3{,}0 \\times 10^5\\text{ Pa}$ và thể tích $V_1 = 10{,}0\\text{ L}$.\n- Trạng thái 2 có áp suất $P_2 = 1{,}0 \\times 10^5\\text{ Pa}$ và thể tích $V_2 = 30{,}0\\text{ L}$.\n- Quá trình $1 \\to 2$ là quá trình giãn nở đẳng nhiệt ở nhiệt độ $T_1$.\n- Quá trình $2 \\to 3$ là quá trình nén đẳng áp ở áp suất $P_2 = 1{,}0 \\times 10^5\\text{ Pa}$.\n- Quá trình $3 \\to 1$ là quá trình tăng nhiệt độ đẳng tích ở thể tích $V_1 = 10{,}0\\text{ L}$.\n\nHãy tính công cơ học toàn phần $W_{\\text{net}}$ mà khối khí sinh ra trong một chu trình kín theo đơn vị Jun (J). (Lấy $\\ln(3) \\approx 1{,}0986$, làm tròn kết quả đến hàng đơn vị nguyên gần nhất).',
      diagram: {
        type: 'svg',
        caption: 'Hình 4: Đồ thị P-V chu trình biến đổi nhiệt động kín 1 -> 2 -> 3 -> 1',
        content: `<svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
  <defs>
    <linearGradient id="cycle-fill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.1"/>
    </linearGradient>
    <marker id="cycle-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0369a1" />
    </marker>
  </defs>
  <rect width="680" height="340" fill="#ffffff" rx="10"/>
  <line x1="80" y1="280" x2="620" y2="280" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="625" y="285" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">V (L)</text>
  <line x1="80" y1="280" x2="80" y2="30" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="45" y="25" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">P (10⁵ Pa)</text>
  <line x1="180" y1="275" x2="180" y2="285" stroke="#475569" stroke-width="2"/>
  <text x="165" y="302" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">V₁ = 10</text>
  <line x1="480" y1="275" x2="480" y2="285" stroke="#475569" stroke-width="2"/>
  <text x="465" y="302" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">V₂ = 30</text>
  <line x1="75" y1="200" x2="85" y2="200" stroke="#475569" stroke-width="2"/>
  <text x="48" y="204" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">1,0</text>
  <line x1="75" y1="70" x2="85" y2="70" stroke="#475569" stroke-width="2"/>
  <text x="48" y="74" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">3,0</text>
  <line x1="80" y1="70" x2="180" y2="70" stroke="#94a3b8" stroke-dasharray="4,4"/>
  <line x1="180" y1="70" x2="180" y2="280" stroke="#94a3b8" stroke-dasharray="4,4"/>
  <line x1="80" y1="200" x2="480" y2="200" stroke="#94a3b8" stroke-dasharray="4,4"/>
  <line x1="480" y1="200" x2="480" y2="280" stroke="#94a3b8" stroke-dasharray="4,4"/>
  <path d="M 180 70 C 250 120, 350 175, 480 200 L 180 200 Z" fill="url(#cycle-fill)" stroke="none"/>
  <path d="M 180 70 C 250 120, 350 175, 480 200" fill="none" stroke="#0284c7" stroke-width="3.5"/>
  <line x1="310" y1="150" x2="335" y2="162" stroke="#0284c7" stroke-width="2" marker-end="url(#cycle-arrow)"/>
  <text x="320" y="140" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0284c7">Đẳng nhiệt (T = hằng số)</text>
  <line x1="480" y1="200" x2="180" y2="200" stroke="#059669" stroke-width="3.5"/>
  <line x1="340" y1="200" x2="300" y2="200" stroke="#059669" stroke-width="2" marker-end="url(#cycle-arrow)"/>
  <text x="310" y="222" font-family="sans-serif" font-size="12" font-weight="bold" fill="#059669">Đẳng áp (P = hằng số)</text>
  <line x1="180" y1="200" x2="180" y2="70" stroke="#dc2626" stroke-width="3.5"/>
  <line x1="180" y1="145" x2="180" y2="120" stroke="#dc2626" stroke-width="2" marker-end="url(#cycle-arrow)"/>
  <text x="100" y="140" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">Đẳng tích</text>
  <circle cx="180" cy="70" r="6" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
  <text x="185" y="60" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0284c7">(1)</text>
  <circle cx="480" cy="200" r="6" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
  <text x="490" y="195" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0284c7">(2)</text>
  <circle cx="180" cy="200" r="6" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
  <text x="190" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0284c7">(3)</text>
  <text x="240" y="175" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0369a1">W_net &gt; 0</text>
</svg>`
      },
      correctValue: 1296,
      tolerance: 0.03,
      acceptedUnits: ['J', 'Jun', 'Joules', 'joules'],
      unitHint: 'J',
      placeholder: 'ví dụ: 1296 hoặc 1296 J',
      explanation: {
        overview: 'Công toàn phần mà khí sinh ra trong một chu trình kín bằng tổng công sinh ra trong từng giai đoạn: $W_{\\text{net}} = W_{12} + W_{23} + W_{31}$.',
        keyFormula: 'W_{12} = P_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right),\\quad W_{23} = P_2(V_1 - V_2),\\quad W_{31} = 0',
        stepByStep: [
          'Bước 1: Quá trình đẳng nhiệt $1 \\to 2$: $$W_{12} = (3{,}0 \\times 10^5\\text{ Pa}) \\times (0{,}010\\text{ m}^3) \\times \\ln(3) = 3000 \\times 1{,}09861 = 3295{,}8\\text{ J}$$.',
          'Bước 2: Quá trình đẳng áp $2 \\to 3$: $$W_{23} = 1{,}0 \\times 10^5 \\times (0{,}010 - 0{,}030) = -2000\\text{ J}$$.',
          'Bước 3: Quá trình đẳng tích $3 \\to 1$: $W_{31} = 0\\text{ J}$.',
          'Bước 4: Tổng công: $$W_{\\text{net}} = 3295{,}8 - 2000 = 1295{,}8\\text{ J} \\approx 1296\\text{ J}$$.'
        ]
      }
    }
  ]
};

export const sampleExamsList: Exam[] = [
  samplePhysicsExam,
  {
    id: 'physics-ap-mechanics',
    title: 'ĐỀ THI ĐỘNG LỰC HỌC VÀ CÁC ĐỊNH LUẬT BẢO TOÀN',
    subtitle: 'Chuyên đề: Động lực học chất điểm & Trường hấp dẫn',
    gradeLevel: 'Lớp 10 - 11 (Vật lí Chuyên / Nâng cao)',
    durationMinutes: 30,
    totalPoints: 10,
    instructions: [
      'Lấy gia tốc trọng trường chuẩn $g = 9{,}80\\text{ m/s}^2$ (hoặc $10\\text{ m/s}^2$ khi có hướng dẫn cụ thể).',
      'Trình bày đầy đủ các bước lập luận, áp dụng định luật Niutơn hoặc định luật bảo toàn cơ năng.',
      'Các vectơ lực phải được chiếu chính xác lên hệ trục toạ độ Đề-các phù hợp.'
    ],
    questions: [
      {
        id: 'q-ap-1',
        type: 'multiple_choice',
        part: 'Phần I',
        topic: 'Cơ học & Động lực học',
        title: 'Câu 1: Chuyển động của vật trượt trên mặt phẳng nghiêng có ma sát',
        points: 0.25,
        stem: 'Một vật có khối lượng $m = 4{,}0\\text{ kg}$ được thả không vận tốc ban đầu từ đỉnh một mặt phẳng nghiêng có góc nghiêng $\\theta = 30^\\circ$ so với phương ngang. Hệ số ma sát trượt giữa vật và mặt phẳng nghiêng là $\\mu_k = 0{,}20$. Lấy $g = 10\\text{ m/s}^2$.\n\nGia tốc $a$ của vật khi trượt xuống dốc là:',
        diagram: {
          type: 'svg',
          caption: 'Hình: Phân tích các lực tác dụng lên vật trượt trên mặt phẳng nghiêng',
          content: `<svg viewBox="0 0 600 240" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="240" fill="#ffffff"/>
  <polygon points="80,200 480,200 480,60" fill="#f1f5f9" stroke="#334155" stroke-width="2"/>
  <text x="140" y="190" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">θ = 30°</text>
  <path d="M 120 200 A 40 40 0 0 0 115 185" fill="none" stroke="#2563eb" stroke-width="2"/>
  <g transform="translate(300, 120) rotate(-19.3)">
    <rect x="-30" y="-30" width="60" height="30" fill="#38bdf8" stroke="#0284c7" stroke-width="2"/>
    <text x="-8" y="-10" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a">m</text>
    <line x1="0" y1="-30" x2="0" y2="-75" stroke="#16a34a" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="6" y="-60" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16a34a">N</text>
    <line x1="30" y1="-15" x2="70" y2="-15" stroke="#dc2626" stroke-width="2" marker-end="url(#arrow)"/>
    <text x="75" y="-10" font-family="sans-serif" font-size="12" font-weight="bold" fill="#dc2626">f_mst</text>
  </g>
  <line x1="300" y1="120" x2="300" y2="190" stroke="#7c3aed" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="310" y="175" font-family="sans-serif" font-size="12" font-weight="bold" fill="#7c3aed">P = mg</text>
</svg>`
        },
        options: [
          { id: 'A', text: '$a = 3{,}27\\text{ m/s}^2$' },
          { id: 'B', text: '$a = 5{,}00\\text{ m/s}^2$' },
          { id: 'C', text: '$a = 1{,}73\\text{ m/s}^2$' },
          { id: 'D', text: '$a = 4{,}15\\text{ m/s}^2$' }
        ],
        correctAnswer: 'A',
        explanation: {
          overview: 'Áp dụng định luật II Niutơn dọc theo phương mặt phẳng nghiêng.',
          keyFormula: 'a = g(\\sin\\theta - \\mu_k \\cos\\theta)',
          stepByStep: [
            'Phương trình định luật II Niutơn: $mg\\sin\\theta - f_{mst} = ma$, với $f_{mst} = \\mu_k mg\\cos\\theta$.',
            'Suy ra: $a = 10(0{,}5 - 0{,}20 \\times 0{,}866) = 3{,}27\\text{ m/s}^2$.'
          ]
        }
      },
      {
        id: 'q-ap-2',
        type: 'short_answer',
        part: 'Phần III',
        topic: 'Cơ học & Động lực học',
        title: 'Câu 2: Vận tốc vũ trụ cấp II (Vận tốc thoát ly)',
        points: 0.25,
        stem: 'Tính vận tốc vũ trụ cấp II (vận tốc thoát ly khỏi trường hấp dẫn của Trái Đất $v_{\\text{esc}}$) theo đơn vị $\\text{km/s}$, biết bán kính Trái Đất $R = 6400\\text{ km}$ và gia tốc trọng trường tại mặt đất $g = 9{,}8\\text{ m/s}^2$. (Làm tròn kết quả đến 1 chữ số thập phân).',
        correctValue: 11.2,
        tolerance: 0.05,
        acceptedUnits: ['km/s', 'km s^-1', 'km/giây'],
        unitHint: 'km/s',
        placeholder: 'ví dụ: 11.2 km/s',
        explanation: {
          overview: 'Bảo toàn cơ năng trong trường hấp dẫn từ bề mặt Trái Đất ra vô cực.',
          keyFormula: 'v_{\\text{esc}} = \\sqrt{2 g R}',
          stepByStep: [
            '$$v_{\\text{esc}} = \\sqrt{2 \\times 9{,}8 \\times 6{,}4 \\times 10^6} \\approx 11199{,}9\\text{ m/s} = 11{,}2\\text{ km/s}$$.'
          ]
        }
      }
    ]
  }
];
