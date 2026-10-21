import type { Context, Finding, Rule } from '../types/finding';
import { normalizeInstruction } from './markdownLines';
function finding(
  ruleId: string,
  document: number,
  line: number,
  evidence: string,
  message: string,
  suggestion: string,
  severity: Finding['severity'] = 'warning',
): Finding {
  return {
    id: `${ruleId}-${document}-${line}`,
    ruleId,
    document,
    line,
    evidence,
    message,
    suggestion,
    severity,
  };
}
const entries = (c: Context) =>
  c.lines.flatMap((lines, document) =>
    lines.filter((l) => l.instruction).map((l) => ({ ...l, document })),
  );
export const rules: Rule[] = [
  {
    id: 'duplicates',
    label: 'Repeated instructions',
    run(c) {
      const seen = new Map<string, ReturnType<typeof entries>[number]>();
      return entries(c).flatMap((l) => {
        const key = normalizeInstruction(l.content);
        if (key.length < 12) return [];
        const first = seen.get(key);
        if (!first) {
          seen.set(key, l);
          return [];
        }
        return [
          {
            ...finding(
              'duplicates',
              l.document,
              l.number,
              l.text,
              'Repeated instruction',
              'Keep one authoritative instruction, or state why both scopes need it.',
            ),
            related: {
              document: first.document,
              line: first.number,
              evidence: first.text,
            },
          },
        ];
      });
    },
  },
  {
    id: 'vague',
    label: 'Vague language',
    run: (c) =>
      entries(c)
        .filter((l) =>
          /\b(?:as needed|when appropriate|best practices|clean code|be careful|properly|reasonable|try to)\b/i.test(
            l.content,
          ),
        )
        .map((l) =>
          finding(
            'vague',
            l.document,
            l.number,
            l.text,
            'Make this instruction measurable',
            'Replace vague wording with a condition, a specific action and a way to check the result.',
            'info',
          ),
        ),
  },
  {
    id: 'headings',
    label: 'Missing headings',
    run: (c) =>
      c.lines.flatMap((lines, document) => {
        const first = lines.find((l) => l.instruction);
        return first && !lines.some((l) => l.heading)
          ? [
              finding(
                'headings',
                document,
                first.number,
                first.text,
                'No section headings',
                'Group instructions under headings such as Scope, Conventions and Validation.',
                'info',
              ),
            ]
          : [];
      }),
  },
  {
    id: 'conflicts',
    label: 'Possible always / never conflicts',
    run(c) {
      // Only exact remaining targets match. Paths, qualifiers and order are preserved.
      const seen = new Map<
        string,
        Partial<Record<'always' | 'never', ReturnType<typeof entries>[number]>>
      >();
      const result: Finding[] = [];
      for (const l of entries(c)) {
        const match = l.content.match(/^(?:please\s+)?(always|never)\s+(.+)$/i);
        if (!match) continue;
        const polarity = match[1].toLowerCase() as 'always' | 'never';
        const target = match[2]
          .normalize('NFKC')
          .toLowerCase()
          .replace(/[.!?]+$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        const pair = seen.get(target) ?? {};
        const prior = pair[polarity === 'always' ? 'never' : 'always'];
        if (prior)
          result.push({
            ...finding(
              'conflicts',
              l.document,
              l.number,
              l.text,
              'Possible conflict — review required',
              'Check whether these rules share the same scope. Clarify the condition or choose one policy; this heuristic does not prove a contradiction.',
            ),
            related: {
              document: prior.document,
              line: prior.number,
              evidence: prior.text,
            },
          });
        pair[polarity] ??= l;
        seen.set(target, pair);
      }
      return result;
    },
  },
  {
    id: 'length',
    label: 'Long documents',
    run: (c) =>
      c.lines.flatMap((lines, document) => {
        const first = lines.find((l) => l.text.trim());
        return first && c.documents[document].text.length > 12000
          ? [
              finding(
                'length',
                document,
                first.number,
                first.text,
                'Long instruction file',
                'Review whether sections can move to scoped files. Length alone does not indicate poor instructions.',
                'info',
              ),
            ]
          : [];
      }),
  },
];
