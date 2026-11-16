// Generates a one-year contribution chart (weekly totals) as an animated SVG.
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

const W = 1200, H = 420, L = 56, R = 30, T = 116, B = 52;
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
    if (last !== -1 || i === 0) labels += `<text x="${x(i).toFixed(1)}" y="${H - B + 24}" class="m">${months[m]}</text>`;
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
const scrib = `'Chalkduster','Marker Felt','Comic Sans MS','Segoe Print',cursive`;
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${cal.totalContributions} contributions in the last year">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#150726"/><stop offset="1" stop-color="#0d0a14"/></linearGradient>
  <linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="#9d4edd"/><stop offset="1" stop-color="#39ff14"/></linearGradient>
  <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39ff14" stop-opacity=".38"/><stop offset="1" stop-color="#9d4edd" stop-opacity="0"/></linearGradient>
</defs>
<style>.m,.a{font-family:${mono};font-size:13px;fill:#9f8fb8}.a{text-anchor:end}.g{stroke:#3c2a5a;stroke-width:1;stroke-dasharray:3 6}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="url(#bg)" stroke="#3c096c" stroke-width="2"/>
<text x="${L}" y="52" font-family="${scrib}" font-size="28" fill="#39ff14">A year of chaos</text>
<text x="${W - R}" y="52" text-anchor="end" font-family="${mono}" font-size="16" fill="#d9c2ff">${cal.totalContributions} contributions · 365 days</text>
${grid}${labels}
<path d="${area}" fill="url(#ar)" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="2.2s" dur="1.2s" fill="freeze"/></path>
<path d="${line}" fill="none" stroke="url(#ln)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur="3s" fill="freeze"/></path>
<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="3s" dur=".6s" fill="freeze"/>
  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="#39ff14"/>
  <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="none" stroke="#39ff14" stroke-width="2"><animate attributeName="r" values="6;20" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/></circle>
  <text x="${px.toFixed(1)}" y="${(py - 16).toFixed(1)}" text-anchor="${anchor}" font-family="${scrib}" font-size="17" fill="#ff2e4d">HA HA HA · ${weeks[peak].n}</text>
</g>
</svg>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`${out}: ${cal.totalContributions} contributions, ${weeks.length} weeks, peak ${weeks[peak].n}`);
