// Builds the three full-width project cards with one shared layout: a "display" plate on
// the left carrying the real logo (taken untouched from assets/src/*.orig.svg) and a PCB
// panel on the right with name, description, tags and status.
//   assets/card-saludrd.svg, assets/card-lanjo.svg  → used directly in the README
//   scripts/drone/card-template.svg                 → Portaerius: the 3D drone is composited
//                                                     into the plate by scripts/drone/render.cjs
// Run `node scripts/build-cards.mjs`, then commit. All animations loop in 2.4 s (or 1.2 s)
// so the pre-rendered Portaerius card loops seamlessly.
import { readFileSync, writeFileSync } from "node:fs";

const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const W = 1200, H = 300, P = { x: 24, y: 24, w: 440, h: 252 }; // P: logo plate
const LOOP = 2.4;

const lanjoSrc = readFileSync("assets/src/card-lanjo.orig.svg", "utf8");
const saludSrc = readFileSync("assets/src/card-saludrd.orig.svg", "utf8");
const grab = (s, re) => { const m = s.match(re); if (!m) throw new Error(`missing ${re}`); return m[0]; };
// Lanjo: mark + wordmark (nested <svg>s with their 9 s trace animation) and their gradients.
const lanjoDefs = grab(lanjoSrc, /<linearGradient id="sm"[\s\S]*?<\/linearGradient>/) + grab(lanjoSrc, /<linearGradient id="sw"[\s\S]*?<\/linearGradient>/);
const lanjoLogo = [...lanjoSrc.matchAll(/<svg x=[\s\S]*?<\/svg>/g)].map((m) => m[0]).join("\n");
// Mi SaludRD: embedded PNG logo + the heartbeat line.
const saludLogo = grab(saludSrc, /<svg x="16"[\s\S]*?<\/svg>/);
const saludEcg = [...saludSrc.matchAll(/<path pathLength="100"[^>]*(?:\/>|[^\/]>[\s\S]*?<\/path>)/g)].map((m) => m[0]).join("\n")
  .replace('dur="2.2s"', `dur="${LOOP}s"`);

const cards = [
  {
    out: "assets/card-saludrd.svg", ref: "U2", name: "MI SALUDRD", status: "LIVE", led: "#3dff8a",
    lines: ["Digital health for the Dominican Republic:", "find doctors, book online, run a practice."],
    tags: ["Next.js", "Flutter", "Supabase", "Stripe"], foot: "mi-saludrd.com ↗",
    label: "Mi SaludRD — digital health for the Dominican Republic: find doctors, book online, run a practice. Next.js, Flutter, Supabase, Stripe. mi-saludrd.com",
    defs: `<linearGradient id="pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6f6f6"/></linearGradient>`,
    plate: `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="14" fill="url(#pl)"/>
<g transform="translate(${P.x + P.w / 2} 128) scale(1.42) translate(-132 -66)">${saludLogo}</g>
<g transform="translate(${P.x + P.w / 2} 246) scale(1.3) translate(-331 -62)">${saludEcg}</g>`,
  },
  {
    out: "assets/card-lanjo.svg", ref: "U3", name: "LANJO TECHNOLOGIES", status: "STUDIO", led: "#ffb000",
    lines: ["Dominican software studio: web and mobile", "products, from idea to production."],
    tags: ["Web", "Mobile", "SaaS"], foot: "Santiago, RD",
    label: "Lanjo Technologies — Dominican software studio: web and mobile products, from idea to production. Santiago, RD.",
    defs: `${lanjoDefs}<linearGradient id="pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1c1e"/><stop offset="1" stop-color="#0b0b0c"/></linearGradient>
<linearGradient id="sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    plate: `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="14" fill="url(#pl)"/>
<g transform="translate(${P.x + P.w / 2} ${P.y + P.h / 2}) scale(1.14) translate(-191 -74)">${lanjoLogo}</g>
<g clip-path="url(#pc)"><rect x="-160" y="0" width="110" height="${H}" fill="url(#sheen)" transform="skewX(-18)"><animate attributeName="x" values="-160;-160;640;640" keyTimes="0;.52;.72;1" dur="9s" repeatCount="indefinite"/></rect></g>`,
  },
  {
    out: "scripts/drone/card-template.svg", ref: "U4", name: "PORTAERIUS", status: "R&D", led: "#5df2c0",
    lines: ["Autonomous drone platform.", "Private R&D, in development."],
    tags: ["Python", "C++"], foot: "private repo",
    label: "Portaerius — autonomous drone platform. Private R&D, in development. Python, C++. Private repository.",
    defs: "", hole: true,
    plate: `<text x="${P.x + 16}" y="${P.y + 26}" font-family="${mono}" font-size="13" letter-spacing="1.5" fill="#ffb000">ALT HOLD · HOVER</text>
<text x="${P.x + P.w - 16}" y="${P.y + P.h - 14}" text-anchor="end" font-family="${mono}" font-size="13" letter-spacing="1.5" fill="#5df2c0">TELEMETRY LINK<animate attributeName="opacity" values="1;1;.2;.2" keyTimes="0;.5;.5;1" dur="${LOOP / 2}s" repeatCount="indefinite"/></text>`,
  },
];

for (const c of cards) {
  const X = 506, R = W - 34;
  let tx = X;
  const tags = c.tags.map((t) => {
    const w = Math.round(t.length * 10.4 + 34), x = tx; tx += w + 12;
    return `<rect x="${x}" y="204" width="${w}" height="34" rx="17" fill="#5df2c0" fill-opacity=".13" stroke="#5df2c0" stroke-opacity=".35"/><text x="${x + w / 2}" y="227" text-anchor="middle" font-family="${mono}" font-size="16" fill="#bfe9d6">${esc(t)}</text>`;
  }).join("");
  const trace = `M${X} 268H${R - 150}l10 -10H${R - 60}l10 10H${R}`;
  // The board is drawn as a path with the plate cut out (evenodd) when the plate must stay see-through.
  const board = c.hole
    ? `<path fill-rule="evenodd" fill="url(#bg)" d="M21 1H${W - 21}a20 20 0 0 1 20 20V${H - 21}a20 20 0 0 1 -20 20H21a20 20 0 0 1 -20 -20V21a20 20 0 0 1 20 -20ZM${P.x + 14} ${P.y}a14 14 0 0 0 -14 14V${P.y + P.h - 14}a14 14 0 0 0 14 14H${P.x + P.w - 14}a14 14 0 0 0 14 -14V${P.y + 14}a14 14 0 0 0 -14 -14Z"/><path fill-rule="evenodd" fill="url(#pour)" d="M1 1H${W - 1}V${H - 1}H1ZM${P.x} ${P.y}V${P.y + P.h}H${P.x + P.w}V${P.y}Z" clip-path="url(#card)"/>`
    : `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="url(#bg)"/><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="url(#pour)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(c.label)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e3a29"/><stop offset=".6" stop-color="#0a2a1d"/><stop offset="1" stop-color="#06170f"/></linearGradient>
<pattern id="pour" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H14M0 7H14" stroke="#fff" stroke-opacity=".025" stroke-width="2"/></pattern>
<clipPath id="card"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20"/></clipPath>
<clipPath id="pc"><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="14"/></clipPath>
${c.defs}
</defs>
${board}
${c.plate}
<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="14" fill="none" stroke="#b87333" stroke-width="2.5"/>
<g fill="#e3b341">${[70, 110, 150, 190, 230].map((y) => `<rect x="${P.x + P.w + 3}" y="${y - 5}" width="16" height="10" rx="2"/>`).join("")}</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="none" stroke="#b87333" stroke-width="2"/>
<g clip-path="url(#card)"><g fill="#e3b341">${[54, 92, 130, 168, 206].map((y) => `<circle cx="${W - 1}" cy="${y}" r="8"/>`).join("")}</g><g fill="#06170f">${[54, 92, 130, 168, 206].map((y) => `<circle cx="${W - 1}" cy="${y}" r="3"/>`).join("")}</g></g>
<text x="${X}" y="52" font-family="${mono}" font-size="14" letter-spacing="3" fill="#8fb3a2">${c.ref} · MODULE</text>
<text x="${R - 22}" y="52" text-anchor="end" font-family="${mono}" font-size="14" font-weight="700" letter-spacing="3" fill="${c.led}">${esc(c.status)}</text>
<circle cx="${R - 6}" cy="47" r="6" fill="${c.led}"><animate attributeName="opacity" values="1;.25;1" dur="${LOOP / 2}s" repeatCount="indefinite"/></circle>
<circle cx="${R - 6}" cy="47" r="12" fill="${c.led}" opacity=".2"><animate attributeName="opacity" values=".3;0;.3" dur="${LOOP / 2}s" repeatCount="indefinite"/></circle>
<text x="${X}" y="108" font-family="${mono}" font-size="40" font-weight="800" letter-spacing="3" fill="#ffd166">${esc(c.name)}</text>
<text font-family="${sans}" font-size="22" fill="#d7e6dc"><tspan x="${X}" y="148">${esc(c.lines[0])}</tspan><tspan x="${X}" y="178">${esc(c.lines[1])}</tspan></text>
${tags}
<text x="${R}" y="228" text-anchor="end" font-family="${mono}" font-size="16" font-weight="700" fill="#ffb000">${esc(c.foot)}</text>
<path d="${trace}" fill="none" stroke="#b87333" stroke-width="3" stroke-linejoin="round"/>
<g fill="#e9a55c"><circle cx="${X}" cy="268" r="6"/><circle cx="${R}" cy="268" r="6"/></g><g fill="#06170f"><circle cx="${X}" cy="268" r="2.5"/><circle cx="${R}" cy="268" r="2.5"/></g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${trace}" pathLength="100" stroke="#ffb000" stroke-opacity=".35" stroke-width="9" stroke-dasharray="7 93"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="${LOOP}s" repeatCount="indefinite"/></path>
<path d="${trace}" pathLength="100" stroke="#fff6d8" stroke-width="3" stroke-dasharray="7 93"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="${LOOP}s" repeatCount="indefinite"/></path></g>
</svg>
`;
  writeFileSync(c.out, svg);
  console.log(`${c.out}: ${(svg.length / 1024).toFixed(0)} kB`);
}
