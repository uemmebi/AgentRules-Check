import { describe, expect, it } from 'vitest';
import { lintRules } from '../src/lib/lintRules';
const lint = (text: string) => lintRules([{ name: 'AGENTS.md', text }]);
const by = (text: string, id: string) =>
  lint(text).findings.filter((f) => f.ruleId === id);
describe('duplicate rules', () => {
  it('matches punctuation, case and whitespace differences', () => {
    const duplicates = by(
      '# Rules\n- Run   the tests, please!\n* run the tests please.',
      'duplicates',
    );
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toMatchObject({
      line: 3,
      related: { line: 2 },
      document: 0,
    });
  });
  it('compares files and preserves source identity', () => {
    const result = lintRules([
      { name: 'A.md', text: '- Run the formatter.' },
      { name: 'B.md', text: '- Run the formatter!' },
    ]);
    expect(
      result.findings.find((f) => f.ruleId === 'duplicates'),
    ).toMatchObject({ document: 1, related: { document: 0, line: 1 } });
  });
  it('preserves different path identities when normalizing punctuation', () => {
    expect(
      by('- Format src/a.b.ts.\n- Format src/ab.ts.', 'duplicates'),
    ).toEqual([]);
  });
  it('ignores fenced commands and short repeated fragments', () => {
    expect(
      by(
        '```\nRun the formatter\nRun the formatter\n```\n- OK\n- OK',
        'duplicates',
      ),
    ).toEqual([]);
  });
});
describe('possible conflicts', () => {
  it('flags exact opposite targets with review language and evidence', () => {
    const f = by('- Always run tests.\n- Never run tests!', 'conflicts');
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({
      line: 2,
      message: 'Possible conflict — review required',
      related: { line: 1, evidence: '- Always run tests.' },
    });
  });
  it.each([
    'Always run tests\nNever commit secrets',
    'Always format src/a.ts\nNever format src/b.ts',
    'Always run tests before build\nNever run tests after build',
    'Always use Foo\nAlways use Foo',
    '```\nAlways run tests\n```\nNever run tests',
    'Always edit foo-bar.ts\nNever edit foobar.ts',
  ])(
    'does not infer contradictions from different targets or scopes: %s',
    (text) => expect(by(text, 'conflicts')).toEqual([]),
  );
});
describe('structure, vague language and metrics', () => {
  it('finds vague instructions with concrete suggestions', () => {
    const f = by('- Follow best practices.', 'vague')[0];
    expect(f.line).toBe(1);
    expect(f.evidence).toBe('- Follow best practices.');
    expect(f.suggestion).toContain('condition');
  });
  it('does not flag precise instructions or vague fenced text', () => {
    expect(
      by(
        '# Rules\n- Run npm test before committing.\n```\nUse best practices\n```',
        'vague',
      ),
    ).toEqual([]);
  });
  it('finds missing headings only in nonempty instruction files', () => {
    expect(by('- Run tests.', 'headings')).toHaveLength(1);
    expect(by('', 'headings')).toEqual([]);
    expect(by('# Rules\n- Run tests.', 'headings')).toEqual([]);
  });
  it('counts characters, physical lines and sections', () => {
    expect(lint('# X\n- Test').metrics).toEqual({
      characters: 10,
      lines: 2,
      sections: 1,
      duplicates: 0,
    });
    expect(lint('').metrics.lines).toBe(0);
    expect(lint('# 😀').metrics.characters).toBe(3);
  });
  it('supports disabling every rule', () => {
    expect(
      lintRules([{ name: 'A', text: '- Follow best practices' }], []).findings,
    ).toEqual([]);
  });
  it('rejects huge inputs before analysis and excessive document counts', () => {
    expect(() => lint('a'.repeat(204801))).toThrow('200 KB');
    expect(() =>
      lintRules(Array.from({ length: 3 }, () => ({ name: 'x', text: '' }))),
    ).toThrow('two');
  });
  it('flags long documents conservatively and handles bounded worst case repetition', () => {
    expect(
      by('# Scope\n' + '- Run tests now.\n'.repeat(750), 'length'),
    ).toHaveLength(1);
    expect(by('# Scope\nRun tests.', 'length')).toEqual([]);
    const a = lint('# Scope\n' + '- Always run tests.\n'.repeat(9000));
    expect(a.metrics.duplicates).toBe(8999);
  });
  it('attaches valid evidence and positions to every finding', () => {
    const a = lint(
      '- Always run tests.\n- Never run tests.\n- Never run tests!\n- Follow best practices.',
    );
    for (const f of a.findings) {
      expect(f.id).toBeTruthy();
      expect(f.suggestion).toBeTruthy();
      expect(a.lines[f.document][f.line - 1].text).toBe(f.evidence);
    }
  });
});
