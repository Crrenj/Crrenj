// Builds the section components so no part of the README is plain text:
// section headers (assets/h-*.svg), stack sub-labels (assets/sub-*.svg),
// language tabs (assets/lang-*.svg) and the About datasheets (assets/about-*.svg).
// Run `node scripts/build-sections.mjs`, then commit.
import { writeFileSync } from "node:fs";

const mono = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e3a29"/><stop offset="1" stop-color="#06170f"/></linearGradient>`;
const save = (name, svg) => { writeFileSync(`assets/${name}.svg`, svg); console.log(`assets/${name}.svg ${svg.length} B`); };

// ── section headers ──
const ICON = {
  about: `<rect x="-9" y="-9" width="18" height="18" rx="3"/><path d="M-5 -9v-5M0 -9v-5M5 -9v-5M-5 9v5M0 9v5M5 9v5M-9 -5h-5M-9 0h-5M-9 5h-5M9 -5h5M9 0h5M9 5h5"/>`,
  projects: `<rect x="-13" y="-8" width="26" height="16" rx="3"/><path d="M-7 -2v4M0 -2v4M7 -2v4" stroke-width="3.4"/>`,
  stack: `<path d="M0 -12L13 -5L0 2L-13 -5ZM-13 1L0 8L13 1M-13 7L0 14L13 7"/>`,
  activity: `<path d="M-15 0H-8L-4 -11L2 11L6 -4L9 0H15"/>`,
  trophies: `<circle cy="-3" r="9"/><path d="M-5 5L-8 15L0 11L8 15L5 5"/>`,
};
const headers = [
  ["about", "ABOUT", "À PROPOS · SOBRE MÍ"],
  ["projects", "PROJECTS", "PROJETS · PROYECTOS"],
  ["stack", "STACK", "LANGAGES · FRAMEWORKS · TOOLS"],
  ["activity", "ACTIVITY", "ACTIVITÉ · ACTIVIDAD"],
  ["trophies", "TROPHIES & BADGES", "TROPHÉES · TROFEOS"],
];
headers.forEach(([id, main, rest], k) => {
  const W = 1200, H = 72, tx = 880, d = `M${tx} 36H1010l10 -10H1090l10 10H1148`;
  save(`h-${id}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(main)} · ${esc(rest)}">
<defs>${defs}</defs>
<rect x="1" y="5" width="${W - 2}" height="${H - 10}" rx="14" fill="url(#bg)" stroke="#b87333" stroke-width="2"/>
<circle cx="46" cy="36" r="23" fill="#07130d" stroke="#ffb000" stroke-width="2"/>
<circle cx="46" cy="36" r="28" fill="none" stroke="#ffb000" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="3 6"><animateTransform attributeName="transform" type="rotate" from="0 46 36" to="360 46 36" dur="14s" repeatCount="indefinite"/></circle>
<g transform="translate(46 36)" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICON[id]}</g>
<text x="92" y="45" font-family="${mono}" font-size="26" letter-spacing="2"><tspan font-weight="800" fill="#ffd166">${esc(main)}</tspan><tspan fill="#8fb3a2"> · </tspan><tspan fill="#d7e6dc" font-size="20">${esc(rest)}</tspan></text>
<path d="${d}" fill="none" stroke="#b87333" stroke-width="3" stroke-linejoin="round"/>
<circle cx="${tx}" cy="36" r="6" fill="#e9a55c"/><circle cx="${tx}" cy="36" r="2.5" fill="#06170f"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" pathLength="100" stroke="#ffb000" stroke-opacity=".35" stroke-width="9" stroke-dasharray="9 91"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.4s" begin="${k * 0.3}s" repeatCount="indefinite"/></path>
<path d="${d}" pathLength="100" stroke="#fff6d8" stroke-width="3" stroke-dasharray="9 91"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="2.4s" begin="${k * 0.3}s" repeatCount="indefinite"/></path></g>
<rect x="1148" y="27" width="26" height="18" rx="3" fill="#cfd6d2"/><rect x="1154" y="29" width="14" height="14" rx="2" fill="#3dff8a"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" begin="${k * 0.2}s" repeatCount="indefinite"/></rect>
<text x="${tx + 2}" y="22" font-family="${mono}" font-size="10" letter-spacing="2" fill="#8fb3a2">SEC 0${k + 1}</text>
</svg>
`);
});

// ── small silkscreen pills: stack sub-labels and language tabs ──
const pill = (name, text, { led } = {}) => {
  const w = Math.round(text.length * 9.9 + (led ? 62 : 44)), h = 34;
  save(name, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(text)}">
<defs>${defs}</defs>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${h / 2 - 1}" fill="url(#bg)" stroke="#b87333" stroke-width="1.5"/>
${led ? `<circle cx="20" cy="${h / 2}" r="5.5" fill="${led}"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>` : `<circle cx="14" cy="${h / 2}" r="4" fill="#e9a55c"/><circle cx="${w - 14}" cy="${h / 2}" r="4" fill="#e9a55c"/>`}
<text x="${led ? (w + 18) / 2 : w / 2}" y="${h / 2 + 5}" text-anchor="middle" font-family="${mono}" font-size="14" font-weight="700" letter-spacing="1.5" fill="#ffd166">${esc(text)}</text>
</svg>
`);
};
pill("sub-languages", "LANGUAGES · LANGAGES · LENGUAJES");
pill("sub-frameworks", "FRAMEWORKS");
pill("sub-tools", "DATA · INFRA · TOOLS");
pill("lang-en", "EN · ENGLISH", { led: "#3dff8a" });
pill("lang-fr", "FR · FRANÇAIS", { led: "#ffb000" });
pill("lang-es", "ES · ESPAÑOL", { led: "#5df2c0" });

// ── About datasheets (text wrapped by hand: SVG has no line wrapping) ──
// **bold** marks the highlighted words.
const about = {
  en: ["ABOUT.EN", "I'm from Paris, France, and co-founder of **Lanjo Technologies**, a company based in Santiago, Dominican Republic, that I work with remotely. I build products end to end: database, backend, web, mobile and payments. Right now most of my time goes to **Mi SaludRD**, a platform connecting Dominican patients and doctors."],
  fr: ["ABOUT.FR", "Je viens de Paris, en France, et je suis co-fondateur de **Lanjo Technologies**, une entreprise basée à Santiago, en République dominicaine, avec laquelle je travaille à distance. Je construis des produits de bout en bout : base de données, backend, web, mobile et paiements. En ce moment, presque tout mon temps va à **Mi SaludRD**, une plateforme qui relie patients et médecins dominicains."],
  es: ["ABOUT.ES", "Soy de París, Francia, y co-fundador de **Lanjo Technologies**, una empresa con sede en Santiago, República Dominicana, con la que trabajo a distancia. Construyo productos de principio a fin: base de datos, backend, web, móvil y pagos. Ahora mismo, casi todo mi tiempo va a **Mi SaludRD**, una plataforma que conecta pacientes y médicos dominicanos."],
};
for (const [lang, [title, text]] of Object.entries(about)) {
  const COLS = 86, W = 1200, X = 64, LH = 34, Y0 = 96;
  // tokenise into words carrying a bold flag
  const words = [];
  text.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
    const bold = part.startsWith("**");
    (bold ? part.slice(2, -2) : part).split(/ +/).filter(Boolean).forEach((w, i) => words.push([w, bold, !bold && i === 0 && /^[,.;:]/.test(part)]));
  });
  const lines = [[]]; let len = 0;
  for (const [w, b, glue] of words) {
    // punctuation right after a bold run is glued to it (no space, no line break)
    if (!glue && len + w.length + (len ? 1 : 0) > COLS) { lines.push([]); len = 0; }
    lines[lines.length - 1].push([w, b, glue]); len += w.length + (len && !glue ? 1 : 0);
  }
  const H = Y0 + lines.length * LH + 14;
  const body = lines.map((ln, i) => {
    let out = "", prevBold = null;
    ln.forEach(([w, b, glue], j) => { out += `${j && !glue ? " " : ""}${b ? `<tspan fill="#ffd166" font-weight="700">${esc(w)}</tspan>` : esc(w)}`; });
    return `<g class="l" style="animation-delay:${(0.3 + i * 0.22).toFixed(2)}s"><text x="${X - 34}" y="${Y0 + i * LH}" fill="#4f6e60" font-size="13">${String(i + 1).padStart(2, "0")}</text><text x="${X}" y="${Y0 + i * LH}" fill="#d7e6dc" xml:space="preserve">${out}</text></g>`;
  }).join("\n");
  save(`about-${lang}`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(text.replace(/\*\*/g, ""))}">
<defs>${defs}<clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16"/></clipPath></defs>
<style>text{font-family:${mono};font-size:19px}@keyframes l{from{opacity:0}to{opacity:1}}.l{animation:l .35s backwards}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#07130d" stroke="#b87333" stroke-width="2"/>
<g clip-path="url(#c)"><rect x="1" y="1" width="${W - 2}" height="46" fill="url(#bg)"/><rect x="1" y="46" width="${W - 2}" height="1.500" fill="#b87333"/></g>
<circle cx="30" cy="24" r="6" fill="#3dff8a"><animate attributeName="opacity" values="1;.25;1" dur="1.6s" repeatCount="indefinite"/></circle>
<text x="50" y="30" fill="#ffd166" font-weight="800" letter-spacing="2" style="font-size:16px">${title}</text>
<text x="${W - 30}" y="30" text-anchor="end" fill="#8fb3a2" letter-spacing="2" style="font-size:12px">DATASHEET · HENRI · U1</text>
${body}
</svg>
`);
}
