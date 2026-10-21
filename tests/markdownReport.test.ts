import { expect, it } from 'vitest';
import { lintRules } from '../src/lib/lintRules';
import { markdownReport } from '../src/lib/markdownReport';
it('exports actual findings, file positions, review warning and checklist', () => {
  const report = markdownReport(
    lintRules([{ name: 'A.md', text: 'Always run tests\nNever run tests' }]),
  );
  expect(report).toContain('Possible conflict');
  expect(report).toContain('line 2');
  expect(report).toContain('Related:');
  expect(report).toContain('- [ ] **Scope:');
});
it('escapes HTML, images and hostile Markdown in names and evidence', () => {
  const report = markdownReport(
    lintRules([
      {
        name: '<img src=x>.md',
        text: '- Follow best practices <script>alert(1)</script> ![x](https://evil.test)',
      },
    ]),
  );
  expect(report).not.toContain('<script>');
  expect(report).not.toContain('<img');
  expect(report).not.toContain('![x](');
  expect(report).toContain('&lt;script&gt;');
});
it('reports a clean analysis without inventing findings', () => {
  expect(
    markdownReport(lintRules([{ name: 'A', text: '# Scope\nRun npm test.' }])),
  ).toContain('No findings');
});
