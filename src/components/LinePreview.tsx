import { useEffect, useRef } from 'react';
import type { MarkdownLine } from '../types/finding';
export function LinePreview({
  lines,
  line,
  name,
  onClose,
}: {
  lines: MarkdownLine[];
  line: number;
  name: string;
  onClose: () => void;
}) {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    target.current?.focus();
  }, [line, name]);
  return (
    <section className="line-preview" aria-label="Source context">
      <div className="panel-top">
        <h3>{name} · source context</h3>
        <button onClick={onClose}>Close preview</button>
      </div>
      <div
        ref={target}
        tabIndex={-1}
        aria-label={`Line ${line}`}
        className="source-lines"
      >
        {lines.slice(Math.max(0, line - 3), line + 2).map((l) => (
          <div
            key={l.number}
            className={l.number === line ? 'selected-line' : ''}
          >
            <span className="line-number">{l.number}</span>
            <code>{l.text || ' '}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
