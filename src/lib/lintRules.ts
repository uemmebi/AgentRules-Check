import type { Document } from '../types/finding';
import { markdownLines, validateText } from './markdownLines';
import { rules } from './ruleDefinitions';
export function lintRules(
  documents: Document[],
  enabled = rules.map((r) => r.id),
) {
  if (documents.length > 2) throw new Error('Compare up to two files.');
  documents.forEach((d) => {
    const error = validateText(d.text);
    if (error) throw new Error(error);
  });
  const lines = documents.map((d) => markdownLines(d.text));
  const findings = rules
    .filter((r) => enabled.includes(r.id))
    .flatMap((r) => r.run({ documents, lines }));
  return {
    documents,
    lines,
    findings,
    metrics: {
      characters: documents.reduce((n, d) => n + [...d.text].length, 0),
      lines: lines.reduce((n, l) => n + l.length, 0),
      sections: lines.flat().filter((l) => l.heading).length,
      duplicates: findings.filter((f) => f.ruleId === 'duplicates').length,
    },
  };
}
export type Analysis = ReturnType<typeof lintRules>;
export const checklist = [
  {
    title: 'Structure',
    text: 'Group related instructions under descriptive headings. Keep a single source for shared rules.',
  },
  {
    title: 'Test commands',
    text: 'List the exact test and build commands, working directory and expected result. Commands are never executed here.',
  },
  {
    title: 'Conventions',
    text: 'Use observable examples for naming, formatting and review expectations.',
  },
  {
    title: 'Scope',
    text: 'State which paths each rule applies to and how local instructions take precedence.',
  },
];
