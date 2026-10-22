import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = new URL(process.env.DEPLOYMENT_URL);
assert.equal(base.protocol, 'https:', 'Public deployment must use HTTPS');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const evidence = {
  url: base.href,
  checkedAt: new Date().toISOString(),
  responses: [],
  warnings: [],
};
async function inspect(path, mime) {
  const response = await fetch(new URL(path, base), {
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  });
  const headers = Object.fromEntries(response.headers);
  evidence.responses.push({
    url: response.url,
    status: response.status,
    headers,
  });
  assert.equal(response.status, 200, `${path}: expected HTTP 200`);
  assert.equal(
    new URL(response.url).origin,
    base.origin,
    'Unexpected redirect origin',
  );
  assert.match(
    headers['content-type'] || '',
    mime,
    `${path}: incorrect MIME type`,
  );
  return { body: await response.text(), headers };
}
try {
  const html = await inspect('./', /text\/html/i);
  assert.match(
    html.body,
    /http-equiv="Content-Security-Policy"/i,
    'Missing embedded CSP',
  );
  const worker = await inspect('sw.js', /(?:javascript|ecmascript)/i);
  assert.match(
    worker.body,
    /agent-rules-check-scope-/,
    'Unexpected service worker',
  );
  const resources = [
    ...html.body.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg))"/g),
  ].map((match) => match[1]);
  assert(
    resources.some((path) => path.endsWith('.js')),
    'Missing script bundle',
  );
  for (const path of resources) {
    assert.equal(
      new URL(path, base).origin,
      base.origin,
      'Unexpected external asset',
    );
    await inspect(
      path,
      path.endsWith('.js')
        ? /javascript/i
        : path.endsWith('.css')
          ? /text\/css/i
          : /image\/svg\+xml/i,
    );
  }
  const required = {
    'x-content-type-options': /^nosniff$/i,
    'referrer-policy': /^no-referrer$/i,
    'content-security-policy': /frame-ancestors\s+'none'/i,
  };
  for (const [name, expected] of Object.entries(required)) {
    if (!expected.test(html.headers[name] || ''))
      evidence.warnings.push(`Missing or incomplete response header: ${name}`);
  }
  if (
    !/no-cache|no-store|max-age=0/i.test(worker.headers['cache-control'] || '')
  )
    evidence.warnings.push('sw.js does not advertise immediate revalidation');
  if (process.env.REQUIRE_SECURITY_HEADERS === '1')
    assert.equal(evidence.warnings.length, 0, evidence.warnings.join('; '));
  for (const warning of evidence.warnings) console.warn(warning);
} finally {
  await writeFile(
    'deployment-check.json',
    JSON.stringify(evidence, null, 2) + '\n',
  );
}
