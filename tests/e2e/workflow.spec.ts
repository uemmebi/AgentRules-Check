import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
test('demo, line references, export, keyboard, themes and responsive layouts', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(
    page.getByRole('button', { name: 'Check instructions' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Load demo example' }).click();
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(
    page.getByRole('heading', { name: 'Possible conflict — review required' }),
  ).toBeVisible();
  await expect(page.locator('.count')).toHaveText('3 findings');
  await page.getByRole('button', { name: 'AGENTS.md : 13' }).click();
  await expect(
    page.getByRole('region', { name: 'Source context' }),
  ).toContainText('Never run tests before committing.');
  await expect(page.getByLabel('Line 13', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await page.getByRole('button', { name: 'Copy report', exact: true }).click();
  await expect(page.getByRole('status').last()).toContainText('Report copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'Possible conflict',
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Markdown' }).click();
  expect((await download).suggestedFilename()).toBe(
    'agent-rules-check-report.md',
  );
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await mkdir('docs/screenshots', { recursive: true });
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'docs/screenshots/desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'docs/screenshots/mobile.png',
    fullPage: true,
  });
  await page.reload();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to workspace' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'Load demo example' }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
test('real file upload, drag-drop, comparison and rule toggles', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByLabel('Upload file 1').setInputFiles({
    name: 'AGENTS.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Café\r\n- Run the formatter.\r\nAlways run tests'),
  });
  await expect(
    page.getByRole('textbox', { name: 'File 1', exact: true }),
  ).toHaveValue(/Café/);
  await page.getByRole('button', { name: 'Compare a second file' }).click();
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(
      new File(
        ['# Scope\n- Run the formatter!\nNever run tests'],
        'CLAUDE.md',
        { type: 'text/markdown' },
      ),
    );
    return data;
  });
  await page
    .getByRole('region', { name: 'File 2', exact: true })
    .dispatchEvent('drop', { dataTransfer: transfer });
  await expect(
    page.getByRole('textbox', { name: 'File 2', exact: true }),
  ).toHaveValue(/Never run tests/);
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(
    page.getByRole('heading', { name: 'Repeated instruction', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Possible conflict — review required' }),
  ).toBeVisible();
  await page.locator('.rule-options summary').click();
  await page.getByLabel('Repeated instructions', { exact: true }).uncheck();
  await expect(
    page.getByRole('button', { name: 'Download Markdown' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(
    page.getByRole('heading', { name: 'Repeated instruction', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('textbox', { name: 'File 2', exact: true }).fill('');
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(page.getByRole('alert')).toContainText('Add text to each file');
});
test('invalid input, safe literal rendering, no remote analysis and no false conflict', async ({
  page,
}) => {
  const remote: string[] = [];
  const origin = new URL(test.info().project.use.baseURL!).origin;
  page.on('request', (r) => {
    if (new URL(r.url()).origin !== origin) remote.push(r.url());
  });
  await page.goto('./');
  await page.getByLabel('Upload file 1').setInputFiles({
    name: 'large.md',
    mimeType: 'text/markdown',
    buffer: Buffer.alloc(204801, 'a'),
  });
  await expect(page.getByRole('status').first()).toContainText('200 KB');
  await page.getByLabel('Upload file 1').setInputFiles({
    name: 'bad.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from([255]),
  });
  await expect(page.getByRole('status').first()).toContainText('UTF-8');
  await page
    .getByRole('textbox', { name: 'File 1', exact: true })
    .fill(
      '# Scope\nAlways run tests\nNever commit secrets\n- Follow best practices <img src="https://evil.test/x" onerror="alert(1)">\n```\nAlways commit secrets\n```',
    );
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(
    page.getByRole('heading', { name: 'Possible conflict — review required' }),
  ).toHaveCount(0);
  await expect(page.locator('.finding pre')).toContainText('<img');
  await expect(page.locator('.finding img')).toHaveCount(0);
  expect(remote).toEqual([]);
  await page
    .getByRole('textbox', { name: 'File 1', exact: true })
    .fill('# Scope\nRun npm test.');
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(
    page.getByRole('heading', { name: 'No findings from the enabled rules' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'File 1', exact: true }),
  ).toHaveValue('');
});
test('cached production app reloads offline and analyzes without a network', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Load demo example' }).click();
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await expect(page.locator('.count')).toHaveText('3 findings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Markdown' }).click();
  expect((await download).suggestedFilename()).toBe(
    'agent-rules-check-report.md',
  );
  const cachedURLs = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const prefix =
      'agent-rules-check-scope-' + encodeURIComponent(registration.scope) + '-';
    const keys = (await caches.keys()).filter((key) => key.startsWith(prefix));
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map((request) => request.url),
        ),
      )
    ).flat();
  });
  expect(cachedURLs.length).toBeGreaterThan(2);
  for (const url of cachedURLs)
    expect(new URL(url).pathname).toMatch(
      /\/(?:index\.html|favicon\.svg|assets\/[^/]+)$/,
    );
  await context.setOffline(false);
});

test('clipboard failure has a download fallback and rejected uploads preserve text', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Load demo example' }).click();
  const original = await page
    .getByRole('textbox', { name: 'File 1', exact: true })
    .inputValue();
  await page.getByLabel('Upload file 1').setInputFiles({
    name: 'script.js',
    mimeType: 'text/javascript',
    buffer: Buffer.from('alert(1)'),
  });
  await expect(page.getByRole('status').first()).toContainText('Choose a .md');
  await expect(
    page.getByRole('textbox', { name: 'File 1', exact: true }),
  ).toHaveValue(original);
  await page.getByRole('button', { name: 'Check instructions' }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('denied')) },
    });
  });
  await page.getByRole('button', { name: 'Copy report', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Download the Markdown report instead',
  );
  await expect(
    page.getByRole('button', { name: 'Download Markdown' }),
  ).toBeEnabled();
});
