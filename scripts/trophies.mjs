// Generates a row of trophies computed from the last year of contributions.
// Usage: GITHUB_TOKEN=... GH_USER=... node scripts/trophies.mjs dist/trophies.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const out = process.argv[2] ?? "dist/trophies.svg";
const user = process.env.GH_USER;
const token = process.env.GITHUB_TOKEN;
if (!user || !token) throw new Error("GH_USER and GITHUB_TOKEN are required");

const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-trophies" },
  body: JSON.stringify({ query, variables: { login: user } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GraphQL failed: ${JSON.stringify(json.errors ?? json)}`);
const cal = json.data.user.contributionsCollection.contributionCalendar;

const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => d.contributionCount);
const weekTotals = cal.weeks.map((w) => w.contributionDays.reduce((s, d) => s + d.contributionCount, 0));

let longest = 0, run = 0;
for (const n of days) { run = n > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
// Current streak: today may still be empty, so allow starting from yesterday.
let current = 0, i = days.length - 1;
if (days[i] === 0) i--;
for (; i >= 0 && days[i] > 0; i--) current++;

const RANKS = ["C", "B", "A", "S", "SS", "SSS"];
const rank = (v, steps) => { let r = "D"; steps.forEach((s, k) => { if (v >= s) r = RANKS[k]; }); return r; };
const fmt = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const trophies = [
  { title: "Chaos Agent", label: "contributions", value: cal.totalContributions, steps: [500, 1000, 2000, 3000, 4000, 5000] },
  { title: "No Sleep", label: "best day", value: Math.max(...days), steps: [10, 25, 50, 100, 150, 200] },
  { title: "Mad Week", label: "best week", value: Math.max(...weekTotals), steps: [50, 100, 200, 400, 700, 1000] },
  { title: "Relentless", label: "longest streak (days)", value: longest, steps: [3, 7, 14, 30, 60, 100] },
  { title: "Always On", label: "active days / 365", value: days.filter((n) => n > 0).length, steps: [30, 90, 150, 200, 250, 300] },
  { title: "On Fire", label: "current streak (days)", value: current, steps: [1, 3, 7, 14, 30, 60] },
].map((t) => ({ ...t, rank: rank(t.value, t.steps) }));

const COLORS = { SSS: "#39ff14", SS: "#39ff14", S: "#c77dff", A: "#c77dff", B: "#ff5c77", C: "#9f8fb8", D: "#5a4b72" };
const W = 1200, H = 250, CW = 186, GAP = 12, X0 = (W - (6 * CW + 5 * GAP)) / 2;
const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const scrib = `'Chalkduster','Marker Felt','Comic Sans MS','Segoe Print',cursive`;

const cards = trophies.map((t, k) => {
  const c = COLORS[t.rank], x = X0 + k * (CW + GAP), cx = CW / 2;
  const fs = t.rank.length === 3 ? 15 : t.rank.length === 2 ? 18 : 22;
  return `<g transform="translate(${x} 12)">
  <rect width="${CW}" height="${H - 24}" rx="16" fill="url(#bg)" stroke="${c}" stroke-opacity=".55" stroke-width="1.5"/>
  <text x="${cx}" y="30" text-anchor="middle" font-family="${scrib}" font-size="15" fill="${c}">${t.title}</text>
  <g transform="translate(${cx} 92)">
    <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="${2.4 + k * 0.3}s" repeatCount="indefinite"/>
      <path d="M-30 -40 h60 v22 a30 30 0 0 1 -60 0 Z" fill="${c}"/>
      <path d="M-30 -32 h-12 a8 8 0 0 0 -8 8 a22 22 0 0 0 22 22 M30 -32 h12 a8 8 0 0 1 8 8 a22 22 0 0 1 -22 22" fill="none" stroke="${c}" stroke-width="5"/>
      <rect x="-6" y="10" width="12" height="16" fill="${c}"/><rect x="-24" y="26" width="48" height="9" rx="4" fill="${c}"/>
      <text y="${-10 + fs / 3}" text-anchor="middle" font-family="${sans}" font-size="${fs}" font-weight="800" fill="#150726">${t.rank}</text>
    </g>
  </g>
  <text x="${cx}" y="174" text-anchor="middle" font-family="${sans}" font-size="32" font-weight="800" fill="#fff">${fmt(t.value)}</text>
  <text x="${cx}" y="198" text-anchor="middle" font-family="${mono}" font-size="11.5" fill="#b8a8d4">${t.label}</text>
</g>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${trophies.map((t) => `${t.title}: ${t.value} ${t.label}, rank ${t.rank}`).join(" · ")}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22093f"/><stop offset="1" stop-color="#0d0a14"/></linearGradient></defs>
${cards}
</svg>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`${out}: ${trophies.map((t) => `${t.title}=${t.value}(${t.rank})`).join(" ")}`);
