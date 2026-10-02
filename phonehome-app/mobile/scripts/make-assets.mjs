// Gera os PNGs de ícone e abertura a partir de assets-src/glyph.svg (casa + celular da marca).
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const AZUL = "#2563eb";
const svg = await readFile(new URL("../assets-src/glyph.svg", import.meta.url));
await mkdir(new URL("../assets/", import.meta.url), { recursive: true });
const out = (n) => new URL(`../assets/${n}`, import.meta.url).pathname;

const glyph = (px) => sharp(svg, { density: 600 }).resize(px, px).png().toBuffer();
const solid = (w, h, background) => sharp({ create: { width: w, height: h, channels: 4, background } }).png();

// ícone iOS / Android legado (sem transparência)
await solid(1024, 1024, AZUL).composite([{ input: await glyph(640), gravity: "center" }]).flatten({ background: AZUL }).png().toFile(out("icon-only.png"));
// ícone adaptável Android: frente transparente + fundo azul
await solid(1024, 1024, { r: 0, g: 0, b: 0, alpha: 0 }).composite([{ input: await glyph(560), gravity: "center" }]).png().toFile(out("icon-foreground.png"));
await solid(1024, 1024, AZUL).toFile(out("icon-background.png"));
// tela de abertura
for (const n of ["splash.png", "splash-dark.png"]) {
  await solid(2732, 2732, AZUL).composite([{ input: await glyph(720), gravity: "center" }]).flatten({ background: AZUL }).png().toFile(out(n));
}
console.log("assets ok");
