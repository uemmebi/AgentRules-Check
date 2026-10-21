import { describe, expect, it } from 'vitest';
import {
  markdownLines,
  normalizeInstruction,
  validateText,
  readFile,
  MAX_BYTES,
} from '../src/lib/markdownLines';
describe('Markdown lines', () => {
  it('tracks headings and bullet instructions with physical line numbers', () => {
    const lines = markdownLines('# Scope\n\n- Run tests.');
    expect(lines[0].heading).toBe(true);
    expect(lines[2]).toMatchObject({
      number: 3,
      content: 'Run tests.',
      instruction: true,
    });
  });
  it('supports CRLF and Unicode, including setext headings', () => {
    const lines = markdownLines('Regole è\r\n===\r\n- Test café');
    expect(lines[0].heading).toBe(true);
    expect(lines[2].number).toBe(3);
    expect(lines[2].content).toBe('Test café');
  });
  it.each(['```', '~~~~'])(
    'excludes %s fenced code and fence markers',
    (marker) => {
      const lines = markdownLines(
        `${marker}sh\n- Always run tests.\n# Not a heading\n${marker}\n- Run build`,
      );
      expect(
        lines.slice(0, 4).every((l) => l.code && !l.instruction && !l.heading),
      ).toBe(true);
      expect(lines[4].instruction).toBe(true);
    },
  );
  it('does not close a longer fence with a shorter or mismatched marker', () => {
    const lines = markdownLines(
      '````\n```\n~~~\nAlways run tests\n````\nNever run tests',
    );
    expect(lines[3].code).toBe(true);
    expect(lines[5].code).toBe(false);
  });
  it('excludes unclosed fences until EOF and handles empty text', () => {
    expect(markdownLines('```\nAlways test')[1].instruction).toBe(false);
    expect(markdownLines('')).toEqual([]);
  });
  it('normalizes case and whitespace', () => {
    expect(normalizeInstruction('  RUN   tests! ')).toBe(
      normalizeInstruction('run tests'),
    );
  });
});
describe('bounded UTF-8 file input', () => {
  it('accepts valid UTF-8 and CRLF', async () => {
    const file = new File(['# Café\r\n- Test'], 'AGENTS.md');
    expect(await readFile(file)).toBe('# Café\r\n- Test');
  });
  it('rejects invalid UTF-8 and unsupported files', async () => {
    await expect(
      readFile(new File([new Uint8Array([0xff])], 'rules.md')),
    ).rejects.toThrow('UTF-8');
    await expect(readFile(new File(['text'], 'script.js'))).rejects.toThrow(
      '.md',
    );
  });
  it('rejects files and pasted text over 200 KB without truncation', async () => {
    expect(validateText('a'.repeat(MAX_BYTES))).toBe(null);
    expect(validateText('a'.repeat(MAX_BYTES + 1))).toContain('200 KB');
    expect(validateText('é'.repeat(MAX_BYTES / 2 + 1))).toContain('200 KB');
    await expect(
      readFile(new File(['a'.repeat(MAX_BYTES + 1)], 'large.md')),
    ).rejects.toThrow('200 KB');
  });
  it('rejects binary NUL but accepts ordinary markup as inert text', async () => {
    expect(validateText('abc\0')).toContain('binary');
    expect(
      await readFile(new File(['<script>alert(1)</script>'], 'rules.md')),
    ).toContain('<script>');
  });
});
