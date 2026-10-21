export type Finding = {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning';
  line: number;
  evidence: string;
  message: string;
  suggestion: string;
  document: number;
  related?: { document: number; line: number; evidence: string };
};
export type MarkdownLine = {
  number: number;
  text: string;
  content: string;
  code: boolean;
  heading: boolean;
  instruction: boolean;
};
export type Document = { name: string; text: string };
export type Context = { documents: Document[]; lines: MarkdownLine[][] };
export type Rule = {
  id: string;
  label: string;
  run: (context: Context) => Finding[];
};
