// Builds the full-width Mi SaludRD and Lanjo cards. Each keeps its own brand style (logo taken
// untouched from assets/src/*.orig.svg, brand colours, original animations); only the
// decoration is PCB: traces, vias and edge pads drawn in the brand's colours.
// (The Portaerius card is pre-rendered separately: see scripts/drone/.)
// Run `node scripts/build-cards.mjs`, then commit.
import { readFileSync, writeFileSync } from "node:fs";

const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const W = 1100, H = 300, X = 520, R = W - 44; // same 11:3 ratio as the Portaerius card

const lanjoSrc = readFileSync("assets/src/card-lanjo.orig.svg", "utf8");
const saludSrc = readFileSync("assets/src/card-saludrd.orig.svg", "utf8");
const grab = (s, re) => { const m = s.match(re); if (!m) throw new Error(`missing ${re}`); return m[0]; };
const lanjoDefs = grab(lanjoSrc, /<linearGradient id="sm"[\s\S]*?<\/linearGradient>/) + grab(lanjoSrc, /<linearGradient id="sw"[\s\S]*?<\/linearGradient>/);
const lanjoLogo = [...lanjoSrc.matchAll(/<svg x=[\s\S]*?<\/svg>/g)].map((m) => m[0]).join("\n");
const saludLogo = grab(saludSrc, /<svg x="16"[\s\S]*?<\/svg>/);
const saludEcg = [...saludSrc.matchAll(/<path pathLength="100"[^>]*(?:\/>|[^\/]>[\s\S]*?<\/path>)/g)].map((m) => m[0]).join("\n");

// PCB decoration in the given colours: a bundle of traces along the bottom, optional bundle on
// top, vias, pulses travelling along the traces and castellated pads on both edges.
const pcb = ({ trace, traceOp, via, hole, pulse, glow, top }) => {
  const paths = [];
  for (let i = 0; i < 4; i++) paths.push([`M0 ${268 + 7 * i}H${330 + 12 * i}l10 -10H${R - 4 - 96 * i}`, R - 4 - 96 * i, 258 + 7 * i]);
  if (top) for (let i = 0; i < 3; i++) paths.push([`M${X + 6 + 18 * i} ${24 + 8 * i}H${820 - 30 * i}l10 10H${900 - 30 * i}`, 900 - 30 * i, 34 + 8 * i, X + 6 + 18 * i, 24 + 8 * i]);
  const viaAt = (x, y) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${via}"/><circle cx="${x}" cy="${y}" r="2.2" fill="${hole}"/>`;
  return `<g fill="none" stroke="${trace}" stroke-opacity="${traceOp}" stroke-width="2.6" stroke-linejoin="round">${paths.map(([d]) => `<path d="${d}"/>`).join("")}</g>
${paths.map(([, x, y, x0, y0]) => viaAt(x, y) + (x0 ? viaAt(x0, y0) : "")).join("")}
<g fill="none" stroke-linecap="round" stroke-linejoin="round">${paths.map(([d], i) => `<path d="${d}" pathLength="100" stroke="${glow}" stroke-opacity=".3" stroke-width="8" stroke-dasharray="5 95"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="${(2.6 + (i % 4) * 0.5).toFixed(1)}s" begin="${(i * 0.45).toFixed(2)}s" repeatCount="indefinite"/></path><path d="${d}" pathLength="100" stroke="${pulse}" stroke-width="2.8" stroke-dasharray="5 95"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="${(2.6 + (i % 4) * 0.5).toFixed(1)}s" begin="${(i * 0.45).toFixed(2)}s" repeatCount="indefinite"/></path>`).join("")}</g>
<g clip-path="url(#card)"><g fill="${via}">${[1, W - 1].map((x) => [70, 108, 146, 184, 222].map((y) => `<circle cx="${x}" cy="${y}" r="8"/>`).join("")).join("")}</g><g fill="${hole}">${[1, W - 1].map((x) => [70, 108, 146, 184, 222].map((y) => `<circle cx="${x}" cy="${y}" r="3"/>`).join("")).join("")}</g></g>`;
};
const pills = (tags, y, fill, fillOp, text) => {
  let x = X;
  return tags.map((t) => { const w = Math.round(t.length * 9.8 + 32), x0 = x; x += w + 12; return `<rect x="${x0}" y="${y}" width="${w}" height="32" rx="16" fill="${fill}" fill-opacity="${fillOp}"/><text x="${x0 + w / 2}" y="${y + 21.500}" text-anchor="middle" font-family="${mono}" font-size="15" fill="${text}">${esc(t)}</text>`; }).join("");
};
const frame = (label, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(label)}">
<defs>${defs}<clipPath id="card"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20"/></clipPath></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="20" fill="url(#b)" stroke="url(#s)" stroke-width="2.5"/>
${body}
</svg>
`;

// ── Mi SaludRD: white / teal / navy. The heartbeat becomes a signal on a trace. ──
writeFileSync("assets/card-saludrd.svg", frame(
  "Mi SaludRD — digital health for the Dominican Republic: find doctors, book online, run a practice. Next.js, Flutter, Supabase, Stripe. mi-saludrd.com",
  `<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e6f6f6"/></linearGradient><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#3fbfbd"/><stop offset="1" stop-color="#1d4f7c"/></linearGradient>`,
  `${pcb({ trace: "#3fbfbd", traceOp: 0.55, via: "#3fbfbd", hole: "#ffffff", pulse: "#1d4f7c", glow: "#3fbfbd" })}
<g transform="translate(250 136) scale(1.72) translate(-132 -66)">${saludLogo}</g>
<g transform="translate(${X} 58) scale(1.15) translate(-250 -70)">${saludEcg}</g>
<path d="M${X + 186} 58H${R - 150}l10 10H${R - 60}" fill="none" stroke="#3fbfbd" stroke-opacity=".55" stroke-width="2.6" stroke-linejoin="round"/>
<circle cx="${R - 60}" cy="68" r="5.5" fill="#3fbfbd"/><circle cx="${R - 60}" cy="68" r="2.2" fill="#fff"/>
<circle cx="${R}" cy="34" r="6" fill="#2ea043"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
<text x="${R - 16}" y="39" text-anchor="end" font-family="${mono}" font-size="13" letter-spacing="2" fill="#1d4f7c">U2 · LIVE</text>
<text font-family="${sans}" font-size="23" fill="#1d4f7c"><tspan x="${X}" y="120">Digital health for the Dominican Republic:</tspan><tspan x="${X}" y="151">find doctors, book online, run a practice.</tspan></text>
${pills(["Next.js", "Flutter", "Supabase", "Stripe"], 174, "#3fbfbd", 0.2, "#1d4f7c")}
<text x="${R}" y="238" text-anchor="end" font-family="${mono}" font-size="16" font-weight="700" fill="#1d4f7c">mi-saludrd.com ↗</text>`));

// ── Lanjo Technologies: black / brushed silver, with its trace animation and sheen. ──
writeFileSync("assets/card-lanjo.svg", frame(
  "Lanjo Technologies — Dominican software studio: web and mobile products, from idea to production. Santiago, RD.",
  `${lanjoDefs}<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c1c1e"/><stop offset="1" stop-color="#0b0b0c"/></linearGradient><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#c9cacd"/><stop offset="1" stop-color="#5b5d62"/></linearGradient>
<linearGradient id="sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  `${pcb({ trace: "#8e9095", traceOp: 0.5, via: "#c9cacd", hole: "#0b0b0c", pulse: "#ffffff", glow: "#c9cacd", top: true })}
<g transform="translate(256 138) scale(1.3) translate(-191 -74)">${lanjoLogo}</g>
<g clip-path="url(#card)"><rect x="-160" y="0" width="130" height="${H}" fill="url(#sheen)" transform="skewX(-18)"><animate attributeName="x" values="-160;-160;1300;1300" keyTimes="0;.52;.72;1" dur="9s" repeatCount="indefinite"/></rect></g>
<circle cx="${R}" cy="34" r="6" fill="#e4e5e7"><animate attributeName="opacity" values="1;.25;1" dur="2.2s" repeatCount="indefinite"/></circle>
<text x="${R - 16}" y="39" text-anchor="end" font-family="${mono}" font-size="13" letter-spacing="2" fill="#8e9095">U3</text>
<text font-family="${sans}" font-size="23" fill="#b9babd"><tspan x="${X}" y="118">Dominican software studio: web and mobile</tspan><tspan x="${X}" y="149">products, from idea to production.</tspan></text>
${pills(["Web", "Mobile", "SaaS"], 180, "#ffffff", 0.08, "#e4e5e7")}
<text x="${R}" y="202" text-anchor="end" font-family="${mono}" font-size="16" fill="#8e9095">Santiago, RD</text>`));
console.log("assets/card-saludrd.svg, assets/card-lanjo.svg written");
