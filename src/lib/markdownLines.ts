import type { MarkdownLine } from '../types/finding';
export const MAX_BYTES = 200 * 1024;
export function validateText(text: string): string | null {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    return 'Use a file of 200 KB or less.';
  if (text.includes('\0'))
    return 'This looks like a binary file. Use UTF-8 Markdown or plain text.';
  return null;
}
export async function readFile(file: File): Promise<string> {
  if (!/\.(md|markdown|txt)$/i.test(file.name))
    throw new Error('Choose a .md, .markdown or .txt file.');
  if (file.size > MAX_BYTES) throw new Error('Use a file of 200 KB or less.');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(
      await file.arrayBuffer(),
    );
  } catch {
    throw new Error(
      'Unable to read UTF-8 text. Check the file encoding and try again.',
    );
  }
  const error = validateText(text);
  if (error) throw new Error(error);
  return text;
}
export function markdownLines(text: string): MarkdownLine[] {
  if (!text) return [];
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  let fence: { char: string; length: number } | null = null;
  return raw.map((text, i) => {
    const marker = text.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    let code = !!fence;
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence.char &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      )
        fence = null;
    } else if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
      fence = { char: marker[1][0], length: marker[1].length };
      code = true;
    }
    const heading =
      !code &&
      (/^ {0,3}#{1,6}\s+\S/.test(text) ||
        (!!text.trim() && /^ {0,3}(?:=+|-+)\s*$/.test(raw[i + 1] ?? '')));
    const decoration =
      /^\s*(?:[-*_]\s*){3,}$/.test(text) || /^ {0,3}(?:=+|-+)\s*$/.test(text);
    const content = text
      .trim()
      .replace(/^(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/, '');
    return {
      number: i + 1,
      text,
      content,
      code,
      heading,
      instruction:
        !code && !heading && !decoration && !!content && !/^\s*>/.test(text),
    };
  });
}
export function normalizeInstruction(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/_.-]/gu, '')
    .replace(/\.(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
