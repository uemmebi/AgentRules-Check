import { expect, test } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

let server: Server;
let directory: string;
let origin: string;
let version = 'A';
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'arc-cache-'));
  for (const label of ['A', 'B']) {
    const output = join(directory, label);
    await cp('dist', output, { recursive: true });
    const html = await readFile(join(output, 'index.html'), 'utf8');
    await writeFile(
      join(output, 'index.html'),
      html.replace('<title>', `<title>${label} — `),
    );
    execFileSync(process.execPath, ['scripts/generate-sw.mjs', output]);
  }
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url!, 'http://localhost').pathname;
    if (!pathname.startsWith('/project/') && !pathname.startsWith('/other/')) {
      response.writeHead(404).end();
      return;
    }
    const file = pathname.split('/').slice(2).join('/') || 'index.html';
    if (file.includes('..')) {
      response.writeHead(400).end();
      return;
    }
    try {
      const data = await readFile(
        join(directory, pathname.startsWith('/other/') ? 'A' : version, file),
      );
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
      };
      response.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing server port');
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(directory, { recursive: true, force: true });
});

test('subpaths, waiting update, rollback and independent installation caches', async ({
  context,
}) => {
  let page = await context.newPage();
  await page.goto(`${origin}/project/`);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page).toHaveTitle(/^A —/);
  const other = await context.newPage();
  await other.goto(`${origin}/other/`);
  await other.waitForFunction(() => !!navigator.serviceWorker.controller);
  const originalCaches = await page.evaluate(() => caches.keys());
  expect(originalCaches).toHaveLength(2);
  for (const next of ['B', 'A']) {
    version = next;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    await page.waitForFunction(
      async () => !!(await navigator.serviceWorker.getRegistration())?.waiting,
    );
    await page.reload();
    await expect(page).toHaveTitle(next === 'B' ? /^A —/ : /^B —/);
    await page.close();
    await expect
      .poll(() =>
        other.evaluate(async (scope) => {
          const registration = (
            await navigator.serviceWorker.getRegistrations()
          ).find((item) => item.scope === scope);
          return !!registration?.active && !registration.waiting;
        }, `${origin}/project/`),
      )
      .toBe(true);
    page = await context.newPage();
    await page.goto(`${origin}/project/`);
    await expect(page).toHaveTitle(new RegExp(`^${next} —`));
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle(new RegExp(`^${next} —`));
    await page.getByRole('button', { name: 'Load demo example' }).click();
    await page.getByRole('button', { name: 'Check instructions' }).click();
    await expect(page.locator('.count')).toHaveText('3 findings');
    await other.reload();
    await expect(other).toHaveTitle(/^A —/);
    await context.setOffline(false);
    expect(await page.evaluate(() => caches.keys())).toHaveLength(2);
  }
});
