import { useState } from 'react';
import type { Finding, Document } from '../types/finding';
type Props = {
  findings: Finding[];
  documents: Document[];
  onLine: (document: number, line: number) => void;
};
export function Findings({ findings, documents, onLine }: Props) {
  const [visible, setVisible] = useState(30);
  return (
    <div className="findings-list">
      {findings.length === 0 ? (
        <div className="empty">
          <span className="success-mark" aria-hidden="true">
            ✓
          </span>
          <h3>No findings from the enabled rules</h3>
          <p>
            Use the checklist to review scope and meaning. A clean result is not
            a guarantee of consistent instructions.
          </p>
        </div>
      ) : (
        findings.slice(0, visible).map((f) => (
          <article className="finding" key={f.id}>
            <div className="finding-title">
              <span className={`severity ${f.severity}`}>{f.severity}</span>
              <h3>{f.message}</h3>
            </div>
            <button
              className="line-link"
              onClick={() => onLine(f.document, f.line)}
            >
              {documents[f.document].name} : {f.line}
            </button>
            <pre>{f.evidence}</pre>
            {f.related && (
              <div className="related">
                <span>Compare with </span>
                <button
                  className="line-link"
                  onClick={() => onLine(f.related!.document, f.related!.line)}
                >
                  {documents[f.related.document].name} : {f.related.line}
                </button>
                <pre>{f.related.evidence}</pre>
              </div>
            )}
            <p className="suggestion">{f.suggestion}</p>
          </article>
        ))
      )}
      {findings.length > visible && (
        <button className="load-more" onClick={() => setVisible((n) => n + 30)}>
          Show next findings ({findings.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
