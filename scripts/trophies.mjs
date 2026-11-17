// Generates a row of mission badges (trophies) computed from the last year of contributions.
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
  { title: "PAYLOAD", icon: "rocket", label: "contributions", value: cal.totalContributions, steps: [500, 1000, 2000, 3000, 4000, 5000] },
  { title: "MAX BURST", icon: "bolt", label: "best day", value: Math.max(...days), steps: [10, 25, 50, 100, 150, 200] },
  { title: "FULL THROTTLE", icon: "gauge", label: "best week", value: Math.max(...weekTotals), steps: [50, 100, 200, 400, 700, 1000] },
  { title: "UPTIME", icon: "clock", label: "longest streak (days)", value: longest, steps: [3, 7, 14, 30, 60, 100] },
  { title: "DUTY CYCLE", icon: "pwm", label: "active days / 365", value: days.filter((n) => n > 0).length, steps: [30, 90, 150, 200, 250, 300] },
  { title: "LIVE LINK", icon: "antenna", label: "current streak (days)", value: current, steps: [1, 3, 7, 14, 30, 60] },
].map((t) => ({ ...t, rank: rank(t.value, t.steps) }));

const COLORS = { SSS: "#ffd166", SS: "#ffd166", S: "#5df2c0", A: "#5df2c0", B: "#e9a55c", C: "#9fb5aa", D: "#5a6e64" };
const W = 1200, H = 262, CW = 186, CH = H - 24, GAP = 12, X0 = (W - (6 * CW + 5 * GAP)) / 2;
const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;

// Icons are drawn in a ±20 box, stroked in the rank colour.
const ICONS = {
  rocket: (c) => `<g><animateTransform attributeName="transform" type="translate" values="0 2;0 -3;0 2" dur="2.4s" repeatCount="indefinite"/><path d="M0 -21C9 -12 9 0 6 8H-6C-9 0 -9 -12 0 -21Z"/><path d="M-6 3L-13 12V4M6 3L13 12V4"/><circle cy="-5" r="3"/><path d="M-3 11L0 20L3 11" stroke="#ffb000"><animate attributeName="d" values="M-3 11L0 20L3 11;M-3 11L0 15L3 11;M-3 11L0 20L3 11" dur=".35s" repeatCount="indefinite"/></path></g>`,
  bolt: (c) => `<path d="M4 -20L-11 3H-1L-4 20L11 -4H1Z" fill="${c}" fill-opacity=".25"><animate attributeName="fill-opacity" values=".1;.9;.1;.1" keyTimes="0;.08;.3;1" dur="2.2s" repeatCount="indefinite"/></path>`,
  gauge: (c) => `<path d="M-17 10A19 19 0 1 1 17 10"/><path d="M-12 -7l3 2M0 -14v4M12 -7l-3 2" stroke-width="2"/><g><animateTransform attributeName="transform" type="rotate" values="-70 0 6;55 0 6;35 0 6;60 0 6;-70 0 6" keyTimes="0;.4;.55;.8;1" dur="3.4s" repeatCount="indefinite"/><path d="M0 6V-11" stroke="#ffb000"/></g><circle cy="6" r="2.5" fill="${c}"/>`,
  clock: (c) => `<circle cy="3" r="15"/><path d="M-4 -19H4M0 -19V-12"/><g><animateTransform attributeName="transform" type="rotate" from="0 0 3" to="360 0 3" dur="6s" repeatCount="indefinite"/><path d="M0 3V-8" stroke="#ffb000"/></g>`,
  pwm: (c) => `<path d="M-20 9H-14V-9H-4V9H2V-9H12V9H20"/><path d="M-20 9H-14V-9H-4V9H2V-9H12V9H20" stroke="#ffb000" pathLength="100" stroke-dasharray="14 86"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.8s" repeatCount="indefinite"/></path>`,
  antenna: (c) => `<path d="M0 20V-3M-7 20H7"/><circle cy="-6" r="3" fill="${c}"/>${[10, 17].map((r, k) => `<path d="M${-r * 0.75} ${-6 - r * 0.66}A${r} ${r} 0 0 0 ${-r * 0.75} ${-6 + r * 0.66}M${r * 0.75} ${-6 - r * 0.66}A${r} ${r} 0 0 1 ${r * 0.75} ${-6 + r * 0.66}" stroke="#ffb000"><animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="${k * 0.35}s" repeatCount="indefinite"/></path>`).join("")}`,
};

const cards = trophies.map((t, k) => {
  const c = COLORS[t.rank], x = X0 + k * (CW + GAP), cx = CW / 2;
  const pw = 26 + t.rank.length * 9;
  const vias = [[12, 12], [CW - 12, 12], [12, CH - 12], [CW - 12, CH - 12]].map(([vx, vy]) => `<circle cx="${vx}" cy="${vy}" r="3.5" fill="#b87333"/><circle cx="${vx}" cy="${vy}" r="1.4" fill="#06170f"/>`).join("");
  return `<g transform="translate(${x} 12)">
  <rect width="${CW}" height="${CH}" rx="14" fill="url(#bg)" stroke="${c}" stroke-opacity=".6" stroke-width="1.5"/>${vias}
  <text x="${cx}" y="32" text-anchor="middle" font-family="${mono}" font-size="12.5" font-weight="700" letter-spacing="1.5" fill="${c}">${t.title}</text>
  <g transform="translate(${cx} 96)">
    <circle r="44" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 7"><animateTransform attributeName="transform" type="rotate" from="0" to="${k % 2 ? -360 : 360}" dur="${18 + k * 2}s" repeatCount="indefinite"/></circle>
    <circle r="36" fill="#07130d" stroke="${c}" stroke-width="2.5"/>
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)">${ICONS[t.icon](c)}</g>
    <rect x="${-pw / 2}" y="27" width="${pw}" height="20" rx="10" fill="${c}"/>
    <text y="41.500" text-anchor="middle" font-family="${sans}" font-size="13" font-weight="800" fill="#06170f">${t.rank}</text>
  </g>
  <text x="${cx}" y="188" text-anchor="middle" font-family="${sans}" font-size="32" font-weight="800" fill="#fff">${fmt(t.value)}</text>
  <text x="${cx}" y="212" text-anchor="middle" font-family="${mono}" font-size="11.5" fill="#9fc4b1">${t.label}</text>
</g>`;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Mission badges: ${trophies.map((t) => `${t.title}: ${t.value} ${t.label}, rank ${t.rank}`).join(" · ")}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e3a29"/><stop offset="1" stop-color="#06170f"/></linearGradient></defs>
${cards}
</svg>
`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`${out}: ${trophies.map((t) => `${t.title}=${t.value}(${t.rank})`).join(" ")}`);
