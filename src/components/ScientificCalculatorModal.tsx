import React, { useState } from 'react';
import { X, Calculator, Delete } from 'lucide-react';

interface ScientificCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificCalculatorModal: React.FC<ScientificCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [isRad, setIsRad] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  if (!isOpen) return null;

  const append = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const calculate = () => {
    try {
      if (!expression.trim()) return;

      let expr = expression;
      const degFactor = isRad ? 1 : Math.PI / 180;
      const invDegFactor = isRad ? 1 : 180 / Math.PI;

      expr = expr.replace(/π/g, `${Math.PI}`);
      expr = expr.replace(/\be\b/g, `${Math.E}`);

      expr = expr.replace(/sin\(([^)]+)\)/g, (_, arg) => `Math.sin((${arg}) * ${degFactor})`);
      expr = expr.replace(/cos\(([^)]+)\)/g, (_, arg) => `Math.cos((${arg}) * ${degFactor})`);
      expr = expr.replace(/tan\(([^)]+)\)/g, (_, arg) => `Math.tan((${arg}) * ${degFactor})`);
      expr = expr.replace(/asin\(([^)]+)\)/g, (_, arg) => `(${invDegFactor} * Math.asin(${arg}))`);
      expr = expr.replace(/acos\(([^)]+)\)/g, (_, arg) => `(${invDegFactor} * Math.acos(${arg}))`);
      expr = expr.replace(/atan\(([^)]+)\)/g, (_, arg) => `(${invDegFactor} * Math.atan(${arg}))`);

      expr = expr.replace(/\^/g, '**');

      expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
      expr = expr.replace(/ln\(/g, 'Math.log(');
      expr = expr.replace(/log\(/g, 'Math.log10(');
      expr = expr.replace(/abs\(/g, 'Math.abs(');

      if (/[^0-9+\-*/().,MathPIE\s]/.test(expr.replace(/Math\.[a-z0-9]+/g, ''))) {
        throw new Error('Kí tự không hợp lệ');
      }

      // eslint-disable-next-line no-new-func
      const calcVal = Function(`"use strict"; return (${expr})`)();
      if (typeof calcVal === 'number' && !isNaN(calcVal)) {
        const rounded = Number.isInteger(calcVal) ? calcVal.toString() : Number(calcVal.toFixed(6)).toString();
        setResult(rounded);
        setHistory((prev) => [`${expression} = ${rounded}`, ...prev.slice(0, 4)]);
      } else {
        setResult('Lỗi');
      }
    } catch (e) {
      setResult('Lỗi cú pháp');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Tiêu đề máy tính */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">Máy tính khoa học Vật lí</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRad(!isRad)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-indigo-200 font-bold transition cursor-pointer"
            >
              {isRad ? 'RAD' : 'DEG'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Màn hình hiển thị kết quả */}
        <div className="p-4 bg-slate-900 text-right space-y-1">
          <div className="text-xs text-slate-400 h-5 overflow-x-auto font-mono">
            {expression || '0'}
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-wide h-8 overflow-x-auto">
            {result ? `= ${result}` : ''}
          </div>
        </div>

        {/* Bàn phím số và hàm khoa học */}
        <div className="p-4 bg-slate-50 grid grid-cols-5 gap-2 text-sm font-semibold select-none">
          <button onClick={() => append('sin(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">sin</button>
          <button onClick={() => append('cos(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">cos</button>
          <button onClick={() => append('tan(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">tan</button>
          <button onClick={() => append('ln(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">ln</button>
          <button onClick={() => append('log(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">log</button>

          <button onClick={() => append('sqrt(')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">√</button>
          <button onClick={() => append('^')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">xʸ</button>
          <button onClick={() => append('(')} className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer">(</button>
          <button onClick={() => append(')')} className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer">)</button>
          <button onClick={handleBackspace} className="p-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition flex items-center justify-center cursor-pointer">
            <Delete className="w-4 h-4" />
          </button>

          <button onClick={() => append('π')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">π</button>
          <button onClick={() => append('7')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">7</button>
          <button onClick={() => append('8')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">8</button>
          <button onClick={() => append('9')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">9</button>
          <button onClick={() => append('/')} className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer">÷</button>

          <button onClick={() => append('e')} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer">e</button>
          <button onClick={() => append('4')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">4</button>
          <button onClick={() => append('5')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">5</button>
          <button onClick={() => append('6')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">6</button>
          <button onClick={() => append('*')} className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer">×</button>

          <button onClick={handleClear} className="p-2.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition font-bold cursor-pointer">AC</button>
          <button onClick={() => append('1')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">1</button>
          <button onClick={() => append('2')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">2</button>
          <button onClick={() => append('3')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">3</button>
          <button onClick={() => append('-')} className="p-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer">−</button>

          <button onClick={() => result && append(result)} className="p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition text-xs cursor-pointer">Ans</button>
          <button onClick={() => append('0')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">0</button>
          <button onClick={() => append('.')} className="p-2.5 rounded-lg bg-white shadow-2xs hover:bg-slate-100 text-slate-800 transition cursor-pointer">.</button>
          <button onClick={calculate} className="col-span-2 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition text-center font-bold text-base cursor-pointer">=</button>
        </div>

        {/* Lịch sử phép tính gần đây */}
        {history.length > 0 && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="truncate max-w-[280px]">Gần đây: {history[0]}</span>
            <button onClick={() => setHistory([])} className="hover:text-slate-700 cursor-pointer">Xóa</button>
          </div>
        )}
      </div>
    </div>
  );
};
