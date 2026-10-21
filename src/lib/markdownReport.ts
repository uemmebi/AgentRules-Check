import type { Analysis } from './lintRules';
import { checklist } from './lintRules';
// HTML and Markdown control characters are escaped; exported evidence stays inert text.
export function escapeMarkdown(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_[\]{}()#+.!|~-])/g, '\\$1')
    .replace(/\r?\n/g, ' ');
}
export function markdownReport(a: Analysis): string {
  const e = escapeMarkdown;
  return [
    '# AgentRules Check report',
    '',
    'Local heuristic analysis. Possible conflicts require human review; this report does not prove semantic contradictions.',
    '',
    `Files: ${a.documents.map((d) => e(d.name)).join(', ')}`,
    '',
    `Characters: ${a.metrics.characters} · Lines: ${a.metrics.lines} · Sections: ${a.metrics.sections} · Repeated instructions: ${a.metrics.duplicates}`,
    '',
    '## Findings',
    '',
    ...(a.findings.length
      ? a.findings.flatMap((f) => [
          `### ${e(f.message)} (${f.severity})`,
          `${e(a.documents[f.document].name)} — line ${f.line}`,
          `> ${e(f.evidence)}`,
          ...(f.related
            ? [
                `Related: ${e(a.documents[f.related.document].name)} — line ${f.related.line}`,
                `> ${e(f.related.evidence)}`,
              ]
            : []),
          e(f.suggestion),
          '',
        ])
      : ['No findings from the enabled rules.', '']),
    '## Review checklist',
    '',
    ...checklist.map((c) => `- [ ] **${c.title}:** ${c.text}`),
    '',
  ].join('\n');
}
export function downloadReport(report: string) {
  const url = URL.createObjectURL(
    new Blob([report], { type: 'text/markdown;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'agent-rules-check-report.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
