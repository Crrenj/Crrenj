// Builds assets/banner.svg: a PCB whose copper traces power up a chip marked "Henri".
// Static asset (no data): run `node scripts/build-banner.mjs` after editing, then commit.
import { writeFileSync } from "node:fs";

const out = process.argv[2] ?? "assets/banner.svg";
const W = 1200, H = 380, CX = 600, CY = 190, BW = 340, BH = 124;
const T = 9; // master cycle, seconds
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const C = {
  cu: "#b87333", cuHi: "#e9a55c", gold: "#e3b341", hot: "#ffe2a0", amber: "#ffb000",
  silk: "#d7e6dc", mask0: "#0e3a29", mask1: "#06170f", chip: "#111614", sig: "#5df2c0",
};
const f = (n) => +n.toFixed(1);

// Deterministic pseudo-random so the build is reproducible.
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// ── traces: fan-out from the 4×7 top/bottom pins, 45° bends, horizontal lanes ──
const ends = {
  "-1,-1": [0, 250, 0, 140, 330, 200, 90],
  "-1,1": [120, 0, 280, 0, 170, 360, 230],
  "1,-1": [0, 180, 300, 0, 110, 240, 380],
  "1,1": [150, 0, 0, 260, 90, 340, 200],
};
const traces = []; // {d, len, end:[x,y], finger:boolean}
const pinsTB = [];
for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
  for (let j = 0; j < 7; j++) {
    const x = CX + sx * (6.5 - j) * 22;
    const tip = CY + sy * (BH / 2 + 14);
    pinsTB.push([x, sy]);
    const y2 = tip + sy * (6 + 9 * j), x3 = x + sx * 14, y3 = y2 + sy * 14;
    const dist = ends[`${sx},${sy}`][j];
    const finger = dist === 0;
    const ex = sx < 0 ? (finger ? 30 : dist) : W - (finger ? 30 : dist);
    const len = Math.abs(ex - x3) + 14 * Math.SQRT2 + Math.abs(y2 - tip);
    traces.push({ d: `M${f(ex)} ${f(y3)}L${f(x3)} ${f(y3)}L${f(x)} ${f(y2)}L${f(x)} ${f(tip)}`, len, end: [ex, y3], finger, sx });
  }
}
// side pins → instrument blocks
const sideY = [154, 178, 202, 226];
for (const sx of [-1, 1]) sideY.forEach((y, k) => {
  const tip = CX + sx * (BW / 2 + 14), ex = sx < 0 ? 346 : 854;
  const jog = (k % 2 ? 1 : -1) * 0; // straight runs keep the block tidy
  traces.push({ d: `M${ex} ${y + jog}L${tip} ${y}`, len: Math.abs(ex - tip), end: [ex, y], side: true, sx });
});

const base = traces.map((t) => `<path d="${t.d}"/>`).join("");
const lit = traces.map((t, i) => {
  const start = f(0.02 + rnd() * 0.07), arrive = 0.3;
  return `<path d="${t.d}" pathLength="100" stroke-dasharray="100 100" stroke-dashoffset="100"><animate attributeName="stroke-dashoffset" values="100;100;0;0" keyTimes="0;${start};${arrive};1" dur="${T}s" repeatCount="indefinite"/></path>`;
}).join("");
const packets = traces.map((t) => {
  const dur = f(Math.max(1.1, t.len / 130) + rnd() * 0.8), begin = f(rnd() * 3);
  const dash = f(Math.max(2.5, 900 / t.len));
  // Side traces on the right carry data *out* of the chip (to the logic analyzer).
  const [from, to] = t.side && t.sx > 0 ? [0, 100] : [100, 0];
  return `<path d="${t.d}" pathLength="100" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${from}"><animate attributeName="stroke-dashoffset" from="${from}" to="${to}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></path>`;
}).join("");

const endDeco = traces.filter((t) => !t.side).map((t) => {
  const [x, y] = t.end;
  if (t.finger) return `<rect x="${t.sx < 0 ? 0 : W - 32}" y="${f(y - 4)}" width="32" height="8" rx="2" fill="${C.gold}"/>`;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="5.5" fill="${C.cuHi}"/><circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="${C.mask1}"/>`;
}).join("");

// inline SMD parts sitting on the longer lanes
let parts = "", refR = 1, refC = 1;
traces.filter((t) => !t.side && !t.finger && t.len > 230).forEach((t, i) => {
  const [ex, y] = t.end, x = ex + t.sx * -1 * (60 + rnd() * 60); // towards the chip
  const isR = i % 2 === 0;
  parts += `<g transform="translate(${f(x)} ${f(y)})"><rect x="-13" y="-6" width="26" height="12" rx="1.5" fill="${C.mask1}"/><rect x="-13" y="-6" width="7" height="12" rx="1" fill="#cfd6d2"/><rect x="6" y="-6" width="7" height="12" rx="1" fill="#cfd6d2"/><rect x="-6" y="-5" width="12" height="10" fill="${isR ? "#1b1b1b" : "#b08a5a"}"/>${isR ? `<text y="3" text-anchor="middle" font-family="${mono}" font-size="7" fill="#e8e8e8">${["103", "472", "220", "101"][i % 4]}</text>` : ""}<text y="-10" text-anchor="middle" font-family="${mono}" font-size="7.5" fill="${C.silk}" fill-opacity=".75">${isR ? "R" + refR++ : "C" + refC++}</text></g>`;
});

// ── chip ──
const bx = CX - BW / 2, by = CY - BH / 2;
let pins = "";
for (const [x, sy] of pinsTB) pins += `<rect x="${f(x - 5)}" y="${sy < 0 ? by - 14 : by + BH}" width="10" height="14" rx="1.5"/>`;
for (const sx of [-1, 1]) for (const y of sideY) pins += `<rect x="${sx < 0 ? bx - 14 : bx + BW}" y="${y - 5}" width="14" height="10" rx="1.5"/>`;

const kOn = ".3;.34", glowVals = (a, b) => `${a};${a};${b};${b};${a}`, glowKeys = `0;.3;.36;.9;1`;
const chip = `
<ellipse cx="${CX}" cy="${CY}" rx="300" ry="130" fill="url(#halo)" opacity="0"><animate attributeName="opacity" values="${glowVals(0, 1)}" keyTimes="${glowKeys}" dur="${T}s" repeatCount="indefinite"/></ellipse>
<g fill="#c9d1cd">${pins}</g>
<rect x="${bx}" y="${by}" width="${BW}" height="${BH}" rx="10" fill="url(#pkg)" stroke="#2a3530" stroke-width="2"/>
<rect x="${bx + 3}" y="${by + 3}" width="${BW - 6}" height="${BH - 6}" rx="8" fill="none" stroke="${C.sig}" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="${glowVals(0, 0.7)}" keyTimes="${glowKeys}" dur="${T}s" repeatCount="indefinite"/></rect>
<circle cx="${bx + 20}" cy="${by + 20}" r="6" fill="#0a0e0c" stroke="#2f3b35"/>
<text x="${CX}" y="${CY + 16}" text-anchor="middle" font-family="${sans}" font-size="78" font-weight="800" letter-spacing="3" fill="${C.sig}" filter="url(#blur)" opacity="0">Henri<animate attributeName="opacity" values="${glowVals(0, 0.75)}" keyTimes="${glowKeys}" dur="${T}s" repeatCount="indefinite"/></text>
<text x="${CX}" y="${CY + 16}" text-anchor="middle" font-family="${sans}" font-size="78" font-weight="800" letter-spacing="3" fill="#34443d">Henri<animate attributeName="fill" values="${glowVals("#34443d", "#f3fff9")}" keyTimes="${glowKeys}" dur="${T}s" repeatCount="indefinite"/></text>
<text x="${CX}" y="${CY + 44}" text-anchor="middle" font-family="${mono}" font-size="12.5" letter-spacing="2.5" fill="#55685f">CO-FOUNDER · LANJO TECHNOLOGIES<animate attributeName="fill" values="${glowVals("#55685f", "#bfe9d6")}" keyTimes="${glowKeys}" dur="${T}s" repeatCount="indefinite"/></text>
<text x="${bx + BW - 14}" y="${by + 22}" text-anchor="end" font-family="${mono}" font-size="10" letter-spacing="1.5" fill="#55685f">U1</text>`;

// ── oscilloscope (left) ──
const SX = 100, SY = 132, SW = 240, SH = 116, PER = 120;
let wave = "";
for (let x = 0; x <= SW + PER * 2; x += 3) {
  const p = (x / PER) * Math.PI * 2;
  const y = SY + SH / 2 - (Math.sin(p) * 26 + Math.sin(p * 3) * 9);
  wave += `${x ? "L" : "M"}${SX + x} ${f(y)}`;
}
let sgrid = "";
for (let i = 1; i < 8; i++) sgrid += `<line x1="${SX + i * 30}" y1="${SY}" x2="${SX + i * 30}" y2="${SY + SH}"/>`;
for (let i = 1; i < 4; i++) sgrid += `<line x1="${SX}" y1="${SY + i * 29}" x2="${SX + SW}" y2="${SY + i * 29}"/>`;
const scope = `
<rect x="${SX - 8}" y="${SY - 8}" width="${SW + 16}" height="${SH + 16}" rx="9" fill="#0a0f0d" stroke="#2a3530" stroke-width="2"/>
<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="4" fill="#061009"/>
<g stroke="${C.amber}" stroke-opacity=".16" stroke-width="1">${sgrid}</g>
<g clip-path="url(#scr)"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="${-PER} 0" dur="2.4s" repeatCount="indefinite"/>
<path d="${wave}" fill="none" stroke="${C.amber}" stroke-opacity=".3" stroke-width="7" stroke-linejoin="round"/>
<path d="${wave}" fill="none" stroke="#ffd166" stroke-width="2.2" stroke-linejoin="round"/></g></g>
<text x="${SX + 6}" y="${SY + 13}" font-family="${mono}" font-size="9.5" fill="${C.amber}">CH1 1.00V  2ms</text>
<text x="${SX + SW - 6}" y="${SY + SH - 6}" text-anchor="end" font-family="${mono}" font-size="9.5" fill="${C.amber}">TRIG<animate attributeName="opacity" values="1;1;.15;.15" keyTimes="0;.5;.5;1" dur="1.2s" repeatCount="indefinite"/></text>
<g fill="${C.gold}">${sideY.map((y) => `<rect x="${SX + SW + 8}" y="${y - 4}" width="8" height="8" rx="1.5"/>`).join("")}</g>`;

// ── logic analyzer (right) ──
const LX = 862, LW = 240, WX = LX + 78, WW = LW - 86;
const sq = (bits, bw, y, amp) => {
  let d = `M0 ${y + (bits[0] ? -amp : amp)}`;
  bits.forEach((b, i) => {
    const yy = y + (b ? -amp : amp);
    d += `V${yy}H${f((i + 1) * bw)}`;
  });
  return d;
};
const rows = [
  { name: "UART TX", bw: 9, n: 18, gen: () => (rnd() > 0.5 ? 1 : 0), dur: 3.2, col: C.sig },
  { name: "SPI SCK", bw: 6, n: 28, gen: (i) => i % 2, dur: 1.6, col: "#ffd166" },
  { name: "I2C SDA", bw: 12, n: 14, gen: () => (rnd() > 0.45 ? 1 : 0), dur: 4.4, col: C.sig },
  { name: "PWM", bw: 4, n: 42, gen: (i) => (i % 7 < 1 + (Math.floor(i / 7) % 6) ? 1 : 0), dur: 3.6, col: "#ffd166" },
];
const analyzer = `
<rect x="${LX - 8}" y="${SY - 8}" width="${LW + 16}" height="${SH + 16}" rx="9" fill="#0a0f0d" stroke="#2a3530" stroke-width="2"/>
<rect x="${LX}" y="${SY}" width="${LW}" height="${SH}" rx="4" fill="#061009"/>
<g fill="${C.gold}">${sideY.map((y) => `<rect x="${LX - 16}" y="${y - 4}" width="8" height="8" rx="1.5"/>`).join("")}</g>
${rows.map((r, k) => {
  const bits = Array.from({ length: r.n }, (_, i) => r.gen(i));
  const per = r.n * r.bw, y = sideY[k];
  const one = sq([...bits, ...bits, ...bits], r.bw, 0, 7);
  return `<text x="${LX + 8}" y="${y + 3.5}" font-family="${mono}" font-size="10" fill="${r.col}">${r.name}</text>
<g clip-path="url(#la)"><g transform="translate(${WX} ${y})"><g><animateTransform attributeName="transform" type="translate" from="${-per} 0" to="0 0" dur="${r.dur}s" repeatCount="indefinite"/><path d="${one}" fill="none" stroke="${r.col}" stroke-width="1.8" stroke-linejoin="round"/></g></g></g>`;
}).join("\n")}`;

// ── status LEDs (left edge) ──
const led = (y, name, col, anim) => `<g transform="translate(52 ${y})"><rect x="-11" y="-6" width="22" height="12" rx="2" fill="#cfd6d2"/><rect x="-6" y="-5" width="12" height="10" rx="1.5" fill="${col}">${anim}</rect><circle r="13" fill="${col}" opacity=".25">${anim.replace(/attributeName="opacity" values="([^"]+)"/, (m, v) => `attributeName="opacity" values="${v.split(";").map((n) => +n * 0.3).join(";")}"`)}</circle><text x="-18" y="3.5" text-anchor="end" font-family="${mono}" font-size="8.5" fill="${C.silk}" fill-opacity=".8">${name}</text></g>`;
const leds =
  led(160, "PWR", "#3dff8a", `<animate attributeName="opacity" values=".2;.2;1;1;.2" keyTimes="0;.02;.04;.92;1" dur="${T}s" repeatCount="indefinite"/>`) +
  led(190, "TX", "#ffb000", `<animate attributeName="opacity" values="1;.15;1;1;.15;1;.15" dur=".9s" repeatCount="indefinite"/>`) +
  led(220, "RX", "#ffb000", `<animate attributeName="opacity" values=".15;1;.15;.15;1;1;.15" dur="1.3s" repeatCount="indefinite"/>`);

// ── telemetry antenna (right edge) ──
const AX = 1150, AY = 190;
const antenna = `
<path d="M${AX - 14} ${AY + 44}V${AY + 30}h18v-10h-18v-10h18v-10h-18v-10h18v-10h-18v-10h18v-10h-18" fill="none" stroke="${C.cuHi}" stroke-width="3" stroke-linejoin="round"/>
<text x="${AX - 5}" y="${AY + 60}" text-anchor="middle" font-family="${mono}" font-size="8.5" fill="${C.silk}" fill-opacity=".8">ANT1</text>
${[0, 1, 2].map((k) => `<path d="M${AX + 12} ${AY - 26}a26 26 0 0 1 0 52" fill="none" stroke="${C.amber}" stroke-width="2" stroke-linecap="round" opacity="0" transform="translate(${AX + 12} ${AY}) scale(${0.5 + k * 0.4}) translate(${-AX - 12} ${-AY})"><animate attributeName="opacity" values="0;.9;0" dur="1.8s" begin="${k * 0.3}s" repeatCount="indefinite"/></path>`).join("")}`;

const holes = [[40, 30], [W - 40, 30], [40, H - 30], [W - 40, H - 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.cu}"/><circle cx="${x}" cy="${y}" r="7" fill="#020705"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Henri — co-founder, Lanjo Technologies · Paris, France. A circuit board whose copper traces light up a chip marked Henri.">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.mask0}"/><stop offset=".55" stop-color="#0a2a1d"/><stop offset="1" stop-color="${C.mask1}"/></linearGradient>
  <linearGradient id="pkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2320"/><stop offset="1" stop-color="#0b0f0d"/></linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="${C.sig}" stop-opacity=".34"/><stop offset="1" stop-color="${C.sig}" stop-opacity="0"/></radialGradient>
  <pattern id="pour" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="none"/><path d="M0 0H14M0 7H14" stroke="#ffffff" stroke-opacity=".025" stroke-width="2"/></pattern>
  <pattern id="vias" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="23" cy="23" r="1.6" fill="${C.cu}" fill-opacity=".28"/></pattern>
  <filter id="blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <clipPath id="scr"><rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="4"/></clipPath>
  <clipPath id="la"><rect x="${WX}" y="${SY}" width="${WW}" height="${SH}"/></clipPath>
</defs>
<g clip-path="url(#r)">
<rect width="${W}" height="${H}" fill="url(#bg)"/><rect width="${W}" height="${H}" fill="url(#pour)"/><rect width="${W}" height="${H}" fill="url(#vias)"/>
${holes}
<g fill="none" stroke="${C.cu}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" stroke-opacity=".85">${base}</g>
<g fill="none" stroke-linejoin="round" stroke-linecap="round"><animate attributeName="opacity" values="1;1;.35;0" keyTimes="0;.36;.9;1" dur="${T}s" repeatCount="indefinite"/>
<g stroke="${C.amber}" stroke-width="8" stroke-opacity=".22">${lit}</g><g stroke="${C.hot}" stroke-width="2.2">${lit}</g></g>
${endDeco}${parts}
<g fill="none" stroke-linecap="round"><g stroke="${C.amber}" stroke-width="9" stroke-opacity=".3">${packets}</g><g stroke="#fff6d8" stroke-width="3">${packets}</g></g>
${scope}${analyzer}${leds}${antenna}${chip}
<text x="64" y="${H - 14}" font-family="${mono}" font-size="10" letter-spacing="2" fill="${C.silk}" fill-opacity=".7">PARIS · FR · 48.86°N 2.35°E</text>
<text x="${W - 64}" y="${H - 14}" text-anchor="end" font-family="${mono}" font-size="10" letter-spacing="2" fill="${C.silk}" fill-opacity=".7">EN · FR · ES</text>
</g>
</svg>
`;
writeFileSync(out, svg);
console.log(`${out}: ${(svg.length / 1024).toFixed(1)} kB, ${traces.length} traces`);
