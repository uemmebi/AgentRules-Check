import { useState } from 'react';
import { checklist } from '../lib/lintRules';
export function Checklist() {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <aside className="checklist">
      <div className="eyebrow">Human review</div>
      <h2>A little structure goes a long way.</h2>
      <p>
        These prompts complement the lint results. They are not automatic pass /
        fail checks.
      </p>
      {checklist.map((c) => (
        <label key={c.title} className="checklist-item">
          <input
            type="checkbox"
            checked={checked.includes(c.title)}
            onChange={(e) =>
              setChecked((prev) =>
                e.target.checked
                  ? [...prev, c.title]
                  : prev.filter((x) => x !== c.title),
              )
            }
          />
          <span>
            <strong>{c.title}</strong>
            <span>{c.text}</span>
          </span>
        </label>
      ))}
      <div className="privacy-note">
        <span aria-hidden="true">◈</span>
        <div>
          <strong>Your rules stay here.</strong>
          <p>
            No uploads, accounts or AI calls. File contents are held in memory
            and never saved by this app.
          </p>
        </div>
      </div>
    </aside>
  );
}
