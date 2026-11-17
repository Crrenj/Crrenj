// Builds the static themed assets: assets/terminal.svg (serial monitor / firmware boot)
// and assets/divider.svg (PCB trace). Run `node scripts/build-static.mjs`, then commit.
import { writeFileSync } from "node:fs";

const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ───────────────────────── terminal ─────────────────────────
{
  const W = 760, LH = 25, X = 26, Y0 = 72, T = 20, CW = 8.43; // CW: approx. advance of a 14px monospace glyph
  const c = { dim: "#6f8f80", txt: "#cfe8da", tag: "#ffb000", ok: "#3dff8a", hi: "#5df2c0", cu: "#e9a55c" };
  // [time(s), tag, segments[[text,color]...]]
  const boot = [
    [0.6, "BOOT", [["henri-fw", c.hi], ["  reset: power-on", c.txt]]],
    [1.3, "CLK ", [["PLL locked · systick 1 kHz", c.txt]]],
    [2.0, "I2C ", [["scan → ", c.txt], ["0x45", c.cu], [" EN  ", c.ok], ["0x46", c.cu], [" FR  ", c.ok], ["0x53", c.cu], [" ES", c.ok]]],
    [2.9, "UART", [["115200 8N1 · link Paris, FR ⇄ Santiago, RD (remote)", c.txt]]],
    [3.8, "TASK", [["role = ", c.txt], ["co-founder @ Lanjo Technologies", c.hi]]],
    [4.7, "SPI ", [["flash: ", c.txt], ["mi-saludrd", c.ok], ["  lanjo-technologies", c.ok], ["  portaerius", c.ok]]],
  ];
  const tBar = 5.6, tBarEnd = 8.2, tReady = 8.6, tCmd = 9.8, cmd = "whoami --all", tOut = tCmd + cmd.length * 0.12 + 0.5;
  const pc = (t) => ((t / T) * 100).toFixed(3);
  const end = 96.5;
  let css = "", body = "", row = 0;
  const show = (name, t) => { css += `@keyframes ${name}{0%,${pc(t - 0.01)}%{opacity:0}${pc(t)}%,${end}%{opacity:1}100%{opacity:0}}.${name}{animation:${name} ${T}s linear infinite}`; };
  const stamp = (t) => `[${(t * 0.137).toFixed(3).padStart(6, " ")}]`;
  const line = (t, tag, segs, i) => {
    show(`l${i}`, t);
    const y = Y0 + row++ * LH;
    return `<text class="l${i}" x="${X}" y="${y}"><tspan fill="${c.dim}">${stamp(t)}</tspan> <tspan fill="${c.tag}">${tag}</tspan> ${segs.map(([s, col]) => `<tspan fill="${col}">${esc(s)}</tspan>`).join("")}</text>`;
  };
  boot.forEach(([t, tag, segs], i) => (body += line(t, tag, segs, i)));
  // progress bar row
  {
    show("pb", tBar);
    const y = Y0 + row++ * LH, bx = X + 15 * CW, bw = 300;
    css += `@keyframes pbc{0%,${pc(tBar)}%{transform:translateX(0)}${pc(tBarEnd)}%,100%{transform:translateX(${bw}px)}}.pbc{animation:pbc ${T}s linear infinite}`;
    css += `@keyframes pbt{0%,${pc(tBarEnd)}%{opacity:0}${pc(tBarEnd + 0.01)}%,${end}%{opacity:1}100%{opacity:0}}.pbt{animation:pbt ${T}s linear infinite}`;
    body += `<g class="pb"><text x="${X}" y="${y}"><tspan fill="${c.dim}">${stamp(tBar)}</tspan> <tspan fill="${c.tag}">LOAD</tspan></text>
<rect x="${bx}" y="${y - 11}" width="${bw}" height="11" rx="2" fill="url(#bar)"/><rect class="pbc" x="${bx}" y="${y - 13}" width="${bw + 4}" height="15" fill="#07130d"/>
<rect x="${bx}" y="${y - 11}" width="${bw}" height="11" rx="2" fill="none" stroke="#2c5a44"/>
<text class="pbt" x="${bx + bw + 12}" y="${y}" fill="${c.ok}">100% · stack loaded</text></g>`;
  }
  body += line(tReady, "SYS ", [["all systems nominal — ", c.txt], ["READY", c.ok]], 9);
  row += 0.4;
  // typed command
  {
    const y = Y0 + row++ * LH, n = cmd.length, x0 = X + 2 * CW, dx = (n * CW).toFixed(1), tEnd = tCmd + n * 0.12;
    show("cm", tCmd - 0.6);
    css += `@keyframes cc{0%,${pc(tCmd)}%{transform:translateX(0)}${pc(tEnd)}%,100%{transform:translateX(${dx}px)}}.cc{animation:cc ${T}s steps(${n},end) infinite}`;
    css += `@keyframes ck{0%,${pc(tCmd - 0.61)}%{opacity:0}${pc(tCmd - 0.6)}%,${pc(tOut)}%{opacity:1}${pc(tOut + 0.01)}%,100%{opacity:0}}.ck{animation:ck ${T}s linear infinite}`;
    body += `<g class="cm"><text x="${X}" y="${y}"><tspan fill="${c.ok}">&gt;</tspan> <tspan fill="#ffffff">${cmd}</tspan></text><g class="cc"><rect x="${x0}" y="${y - 15}" width="600" height="21" fill="#07130d"/><rect class="ck" x="${x0}" y="${y - 14}" width="8.5" height="17" fill="${c.tag}"/></g></g>`;
  }
  const outs = [
    [[["henri", "#ffffff"], [" · EN / FR / ES · Paris, France", c.txt]]],
    [[["builds end to end: database → backend → web → mobile → payments", c.txt]]],
  ];
  outs.forEach(([segs], k) => {
    show(`o${k}`, tOut + k * 0.5);
    body += `<text class="o${k}" x="${X}" y="${Y0 + row++ * LH}">${segs.map(([s, col]) => `<tspan fill="${col}">${esc(s)}</tspan>`).join("")}</text>`;
  });
  {
    const y = Y0 + row++ * LH;
    show("fp", tOut + 1.2);
    css += `@keyframes bl{0%,49%{opacity:1}50%,100%{opacity:0}}.bl{animation:bl 1s steps(1) infinite}`;
    body += `<g class="fp"><text x="${X}" y="${y}" fill="${c.ok}">&gt;</text><rect class="bl" x="${X + 2 * CW}" y="${y - 14}" width="8.5" height="17" fill="${c.tag}"/></g>`;
  }
  const H = Math.round(Y0 + row * LH + 4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Serial monitor showing a firmware boot log: henri-fw, languages EN FR ES, link Paris France to Santiago RD (remote), co-founder at Lanjo Technologies, projects mi-saludrd, lanjo-technologies, portaerius, all systems nominal.">
<defs><linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="#b87333"/><stop offset=".6" stop-color="#ffb000"/><stop offset="1" stop-color="#3dff8a"/></linearGradient>
<clipPath id="win"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12"/></clipPath></defs>
<style>text{font-family:${mono};font-size:14px;white-space:pre}${css}
@keyframes tx{0%,100%{opacity:1}50%{opacity:.15}}.tx{animation:tx .45s steps(1) infinite}.rx{animation:tx .7s steps(1) infinite}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="#07130d" stroke="#b87333" stroke-width="2"/>
<g clip-path="url(#win)">
<rect x="1" y="1" width="${W - 2}" height="38" fill="#0e3a29"/><rect x="1" y="38" width="${W - 2}" height="1.5" fill="#b87333"/>
<circle cx="24" cy="20" r="6" fill="#3dff8a"/><circle class="tx" cx="44" cy="20" r="6" fill="#ffb000"/><circle class="rx" cx="64" cy="20" r="6" fill="#ffb000"/>
<text x="${W / 2}" y="25" text-anchor="middle" fill="#d7e6dc" style="font-size:13px">serial monitor — /dev/tty.henri @ 115200</text>
<text x="${W - 22}" y="25" text-anchor="end" fill="#e9a55c" style="font-size:11px">8N1</text>
${body}
</g></svg>
`;
  writeFileSync("assets/terminal.svg", svg);
  console.log(`assets/terminal.svg: ${(svg.length / 1024).toFixed(1)} kB, ${W}x${H}`);
}

// ───────────────────────── divider ─────────────────────────
{
  const d = `M14 12H420l8 -7H560l8 7H${1200 - 14}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 24" width="100%" role="img" aria-label="">
<path d="${d}" fill="none" stroke="#b87333" stroke-width="3" stroke-linejoin="round"/>
<g fill="#e9a55c"><circle cx="14" cy="12" r="7"/><circle cx="1186" cy="12" r="7"/></g><g fill="#0b2a1d"><circle cx="14" cy="12" r="3"/><circle cx="1186" cy="12" r="3"/></g>
<g transform="translate(800 12)"><rect x="-17" y="-7" width="34" height="14" rx="2" fill="#cfd6d2"/><rect x="-9" y="-7" width="18" height="14" fill="#1b1b1b"/><text y="3.500" text-anchor="middle" font-family="${mono}" font-size="8" fill="#e8e8e8">103</text></g>
<g transform="translate(250 12)"><rect x="-7" y="-6" width="14" height="12" rx="2" fill="#3dff8a"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></rect></g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" pathLength="100" stroke="#ffb000" stroke-opacity=".35" stroke-width="9" stroke-dasharray="5 95"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="3.2s" repeatCount="indefinite"/></path>
<path d="${d}" pathLength="100" stroke="#fff6d8" stroke-width="3" stroke-dasharray="5 95"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="3.2s" repeatCount="indefinite"/></path></g>
</svg>
`;
  writeFileSync("assets/divider.svg", svg);
  console.log(`assets/divider.svg: ${svg.length} B`);
}
