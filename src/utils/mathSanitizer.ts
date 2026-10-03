/**
 * Bộ lọc và chuẩn hóa toàn diện cho công thức LaTeX, số học, lũy thừa khoa học và đơn vị Vật lí.
 * Khắc phục hoàn toàn các lỗi thường gặp:
 * - Corrupted Scientific Exponents: "..0^{X}3", "..0^{X}", ".0^{X}" -> "\cdot 10^{X}"
 * - Subscript Artifacts: "c_1 2 2 2" -> "$c_1$"
 * - Footnote / Index Artifacts on Units: "kg 4", "kg 5", "kJ 4", "J 4/kg" -> "kg", "kJ", "J/kg"
 * - Auto-wrap Bare LaTeX: "0^\circ\text{C}", "1535^\circ\text{C}", "\lambda", "\Delta", "\mu", "\Omega", "\tau_M", "\tau_N" -> "$...$"
 */

// Bản đồ chỉ số dưới Unicode
const SUB_MAP: Record<string, string> = {
  '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4',
  '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
  'ₐ': '_a', 'ₑ': '_e', 'ₕ': '_h', 'ᵢ': '_i', 'ⱼ': '_j',
  'ₖ': '_k', 'ₗ': '_l', 'ₘ': '_m', 'ₙ': '_n', 'ₒ': '_o',
  'ₚ': '_p', 'ᵣ': '_r', 'ₛ': '_s', 'ₜ': '_t', 'ᵤ': '_u',
  'ᵥ': '_v', 'ₓ': '_x'
};

// Bản đồ chỉ số trên Unicode
const SUP_MAP: Record<string, string> = {
  '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
  '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
  '⁺': '^+', '⁻': '^-'
};

export function sanitizeMathAndUnits(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let res = input;

  // 1. Chuyển đổi Unicode sub/sup
  for (const [char, rep] of Object.entries(SUB_MAP)) {
    res = res.split(char).join(rep);
  }
  for (const [char, rep] of Object.entries(SUP_MAP)) {
    res = res.split(char).join(rep);
  }

  // 2. Corrupted Scientific Exponents:
  // "3,35..0^{5}3 J 4/kg" -> "$3{,}35 \cdot 10^5\text{ J/kg}$"
  // "4,4..0^{7}3 J 4/kg" -> "$4{,}4 \cdot 10^7\text{ J/kg}$"
  // "3,473..0^{8}3" -> "$3{,}473 \cdot 10^8$"
  // Chuyển "..0^{X}3" hoặc "..0^{X}" hoặc ".0^{X}" thành "\cdot 10^{X}"
  res = res.replace(/(\d+(?:[,\.]\d+)?)\s*(?:\.{1,3}|(?<=\d)\.)0\^\{?(-?\d+)\}?(?:\s*\d+)?/g, (_m, num, exp) => {
    return `${num} \\cdot 10^{${exp}}`;
  });

  // Loại bỏ số artifact bám sau 10^{...}
  res = res.replace(/(10\^\{?-?\d+\}?)\s*[1-9]\b/g, '$1');

  // 3. Subscript Artifacts:
  // Chuẩn hóa chuỗi lặp index như "c_1 2 2 2", "c_2 2 2 2" -> "c_1", "c_2"
  res = res.replace(/\b([a-zA-Z]_[0-9a-zA-Z])(?:\s+[0-9])+\b/g, '$1');

  // 4. Footnote / Index Artifacts on Units:
  // Strip trailing stray numbers attached to units: "kg 4", "kg 5", "kJ 4", "J 4/kg" -> "kg", "kJ", "J/kg"
  res = res.replace(/\bJ\s*\d*\/kg\b/g, 'J/kg');
  res = res.replace(/\bkJ\s*\d*\/kg\b/g, 'kJ/kg');
  res = res.replace(/\bJ\s*\d*\/\(kg[·\.]K\)/g, 'J/(kg·K)');
  res = res.replace(/\b(kg|kJ|J|W|kW|Pa|kPa|atm|mol|Hz|rad|V|A|mA|T|Wb|F|H|m|cm|mm|dm|s|h|lít|lit)\s+[1-9]\b(?!\s*[\/=+\-*^0-9])/g, '$1');

  // 5. Chuẩn hóa số thập phân / số nguyên kèm \cdot 10^{X} và đơn vị thành KaTeX đẹp (chỉ ngoài khối math)
  res = wrapScientificNotation(res);

  // 6. Auto-wrap Bare LaTeX:
  // Xử lý các phân đoạn văn bản trần chưa nằm trong $...$
  res = wrapBareLatex(res);

  // 7. Thay thế các đơn vị thông dụng ngoài khối math
  res = replaceCommonUnits(res);

  return res.trim();
}

/**
 * Bọc số thập phân / nguyên kèm \cdot 10^{X} trong $...$
 */
function wrapScientificNotation(text: string): string {
  if (!text) return '';
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processScientificInSegment(text.slice(lastIndex, match.index)));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(processScientificInSegment(text.slice(lastIndex)));
  }

  return parts.join('');
}

function processScientificInSegment(seg: string): string {
  let s = seg;
  // Số thập phân kèm \cdot 10^{X}
  s = s.replace(/(\b\d+),(\d+)\s*\\cdot\s*10\^\{?(-?\d+)\}?(?:\s*(J\/kg|kJ\/kg|J\/\(kg[·\.]K\)|m\/s\^2|m\/s|kg|s|J|kJ|W|kW|Pa|kPa|atm|K|mol|Hz|rad|rad\/s|V|A|mA|T|Wb|F|H|m|cm|mm|dm|lit|lít))?/g,
    (_m, intPart, decPart, exp, unit) => {
      if (unit) {
        return `$${intPart}{,}${decPart} \\cdot 10^{${exp}}\\text{ ${unit}}$`;
      }
      return `$${intPart}{,}${decPart} \\cdot 10^{${exp}}$`;
    }
  );

  // Số nguyên kèm \cdot 10^{X}
  s = s.replace(/(\b\d+)\s*\\cdot\s*10\^\{?(-?\d+)\}?(?:\s*(J\/kg|kJ\/kg|J\/\(kg[·\.]K\)|m\/s\^2|m\/s|kg|s|J|kJ|W|kW|Pa|kPa|atm|K|mol|Hz|rad|rad\/s|V|A|mA|T|Wb|F|H|m|cm|mm|dm|lit|lít))?/g,
    (_m, intPart, exp, unit) => {
      if (unit) {
        return `$${intPart} \\cdot 10^{${exp}}\\text{ ${unit}}$`;
      }
      return `$${intPart} \\cdot 10^{${exp}}$`;
    }
  );

  return s;
}

/**
 * Tự động bọc các lệnh LaTeX trần trụi chưa được bao bởi $...$
 */
function wrapBareLatex(text: string): string {
  if (!text) return '';

  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processBareText(text.slice(lastIndex, match.index)));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(processBareText(text.slice(lastIndex)));
  }

  return parts.join('');
}

function processBareText(bare: string): string {
  if (!bare) return '';
  let s = bare;

  // 1. Dạng nhiệt độ: 0^\circ\text{C}, 1535^\circ\text{C}, 0^\circ C, 25^\circ C
  s = s.replace(/(-?\d+)\s*\^\\circ(?:\\text\{C\}|C|\s*C)?/g, (_m, num) => `$${num}^\\circ\\text{C}$`);

  // 2. Dạng góc độ: 60^\circ, 90^\circ, 45^\circ
  s = s.replace(/(\d+)\s*\^\\circ\b/g, (_m, num) => `$${num}^\\circ$`);

  // 3. Các ký hiệu Hy Lạp và lệnh toán cơ bản khi đứng trần:
  // \lambda, \Delta, \mu, \Omega, \tau_M, \tau_N, \alpha, \beta, \gamma, \varphi, \theta, \rho, \epsilon, \sigma, \omega, \nu, \pi
  const bareGreekRegex = /\\(lambda|Delta|mu|Omega|tau_M|tau_N|tau|alpha|beta|gamma|varphi|phi|theta|rho|epsilon|sigma|omega|nu|pi|Phi|Psi|Sigma|Theta|Gamma)(?:_([a-zA-Z0-9]+))?(?:\^([a-zA-Z0-9]+))?/g;
  s = s.replace(bareGreekRegex, (fullMatch) => `$${fullMatch}$`);

  // 4. Ký hiệu c_1, c_2, v_0, t_1, R_1, R_2, L_1, C_1
  s = s.replace(/\b([a-zA-Z])_([0-9a-zA-Z]+)\b/g, (_m, p1, p2) => `$${p1}_${p2}$`);

  // 5. Phân số \frac{...}{...} hoặc căn bậc hai \sqrt{...}
  s = s.replace(/\\(frac\{[^{}]+\}\{[^{}]+\}|sqrt\{[^{}]+\})/g, (full) => `$${full}$`);

  // 6. Ký hiệu delta và tau tiếng Việt: "ΔT", "Δt", "ΔU", "Δp", "τ_M", "τ_N"
  s = s.replace(/\bτ_M\b/g, '$\\tau_M$');
  s = s.replace(/\bτ_N\b/g, '$\\tau_N$');
  s = s.replace(/\bΔT\b/g, '$\\Delta T$');
  s = s.replace(/\bΔt\b/g, '$\\Delta t$');
  s = s.replace(/\bΔU\b/g, '$\\Delta U$');
  s = s.replace(/\bΔp\b/g, '$\\Delta p$');

  return s;
}

/**
 * Thay thế các đơn vị thông dụng kèm số ngoài khối math
 */
function replaceCommonUnits(text: string): string {
  if (!text) return '';
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processUnitsInSegment(text.slice(lastIndex, match.index)));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(processUnitsInSegment(text.slice(lastIndex)));
  }

  return parts.join('');
}

function processUnitsInSegment(seg: string): string {
  if (!seg) return '';
  let s = seg;
  // Số thập phân kèm đơn vị
  s = s.replace(/\b(\d+),(\d+)\s*(m\/s\^2|m\/s|kg|s|J\/kg|kJ\/kg|J|kJ|W|kW|Pa|kPa|atm|K|mol|Hz|rad\/s|rad|V|A|mA|T|Wb|F|H|cm|mm|dm|lit|lít)\b/g,
    (_m, p1, p2, p3) => `$${p1}{,}${p2}\\text{ ${p3}}$`);
  // Số nguyên kèm đơn vị
  s = s.replace(/\b(\d+)\s*(m\/s\^2|m\/s|kg|s|J\/kg|kJ\/kg|J|kJ|W|kW|Pa|kPa|atm|K|mol|Hz|rad\/s|rad|V|A|mA|T|Wb|F|H|cm|mm|dm|lit|lít)\b/g,
    (_m, p1, p2) => `$${p1}\\text{ ${p2}}$`);
  // Đơn vị nhiệt dung riêng: J/(kg·K)
  s = s.replace(/J\/\(kg[·\.]K\)/g, '$\\text{J/(kg}\\cdot\\text{K)}$');
  return s;
}
