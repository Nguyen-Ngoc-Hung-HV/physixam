import React, { useMemo } from 'react';
import katex from 'katex';
import { sanitizeMathAndUnits } from '../utils/mathSanitizer';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

interface TextSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  // Tiền xử lý nội dung qua bộ lọc sanitizeMathAndUnits
  const sanitizedContent = useMemo(() => {
    return sanitizeMathAndUnits(content || '');
  }, [content]);

  const segments = useMemo(() => {
    if (!sanitizedContent) return [];
    const result: TextSegment[] = [];

    // First split by display math $$...$$
    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = displayRegex.exec(sanitizedContent)) !== null) {
      if (match.index > lastIndex) {
        // Plain text before display math, which might contain inline math $...$
        parseInlineMath(sanitizedContent.slice(lastIndex, match.index), result);
      }
      result.push({
        type: 'display-math',
        content: match[1].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < sanitizedContent.length) {
      parseInlineMath(sanitizedContent.slice(lastIndex), result);
    }

    return result;
  }, [sanitizedContent]);

  function parseInlineMath(text: string, output: TextSegment[]) {
    // Regex for inline math $...$ without escaping dollars
    const inlineRegex = /\$((?:\\\$|[^$])+?)\$/g;
    let last = 0;
    let inlineMatch: RegExpExecArray | null;

    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      if (inlineMatch.index > last) {
        output.push({
          type: 'text',
          content: text.slice(last, inlineMatch.index),
        });
      }
      output.push({
        type: 'inline-math',
        content: inlineMatch[1].trim(),
      });
      last = inlineMatch.index + inlineMatch[0].length;
    }

    if (last < text.length) {
      output.push({
        type: 'text',
        content: text.slice(last),
      });
    }
  }

  const renderMath = (mathCode: string, isDisplay: boolean) => {
    try {
      const html = katex.renderToString(mathCode, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: false,
        trust: true,
      });
      return (
        <span
          className={isDisplay ? "block my-2 text-center overflow-x-auto py-1" : "inline-block align-baseline px-0.5"}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (err) {
      return (
        <code className="text-red-500 bg-red-50 px-1 py-0.5 rounded text-xs">
          {mathCode}
        </code>
      );
    }
  };

  const renderPlainText = (text: string) => {
    // Handle line breaks \n
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {line}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'display-math') {
          return <span key={idx}>{renderMath(seg.content, true)}</span>;
        } else if (seg.type === 'inline-math') {
          return <span key={idx}>{renderMath(seg.content, false)}</span>;
        } else {
          return <span key={idx}>{renderPlainText(seg.content)}</span>;
        }
      })}
    </span>
  );
};
