// Pre-renders the Portaerius card (three.js cannot run inside a GitHub README).
// Needs dev tools that are NOT in this repo:  npm i playwright three  (+ a Chromium), Pillow for the last step.
//   node scripts/drone/render.cjs <framesDir> [chromiumExecutable]
//   python scripts/drone/frames_to_webp.py <framesDir> assets/card-portaerius.webp
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [dir, exe] = process.argv.slice(2), N = 36;
  fs.mkdirSync(dir, { recursive: true });
  const build = path.dirname(require.resolve('three')); // node_modules/three/build
  const b = await chromium.launch({ executablePath: exe || undefined, args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1320, height: 360 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.error('pageerror', String(e)));
  // Serve the card and three's ES modules from a fake origin (module imports are blocked on file://).
  await p.route('http://card.local/**', (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const file = name === 'card.html' ? path.resolve(__dirname, name) : path.join(build, path.basename(name));
    route.fulfill({ body: fs.readFileSync(file), contentType: name.endsWith('.html') ? 'text/html' : 'text/javascript' });
  });
  await p.goto('http://card.local/card.html');
  await p.addScriptTag({ type: 'module', content: "import * as THREE from '/three.module.js'; window.THREE = THREE;" });
  await p.waitForFunction(() => window.THREE);
  console.log('WebGL:', await p.evaluate(() => window.setup()));
  for (let i = 0; i < N; i++) {
    await p.evaluate((t) => window.frame(t), i / N);
    await p.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`), omitBackground: true });
  }
  await b.close(); console.log(`${N} frames → ${dir}`);
})().catch((e) => { console.error(e); process.exit(1); });
