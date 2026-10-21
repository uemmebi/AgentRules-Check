import { useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { RulesInput } from './components/RulesInput';
import { Findings } from './components/Findings';
import { LinePreview } from './components/LinePreview';
import { Checklist } from './components/Checklist';
import { lintRules, type Analysis } from './lib/lintRules';
import { rules } from './lib/ruleDefinitions';
import { downloadReport, markdownReport } from './lib/markdownReport';
import { validateText } from './lib/markdownLines';
import { example } from './lib/example';
import type { Document } from './types/finding';
const blank = (): Document => ({ name: 'AGENTS.md', text: '' });
export default function App() {
  const [documents, setDocuments] = useState<Document[]>([blank()]);
  const [enabled, setEnabled] = useState(rules.map((r) => r.id));
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{
    document: number;
    line: number;
  } | null>(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('arc-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const revision = useRef(0);
  const results = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('arc-theme', theme);
    } catch {
      /* Theme remains usable without storage. */
    }
  }, [theme]);
  function invalidate() {
    ++revision.current;
    setAnalysis(null);
    setPreview(null);
    setMessage('');
    setError('');
    setBusy(false);
  }
  function update(index: number, value: Document) {
    invalidate();
    setDocuments((prev) => prev.map((d, i) => (i === index ? value : d)));
  }
  async function analyze() {
    const current = ++revision.current;
    setBusy(true);
    setError('');
    setMessage('');
    setPreview(null);
    // Yield a frame so assistive technology and the UI can announce progress.
    await new Promise((resolve) => setTimeout(resolve, 30));
    try {
      if (documents.some((d) => !d.text.trim()))
        throw new Error(
          'Add text to each file, or remove the empty comparison file.',
        );
      const result = lintRules(documents, enabled);
      if (current !== revision.current) return;
      setAnalysis(result);
      setMessage(
        `Analysis complete. ${result.findings.length} findings. Possible conflicts need human review.`,
      );
      requestAnimationFrame(() => results.current?.focus());
    } catch (e) {
      if (current === revision.current)
        setError(
          e instanceof Error
            ? e.message
            : 'Analysis failed. Try again with a smaller file.',
        );
    } finally {
      if (current === revision.current) setBusy(false);
    }
  }
  async function copy() {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(markdownReport(analysis));
      setMessage('Report copied to clipboard.');
    } catch {
      setError(
        'Clipboard access is unavailable. Download the Markdown report instead.',
      );
    }
  }
  function download() {
    if (analysis) {
      try {
        downloadReport(markdownReport(analysis));
        setMessage('Markdown download requested.');
      } catch {
        setError('Could not download the report. Try copying it instead.');
      }
    }
  }
  const invalid = documents.some((d) => !!validateText(d.text));
  return (
    <>
      <a href="#workspace" className="skip-link">
        Skip to workspace
      </a>
      <div className="shell">
        <header className="site-header">
          <a className="brand" href="#">
            <span className="brand-mark" aria-hidden="true">
              ≋
            </span>
            AgentRules<span className="brand-light">Check</span>
          </a>
          <nav aria-label="Main">
            <a
              href="https://github.com/uemmebi/AgentRules-Check"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <Icon name="external" />
            </a>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☼' : '☾'}
            </button>
          </nav>
        </header>
        <main className="min-w-0">
          <section className="hero">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> Local lint for coding agent
                instructions
              </div>
              <h1>
                Clearer rules.
                <br />
                <span>Better handoffs.</span>
              </h1>
              <p>
                Find repeated instructions, vague language and possible
                conflicts
                <br className="desktop-break" /> in your agent rule files.
                Before they become the next problem.
              </p>
            </div>
            <div className="hero-note">
              <span className="mono">01 / REVIEW YOUR RULES</span>
              <p>
                AGENTS.md
                <br />
                CLAUDE.md
                <br />
                copilot-instructions.md
              </p>
              <span className="local-badge">● Runs in your browser</span>
            </div>
          </section>
          <section
            id="workspace"
            aria-labelledby="workspace-title"
            className="workspace"
          >
            <div className="workspace-heading">
              <div>
                <h2 id="workspace-title">Your instruction files</h2>
                <p>Paste text or drop a file. Compare up to two files.</p>
              </div>
              <button
                onClick={() => {
                  invalidate();
                  setDocuments([{ name: 'AGENTS.md', text: example }]);
                }}
              >
                Load demo example <Icon name="external" />
              </button>
            </div>
            <div
              className={`inputs ${documents.length === 2 ? 'two-files' : ''}`}
            >
              {documents.map((d, i) => (
                <RulesInput
                  key={i}
                  index={i}
                  value={d}
                  onChange={(value) => update(i, value)}
                />
              ))}
            </div>
            <div className="workspace-actions">
              <button
                onClick={() => {
                  invalidate();
                  setDocuments(
                    documents.length === 1
                      ? [...documents, { name: 'CLAUDE.md', text: '' }]
                      : documents.slice(0, 1),
                  );
                }}
              >
                {documents.length === 1
                  ? '+ Compare a second file'
                  : '− Remove second file'}
              </button>
              <div>
                <button
                  onClick={() => {
                    invalidate();
                    setDocuments([blank()]);
                  }}
                >
                  Clear
                </button>
                <button
                  className="primary"
                  onClick={() => void analyze()}
                  disabled={
                    busy || invalid || !documents.some((d) => d.text.trim())
                  }
                >
                  {busy ? 'Checking…' : 'Check instructions'}{' '}
                  <Icon name="right" />
                </button>
              </div>
            </div>
            <details className="rule-options">
              <summary>
                Lint rules <span>{enabled.length} enabled</span>
              </summary>
              <fieldset>
                <legend className="sr-only">Enable lint rules</legend>
                {rules.map((r) => (
                  <label key={r.id}>
                    <input
                      type="checkbox"
                      checked={enabled.includes(r.id)}
                      onChange={(e) => {
                        invalidate();
                        setEnabled((prev) =>
                          e.target.checked
                            ? [...prev, r.id]
                            : prev.filter((id) => id !== r.id),
                        );
                      }}
                    />
                    {r.label}
                  </label>
                ))}
              </fieldset>
            </details>
          </section>
          <div role="status" className="status-message">
            {message}
          </div>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <div className="review-grid">
            <section
              className="results"
              ref={results}
              tabIndex={-1}
              aria-labelledby="results-title"
            >
              <div className="section-heading">
                <div>
                  <div className="eyebrow">Analysis</div>
                  <h2 id="results-title">The details matter.</h2>
                </div>
                {analysis && (
                  <span className="count">
                    {analysis.findings.length} findings
                  </span>
                )}
              </div>
              {analysis ? (
                <>
                  <div className="metrics">
                    {Object.entries(analysis.metrics).map(([label, value]) => (
                      <div key={label}>
                        <strong>{value.toLocaleString('en')}</strong>
                        <span>
                          {label === 'duplicates' ? 'repeats' : label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="report-actions">
                    <button onClick={() => void copy()}>Copy report</button>
                    <button onClick={download}>
                      Download Markdown <Icon name="down" />
                    </button>
                  </div>
                  <p className="heuristic-note">
                    Heuristics, not a semantic verdict. Every “Possible
                    conflict” requires review.
                  </p>
                  {preview && (
                    <LinePreview
                      name={analysis.documents[preview.document].name}
                      lines={analysis.lines[preview.document]}
                      line={preview.line}
                      onClose={() => setPreview(null)}
                    />
                  )}
                  <Findings
                    findings={analysis.findings}
                    documents={analysis.documents}
                    onLine={(document, line) => setPreview({ document, line })}
                  />
                </>
              ) : (
                <div className="empty initial-empty">
                  <span className="empty-icon" aria-hidden="true">
                    ⌕
                  </span>
                  <h3>A fresh pair of eyes for your rules.</h3>
                  <p>
                    Add your instructions above, or load the fictional demo.
                    <br />
                    Your findings and line references will appear here.
                  </p>
                  <span className="mono">NO FILES UPLOADED. EVER.</span>
                </div>
              )}
            </section>
            <Checklist />
          </div>
          <section className="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">A few things to know.</h2>
            <details>
              <summary>Does this use an AI model?</summary>
              <p>
                No. It uses transparent, local text heuristics. Similar meaning
                expressed in different words may be missed. A possible conflict
                is a prompt to review scope, not a proven error.
              </p>
            </details>
            <details>
              <summary>Can I use it offline?</summary>
              <p>
                Yes, after the production app has loaded once and its offline
                assets are cached. No analysis requests leave your browser.
                Refreshing before the first cache is complete may still need a
                connection.
              </p>
            </details>
            <details>
              <summary>Will it run commands or change my files?</summary>
              <p>
                No. Files are read as UTF-8 text and displayed as text.
                Commands, HTML, scripts and URLs in your instructions are never
                executed or followed. Exports download a separate report.
              </p>
            </details>
          </section>
        </main>
        <footer>
          <span>
            AgentRules Check{' '}
            <span className="muted">/ Small rules. Clear intent.</span>
          </span>
          <span>Local by design. Human review by default.</span>
        </footer>
      </div>
    </>
  );
}
