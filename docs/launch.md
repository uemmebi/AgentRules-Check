# Launch material — drafts, not published

Use only after tests pass and the repository is published. The repository link below refers to the existing remote; verify its public visibility before posting. Do not claim a deployed demo until a Pages or other static deployment succeeds. All sample instructions are fictional. No video has been recorded by this project.

## 1. Introduction

I built AgentRules Check to review a small but recurring problem: coding agent instructions that repeat themselves or leave too much to interpretation.

Paste a rules file. Review local heuristics. Keep the final judgment yours.

No model calls. No accounts. No file uploads to a server.

## 2. Screen demo

A fictional AGENTS.md, three review prompts:

- One repeated instruction
- One vague sentence
- One possible always/never conflict

AgentRules Check keeps the evidence and line references visible. “Possible conflict” means review the scope, not “the tool proved a contradiction.”

Attach a real screen recording made with the script below. Do not attach a fabricated video.

## 3. Technical mini-post: three common mistakes

Three things to review in coding agent instructions:

1. Repeating a rule in several places without an authoritative source.
2. Saying “follow best practices” without a concrete check.
3. Using always/never without specifying scope.

AgentRules Check flags simple text patterns locally. It deliberately misses semantic conflicts rather than pretending to understand every policy.

## 4. Repository and feedback

AgentRules Check is available on GitHub:
https://github.com/uemmebi/AgentRules-Check

It reviews instruction files locally for repetition, vague language and possible conflicts.

Have an example it misses or flags unnecessarily? Share a short, anonymized snippet with the expected result. Remove secrets, private paths and company details first.

If an actual user example becomes available with permission, replace the fictional example in this post and clearly label its source. Do not invent user feedback or adoption metrics.

## 18-second screen recording

Preparation: start the production preview, set browser zoom to 100%, use a 1280 × 900 viewport and hide bookmarks, notifications and unrelated tabs. Use the dark theme. Only the bundled fictional demo may appear. A screen-only recording is sufficient; no face camera is needed.

- **0–3 s:** Show the empty editor and click “Load demo example”. Caption: “Review agent instructions locally.”
- **3–6 s:** Click “Check instructions”. Scroll to the three real findings. Caption: “Repetition. Vague language. Possible conflicts.”
- **6–12 s:** Click `AGENTS.md : 13` on the possible conflict. Show the focused line and related evidence. Caption: “Heuristics need human review.”
- **12–16 s:** Close the preview and click “Download Markdown”. Show the browser's real download confirmation. Caption: “Take the checklist with you.”
- **16–18 s:** End on the “Your rules stay here” privacy panel. Caption: “No model calls. No server uploads.”

If a step fails, fix it and re-record; do not splice in a fake result. Verify that the recording contains no unrelated personal data before sharing.
