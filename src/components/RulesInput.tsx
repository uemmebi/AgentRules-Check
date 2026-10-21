import { useEffect, useRef, useState } from 'react';
import type { Document } from '../types/finding';
import { MAX_BYTES, readFile, validateText } from '../lib/markdownLines';
type Props = {
  index: number;
  value: Document;
  onChange: (value: Document) => void;
};
export function RulesInput({ index, value, onChange }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    ++generation.current;
    setLoading(false);
    setError('');
  }, [value]);
  const id = `rules-${index}`;
  async function importFiles(files: FileList | null) {
    const current = ++generation.current;
    setLoading(false);
    if (!files || files.length !== 1) {
      setError('Choose one file per panel.');
      return;
    }
    const file = files[0];
    setLoading(true);
    setError('');
    try {
      const text = await readFile(file);
      if (current === generation.current) onChange({ name: file.name, text });
    } catch (e) {
      if (current === generation.current)
        setError(
          e instanceof Error
            ? e.message
            : 'Unable to read this file. Try pasting the text.',
        );
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  const inputError = validateText(value.text);
  return (
    <section
      className={`input-panel ${dragging ? 'dragging' : ''}`}
      aria-label={`File ${index + 1}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void importFiles(e.dataTransfer.files);
      }}
    >
      <div className="panel-top">
        <label htmlFor={id}>
          <span className="file-icon" aria-hidden="true">
            ≡
          </span>{' '}
          File {index + 1}
        </label>
        <span className="file-name" title={value.name}>
          {value.name}
        </span>
      </div>
      <textarea
        id={id}
        value={value.text}
        spellCheck={false}
        aria-invalid={!!inputError}
        aria-describedby={`${id}-hint ${id}-error`}
        placeholder={
          '# Repository instructions\n\nPaste your rules here, or drop a Markdown file.'
        }
        onChange={(e) => {
          ++generation.current;
          setLoading(false);
          setError('');
          onChange({ ...value, text: e.target.value });
        }}
      />
      <div className="input-footer">
        <span id={`${id}-hint`}>
          UTF-8 · Markdown / text · ≤ {MAX_BYTES / 1024} KB
        </span>
        <label className="upload">
          Upload file
          <input
            type="file"
            accept=".md,.markdown,.txt"
            aria-label={`Upload file ${index + 1}`}
            disabled={loading}
            onChange={(e) => {
              void importFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <div id={`${id}-error`} role="status" className="input-message">
        {loading ? 'Reading file…' : error || inputError}
      </div>
    </section>
  );
}
