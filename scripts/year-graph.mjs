// Generates a one-year contribution chart (weekly totals) as an animated SVG,
// drawn as an oscilloscope / flight-telemetry trace.
// Usage: GITHUB_TOKEN=... GH_USER=... node scripts/year-graph.mjs dist/year.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] ?? "dist/year.svg";
const user = process.env.GH_USER;
const token = process.env.GITHUB_TOKEN;
if (!user || !token) throw new Error("GH_USER and GITHUB_TOKEN are required");

const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-year-graph" },
  body: JSON.stringify({ query, variables: { login: user } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GraphQL failed: ${JSON.stringify(json.errors ?? json)}`);
const cal = json.data.user.contributionsCollection.contributionCalendar;

const weeks = cal.weeks.map((w) => ({
  date: w.contributionDays[0].date,
  n: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
}));

const W = 1200, H = 440, L = 64, R = 36, T = 104, B = 86;
const max = Math.max(1, ...weeks.map((w) => w.n));
const x = (i) => L + (i * (W - L - R)) / (weeks.length - 1);
const y = (n) => H - B - (n / max) * (H - T - B);
const pts = weeks.map((w, i) => [x(i), y(w.n)]);

// Smooth line through the points (monotone-ish cubic using horizontal control points).
let line = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
for (let i = 1; i < pts.length; i++) {
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = ((x0 + x1) / 2).toFixed(1);
  line += ` C${mx} ${y0.toFixed(1)} ${mx} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
const area = `${line} L${x(weeks.length - 1).toFixed(1)} ${H - B} L${L} ${H - B} Z`;

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let labels = "", last = -1;
weeks.forEach((w, i) => {
  const m = new Date(w.date + "T00:00:00Z").getUTCMonth();
  if (m !== last && i < weeks.length - 2) {
    if (last !== -1 || i === 0) labels += `<text x="${x(i).toFixed(1)}" y="${H - B + 22}" class="m">${months[m]}</text>`;
    last = m;
  }
});

let grid = "";
for (let g = 0; g <= 4; g++) {
  const v = Math.round((max * g) / 4), gy = y(v).toFixed(1);
  grid += `<line x1="${L}" x2="${W - R}" y1="${gy}" y2="${gy}" class="g"/><text x="${L - 10}" y="${+gy + 4}" class="a">${v}</text>`;
}

const peak = weeks.reduce((b, w, i) => (w.n > weeks[b].n ? i : b), 0);
const [px, py] = pts[peak];
const anchor = px > W - 160 ? "end" : px < 160 ? "start" : "middle";
const avg = Math.round(weeks.reduce((s, w) => s + w.n, 0) / weeks.length);
const now = weeks[weeks.length - 1].n;
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;

// Scope graticule: 12 × 4 divisions with tick marks on the centre lines.
let grat = "";
for (let i = 1; i < 12; i++) { const gx = (L + (i * (W - L - R)) / 12).toFixed(1); grat += `<line x1="${gx}" x2="${gx}" y1="${T}" y2="${H - B}" class="v"/>`; }
const DRAW = 3.2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${cal.totalContributions} contributions in the last year, shown as an oscilloscope trace of weekly totals. Peak week: ${weeks[peak].n}.">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e3a29"/><stop offset="1" stop-color="#06170f"/></linearGradient>
  <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb000" stop-opacity=".34"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></linearGradient>
  <linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="#5df2c0" stop-opacity="0"/><stop offset="1" stop-color="#5df2c0" stop-opacity=".22"/></linearGradient>
  <clipPath id="scr"><rect x="${L}" y="${T - 8}" width="${W - L - R}" height="${H - T - B + 8}"/></clipPath>
</defs>
<style>.m,.a,.r{font-family:${mono};font-size:13px;fill:#8fb3a2}.a{text-anchor:end}.g,.v{stroke:#ffb000;stroke-opacity:.16;stroke-width:1}.g{stroke-dasharray:2 6}.r{font-size:14px}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#bg)" stroke="#b87333" stroke-width="2"/>
<rect x="${L - 44}" y="${T - 22}" width="${W - L - R + 62}" height="${H - T - B + 60}" rx="10" fill="#061009" stroke="#2a3530" stroke-width="2"/>
<g fill="#e9a55c"><circle cx="22" cy="22" r="6"/><circle cx="${W - 22}" cy="22" r="6"/><circle cx="22" cy="${H - 22}" r="6"/><circle cx="${W - 22}" cy="${H - 22}" r="6"/></g>
<g fill="#06170f"><circle cx="22" cy="22" r="2.5"/><circle cx="${W - 22}" cy="22" r="2.5"/><circle cx="22" cy="${H - 22}" r="2.5"/><circle cx="${W - 22}" cy="${H - 22}" r="2.5"/></g>
<text x="${L - 44}" y="52" font-family="${mono}" font-size="22" font-weight="700" letter-spacing="3" fill="#ffd166">FLIGHT TELEMETRY</text>
<text x="${L + 226}" y="52" font-family="${mono}" font-size="13" fill="#8fb3a2">CH1 · contributions / week</text>
<circle cx="${W - R - 290}" cy="47" r="5" fill="#3dff8a"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle>
<text x="${W - R + 18}" y="52" text-anchor="end" font-family="${mono}" font-size="16" fill="#d7e6dc">${cal.totalContributions} contributions · 365 d</text>
${grat}${grid}${labels}
<g clip-path="url(#scr)">
<path d="${area}" fill="url(#ar)" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${DRAW - 0.8}s" dur="1.2s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="#ffb000" stroke-opacity=".3" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="${DRAW}s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="#ffd166" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="${DRAW}s" fill="freeze"/></path>
<rect x="${L - 90}" y="${T - 8}" width="90" height="${H - T - B + 8}" fill="url(#sw)" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${DRAW}s" dur=".4s" fill="freeze"/><animate attributeName="x" from="${L - 90}" to="${W - R}" begin="${DRAW}s" dur="5s" repeatCount="indefinite"/></rect>
</g>
<g><animateMotion path="${line}" dur="${DRAW}s" fill="freeze" rotate="auto"/><path d="M13 0L-9 -7L-4 0L-9 7Z" fill="#fff6d8" stroke="#ffb000" stroke-width="1"/><path d="M-6 0H-16" stroke="#ffb000" stroke-width="2" stroke-linecap="round"><animate attributeName="opacity" values="1;.2;1" dur=".3s" repeatCount="indefinite"/></path></g>
<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${DRAW}s" dur=".6s" fill="freeze"/>
  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="#5df2c0"/>
  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="none" stroke="#5df2c0" stroke-width="2"><animate attributeName="r" values="5;20" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/></circle>
  <text x="${px.toFixed(1)}" y="${(py - 14).toFixed(1)}" text-anchor="${anchor}" font-family="${mono}" font-size="14" font-weight="700" fill="#5df2c0">PEAK ${weeks[peak].n}</text>
</g>
<text x="46" y="${H - 18}" class="r"><tspan fill="#ffb000">MAX</tspan> ${max}/wk · <tspan fill="#ffb000">AVG</tspan> ${avg}/wk · <tspan fill="#ffb000">NOW</tspan> ${now}/wk</text>
<text x="${W - 46}" y="${H - 18}" text-anchor="end" class="r"><tspan fill="#3dff8a">●</tspan> SIGNAL LOCKED · 1 wk/div</text>
</svg>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`${out}: ${cal.totalContributions} contributions, ${weeks.length} weeks, peak ${weeks[peak].n}`);
