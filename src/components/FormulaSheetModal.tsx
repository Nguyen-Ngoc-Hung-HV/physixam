import React, { useState } from 'react';
import { X, Search, BookOpen, Layers } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface FormulaSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormulaCategory {
  title: string;
  items: {
    name: string;
    latex: string;
    notes?: string;
  }[];
}

const FORMULA_DATABASE: FormulaCategory[] = [
  {
    title: 'Hằng số vật lí cơ bản',
    items: [
      { name: 'Tốc độ ánh sáng trong chân không', latex: 'c \\approx 3{,}00 \\times 10^8\\text{ m/s}' },
      { name: 'Điện tích nguyên tố', latex: 'e \\approx 1{,}602 \\times 10^{-19}\\text{ C}' },
      { name: 'Gia tốc trọng trường chuẩn', latex: 'g \\approx 9{,}80\\text{ m/s}^2 \\text{ hoặc } 10\\text{ m/s}^2' },
      { name: 'Hằng số khí lí tưởng', latex: 'R \\approx 8{,}314\\text{ J/(mol}\\cdot\\text{K)}' },
      { name: 'Hằng số Boltzmann', latex: 'k_B \\approx 1{,}38 \\times 10^{-23}\\text{ J/K}' },
      { name: 'Hằng số Planck', latex: 'h \\approx 6{,}626 \\times 10^{-34}\\text{ J}\\cdot\\text{s}' },
    ]
  },
  {
    title: 'Dao động cơ & Sóng cơ học',
    items: [
      { name: 'Phương trình dao động điều hòa', latex: 'x(t) = A\\cos(\\omega t + \\varphi)', notes: 'v(t) = -\\omega A\\sin(\\omega t + \\varphi),\\quad a(t) = -\\omega^2 x' },
      { name: 'Chu kì con lắc lò xo', latex: 'T = 2\\pi \\sqrt{\\frac{m}{k}},\\quad \\omega = \\sqrt{\\frac{k}{m}}' },
      { name: 'Chu kì con lắc đơn', latex: 'T = 2\\pi \\sqrt{\\frac{l}{g}}' },
      { name: 'Tốc độ truyền sóng và bước sóng', latex: 'v = \\frac{\\lambda}{T} = \\lambda f' },
      { name: 'Độ lệch pha giữa hai điểm trên phương truyền', latex: '\\Delta\\varphi = \\frac{2\\pi \\Delta x}{\\lambda}' },
      { name: 'Điều kiện sóng dừng (Hai đầu cố định)', latex: 'L = k\\frac{\\lambda}{2}\\quad (k \\in \\mathbb{N}^*)' },
    ]
  },
  {
    title: 'Điện từ học & Mạch điện xoay chiều',
    items: [
      { name: 'Định luật Ôm cho đoạn mạch RLC nối tiếp', latex: 'I = \\frac{U}{Z},\\quad Z = \\sqrt{R^2 + (Z_L - Z_C)^2}' },
      { name: 'Công thức cảm kháng và dung kháng', latex: 'Z_L = \\omega L,\\quad Z_C = \\frac{1}{\\omega C}' },
      { name: 'Điều kiện xảy ra cộng hưởng điện', latex: '\\omega_0 = \\frac{1}{\\sqrt{LC}} \\implies Z_L = Z_C,\\quad Z = R' },
      { name: 'Công suất tiêu thụ trong mạch xoay chiều', latex: 'P = UI\\cos\\varphi = I^2 R,\\quad \\cos\\varphi = \\frac{R}{Z}' },
      { name: 'Lực từ tác dụng lên hạt mang điện (Lorentz)', latex: 'F = |q| v B \\sin\\alpha,\\quad \\vec{F} = q(\\vec{v} \\times \\vec{B})' },
      { name: 'Suất điện động cảm ứng (Định luật Faraday)', latex: 'e_c = -\\frac{\\Delta \\Phi}{\\Delta t},\\quad \\Phi = B S \\cos\\alpha' },
    ]
  },
  {
    title: 'Nhiệt học & Thuyết động học phân tử',
    items: [
      { name: 'Phương trình trạng thái khí lí tưởng (Clapeyron)', latex: 'PV = nRT = N k_B T' },
      { name: 'Nguyên lí thứ nhất của Nhiệt động lực học', latex: '\\Delta U = Q + A' },
      { name: 'Công sinh ra trong quá trình giãn khí', latex: 'A = -\\int P\\,dV\\quad (A\' = -A)' },
      { name: 'Công trong quá trình giãn đẳng nhiệt', latex: 'A\' = nRT \\ln\\left(\\frac{V_2}{V_1}\\right) = P_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right)' },
      { name: 'Nội năng của khí lí tưởng đơn nguyên tử', latex: 'U = \\frac{3}{2}nRT' },
      { name: 'Hiệu suất cực đại của động cơ nhiệt Carnot', latex: '\\eta_{\\text{Carnot}} = 1 - \\frac{T_C}{T_H} = \\frac{A\'}{Q_H}' },
    ]
  },
  {
    title: 'Quang học & Sóng ánh sáng',
    items: [
      { name: 'Định luật khúc xạ ánh sáng (Snell)', latex: 'n_1 \\sin i = n_2 \\sin r' },
      { name: 'Góc giới hạn phản xạ toàn phần', latex: '\\sin i_{gh} = \\frac{n_2}{n_1}\\quad (n_1 > n_2)' },
      { name: 'Công thức thấu kính mỏng', latex: '\\frac{1}{f} = \\frac{1}{d} + \\frac{1}{d\'}' },
      { name: 'Độ phóng đại ảnh của thấu kính', latex: 'k = -\\frac{d\'}{d} = \\frac{\\overline{A\'B\'}}{\\overline{AB}}' },
      { name: 'Khoảng vân trong giao thoa khe Young', latex: 'i = \\frac{\\lambda D}{a}' },
    ]
  }
];

export const FormulaSheetModal: React.FC<FormulaSheetModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  if (!isOpen) return null;

  const categories = ['Tất cả', ...FORMULA_DATABASE.map(c => c.title)];

  const filteredData = FORMULA_DATABASE.map(cat => {
    if (activeCategory !== 'Tất cả' && cat.title !== activeCategory) {
      return null;
    }
    const filteredItems = cat.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.latex.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filteredItems.length === 0) return null;
    return { ...cat, items: filteredItems };
  }).filter(Boolean) as FormulaCategory[];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Tiêu đề sổ tay */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Sổ tay Tra cứu Công thức & Hằng số Vật lí THPT</h2>
              <p className="text-xs text-slate-500">Hệ thống kí hiệu, đơn vị SI và các phương trình chuẩn theo chương trình GDPT môn Vật lí</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh tìm kiếm & Phân loại chủ đề */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm công thức (ví dụ: cộng hưởng, thấu kính, sóng cơ, carnot, chu kì)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vùng hiển thị danh sách công thức KaTeX */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Không tìm thấy công thức nào khớp với từ khóa tìm kiếm.</p>
            </div>
          ) : (
            filteredData.map((category, catIdx) => (
              <div key={catIdx} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {category.title}
                </div>
                <div className="divide-y divide-slate-100">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                      <div className="md:w-5/12">
                        <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-slate-500 mt-1">
                            <MathRenderer content={`$${item.notes}$`} />
                          </div>
                        )}
                      </div>
                      <div className="md:w-7/12 bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-center overflow-x-auto text-center">
                        <MathRenderer content={`$$${item.latex}$$`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chân trang */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Công thức được hiển thị sắc nét bằng chuẩn toán KaTeX.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition cursor-pointer"
          >
            Đóng sổ tay
          </button>
        </div>

      </div>
    </div>
  );
};
