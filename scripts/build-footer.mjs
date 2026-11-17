// Builds assets/footer.svg: rocket launch (photo background embedded as base64, animated
// overlays in SVG). Run `node scripts/build-footer.mjs`, then commit.
import { readFileSync, writeFileSync } from "node:fs";

const W = 1200, H = 440, RX = 980; // RX: rocket axis in the photo
const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const img = readFileSync("assets/src/rocket-launch.jpg").toString("base64");
let seed = 11;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const stars = Array.from({ length: 26 }, () => {
  const x = (20 + rnd() * 860).toFixed(0), y = (14 + rnd() * 250).toFixed(0), r = (0.7 + rnd() * 1.1).toFixed(1);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#eafff4"><animate attributeName="opacity" values=".15;1;.15" dur="${(1.6 + rnd() * 3).toFixed(1)}s" begin="${(rnd() * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
}).join("");
const sparks = Array.from({ length: 14 }, () => {
  const x = 700 + rnd() * 480, y = 330 + rnd() * 90, dx = (rnd() - 0.5) * 80, dur = (2 + rnd() * 3).toFixed(1);
  return `<circle r="${(1 + rnd() * 1.6).toFixed(1)}" fill="#ffd166" opacity="0"><animate attributeName="cx" values="${x.toFixed(0)};${(x + dx).toFixed(0)}" dur="${dur}s" begin="${(rnd() * 4).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="cy" values="${y.toFixed(0)};${(y - 120 - rnd() * 120).toFixed(0)}" dur="${dur}s" begin="${(rnd() * 4).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${dur}s" begin="${(rnd() * 4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
}).join("");
const digits = Array.from({ length: 10 }, (_, k) => `<tspan class="d" style="animation-delay:${k - 10}s" x="64" y="150">T+ 00:00:0${k}</tspan>`).join("");
const alt = ["0.4", "1.1", "2.3", "3.9", "5.8", "8.2", "11.0", "14.3", "18.1", "22.4"].map((v, k) => `<tspan class="d" style="animation-delay:${k - 10}s" x="110" y="196">${v} km</tspan>`).join("");
const vel = ["212", "388", "570", "761", "962", "1174", "1398", "1633", "1880", "2140"].map((v, k) => `<tspan class="d" style="animation-delay:${k - 10}s" x="110" y="220">${v} m/s</tspan>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="A rocket lifting off at night. Thanks for visiting — merci de la visite — gracias por la visita.">
<defs>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <radialGradient id="fl"><stop offset="0" stop-color="#fff3c4" stop-opacity=".9"/><stop offset=".4" stop-color="#ffb000" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>
  <linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#03100a" stop-opacity=".78"/><stop offset=".5" stop-color="#03100a" stop-opacity=".25"/><stop offset=".75" stop-color="#03100a" stop-opacity="0"/></linearGradient>
</defs>
<style>text{font-family:${mono}}.d{opacity:0;animation:d 10s steps(1) infinite}@keyframes d{0%{opacity:1}10%,100%{opacity:0}}
@keyframes bl{0%,49%{opacity:1}50%,100%{opacity:0}}.bl{animation:bl 1s steps(1) infinite}</style>
<g clip-path="url(#r)">
<rect width="${W}" height="${H}" fill="#03100a"/>
<g><animateTransform attributeName="transform" type="translate" values="0 0;1.2 -.8;-1 .9;.8 1;-1.1 -.6;0 0" dur=".5s" repeatCount="indefinite"/>
<g><animateTransform attributeName="transform" type="scale" values="1;1.05;1" dur="16s" repeatCount="indefinite" additive="sum"/><animateTransform attributeName="transform" type="translate" values="0 0;-49 -6;0 0" dur="16s" repeatCount="indefinite" additive="sum"/>
<image width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${img}" xlink:href="data:image/jpeg;base64,${img}"/>
<ellipse cx="${RX}" cy="235" rx="70" ry="150" fill="url(#fl)"><animate attributeName="opacity" values=".25;.8;.4;.95;.3;.7;.25" dur=".42s" repeatCount="indefinite"/><animate attributeName="ry" values="150;165;145;170;150" dur=".3s" repeatCount="indefinite"/></ellipse>
<ellipse cx="960" cy="410" rx="330" ry="110" fill="url(#fl)" opacity=".2"><animate attributeName="opacity" values=".1;.3;.16;.34;.1" dur="1.1s" repeatCount="indefinite"/></ellipse>
<g fill="none" stroke="#5df2c0" stroke-width="2"><animate attributeName="opacity" values="1;.35;1" dur="1.4s" repeatCount="indefinite"/>
<path d="M${RX - 46} 22V8H${RX - 32}M${RX + 32} 8H${RX + 46}V22M${RX - 46} 150V164H${RX - 32}M${RX + 32} 164H${RX + 46}V150"/></g>
<text x="${RX + 54}" y="20" font-size="11" fill="#5df2c0">TRK LOCK</text>
</g></g>
${stars}${sparks}
<rect width="${W}" height="${H}" fill="url(#fade)"/>
<text x="64" y="76" font-size="13" letter-spacing="3" fill="#8fb3a2">MISSION STATUS</text>
<text x="64" y="118" font-size="38" font-weight="700" letter-spacing="6" fill="#ffd166">LIFTOFF</text>
<circle cx="300" cy="104" r="7" fill="#3dff8a"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/></circle>
<text font-size="20" fill="#eafff4">${digits}</text>
<text font-size="14" fill="#d7e6dc"><tspan x="64" y="196" fill="#ffb000">ALT</tspan>${alt}<tspan x="64" y="220" fill="#ffb000">VEL</tspan>${vel}</text>
<path d="M64 244H420" stroke="#b87333" stroke-width="2"/>
<text x="64" y="276" font-size="15" fill="#eafff4">Thanks for visiting · Merci de la visite · Gracias por la visita</text>
<text x="64" y="304" font-size="13" fill="#8fb3a2">&gt; end of transmission <tspan class="bl" fill="#ffb000">▮</tspan></text>
</g>
</svg>
`;
writeFileSync("assets/footer.svg", svg);
console.log(`assets/footer.svg: ${(svg.length / 1024).toFixed(0)} kB`);
