const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer(async (req, res) => {
  try {
    const name = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + path.sep)) throw Error('Outside workspace');
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  const context = await browser.newContext({ timezoneId: 'Asia/Manila' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  page.setDefaultTimeout(5000);
  const shots = await fs.mkdtemp(path.join(os.tmpdir(), 'lechon-responsive-'));
  const url = `http://127.0.0.1:${server.address().port}`;
  const nav = name => page.locator('nav').getByRole('button', { name, exact: true }).click();
  let checks = 0;
  const check = (name, value) => { assert.ok(value, name); console.log('PASS ' + name); checks++; };
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const shot = name => page.screenshot({ path: path.join(shots, name + '.png'), fullPage: true });
  try {
    for (const width of [320, 360, 390, 430, 600, 768, 900, 1280]) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(url);
      if (await page.locator('#lu').count()) {
        check(`login fits ${width}px`, await fits());
        if (width === 320) await shot('phone-login');
        await page.getByRole('button', { name: 'Login', exact: true }).click();
      }
      await nav('Dashboard');
      check(`dashboard fits ${width}px`, await fits());
      if (width === 320) {
        await shot('phone-dashboard');
        check('dashboard uses two columns on phones', await page.locator('.dashboard-stats').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length === 2));
      }
      if (width === 1280) {
        check('desktop sidebar and spacing preserved', await page.locator('aside').evaluate(e => getComputedStyle(e).width === '230px') && await page.locator('.body').evaluate(e => getComputedStyle(e).padding === '24px 28px'));
      }
      for (const screen of ['Orders', 'Add Order', 'Customers', 'Order History', 'Reports', 'Settings']) {
        await nav(screen);
        check(`${screen} fits ${width}px`, await fits());
        if (width <= 600) {
          check(`${screen} inputs avoid mobile zoom at ${width}px`, await page.locator('.body .in').evaluateAll(inputs => inputs.every(e => parseFloat(getComputedStyle(e).fontSize) >= 16)));
        }
        if (width === 320 && screen === 'Add Order') {
          await shot('phone-add-order');
          check('phone navigation stays in a horizontal row', await page.locator('nav').evaluate(e => getComputedStyle(e).display === 'flex') && await page.locator('aside').evaluate(e => e.clientHeight < 80));
        }
        if (width === 320 && screen === 'Reports') {
          await page.locator('#rd').fill('2026-09-25');
          await page.getByRole('tab', { name: 'Order Summary' }).click();
          check('selected report tab stays visible on phone', await page.getByRole('tab', { name: 'Order Summary' }).evaluate(e => { const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(); return r.left>=p.left-1 && r.right<=p.right+1; }));
          await shot('phone-reports');
        }
      }
      await nav('Orders');
      if (width <= 600) check(`tables scroll within their container at ${width}px`, await page.locator('.tw').evaluate(e => e.scrollWidth > e.clientWidth && getComputedStyle(e).overflowX === 'auto' && e.tabIndex === 0));
      await page.locator('tbody tr.ck').filter({ hasText: '#004' }).getByRole('button', { name: 'View' }).click();
      check(`order details fit ${width}px`, await fits());
      await nav('Customers'); await page.locator('tbody tr.ck').first().getByRole('button', { name: 'View' }).click();
      check(`customer details fit ${width}px`, await fits());
      await page.getByRole('button', { name: 'Edit Customer', exact: true }).click();
      check(`dialog fits ${width}px`, await page.locator('.md').evaluate(e => { const r=e.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1; }));
      if (width === 320) await shot('phone-dialog');
      await page.locator('#mod').getByRole('button', { name: 'Cancel', exact: true }).click();
    }
    check('no browser errors across responsive layouts', errors.length === 0);
    console.log(`All ${checks} responsive checks passed. Screenshots: ${shots}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
