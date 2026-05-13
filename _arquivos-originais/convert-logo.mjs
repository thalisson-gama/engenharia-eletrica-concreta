// Gera duas versões transparentes da logo Concretta:
//   img/logo.webp        → fundo transparente, cores originais (texto grafite, símbolo laranja). Usar em fundos claros.
//   img/logo-light.webp  → fundo transparente, texto convertido para BRANCO, símbolo laranja preservado. Usar em fundos escuros.
//   img/foto-rodrigo.webp → foto do sócio (Rodrigo Aguiar) tratada e otimizada
//
// Uso: node convert-logo.mjs

import sharp from 'sharp';
import path from 'node:path';

const ROOT = path.resolve('.');
const SRC  = path.join(ROOT, 'logo concretta.jpg');
const OUT  = path.join(ROOT, 'img');

// Limiares (sintonizados para a logo Concretta sobre fundo cinza muito claro)
const LUM_BG_CUTOFF      = 230;   // acima disso → fundo (transparente)
const LUM_AA_RANGE       = 40;    // banda de anti-alias suave nas bordas
const LUM_DARK_CUTOFF    = 120;   // abaixo disso → texto grafite (vira branco na versão light)

// Detector do laranja da logo (#F26522 e variações de anti-alias)
function isOrange(r, g, b) {
  return r > 180 && g > 60 && g < 160 && b < 110 && r > g && g > b;
}

function makeAlphaMaskDark(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    const lum = 0.299*r + 0.587*g + 0.114*b;
    if (lum >= LUM_BG_CUTOFF) {
      pixels[i+3] = 0;
    } else if (lum >= LUM_BG_CUTOFF - LUM_AA_RANGE) {
      pixels[i+3] = Math.round(((LUM_BG_CUTOFF - lum) / LUM_AA_RANGE) * 255);
    }
    // pixels mais escuros que (BG - AA) ficam totalmente opacos (alpha 255)
  }
}

function makeAlphaMaskLight(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    const lum = 0.299*r + 0.587*g + 0.114*b;

    if (lum >= LUM_BG_CUTOFF) {
      // Fundo
      pixels[i+3] = 0;
      continue;
    }

    if (isOrange(r, g, b)) {
      // Símbolo laranja: preservar cor, alpha cheio (ou proporcional se antialias)
      const alpha = lum >= LUM_BG_CUTOFF - LUM_AA_RANGE
        ? Math.round(((LUM_BG_CUTOFF - lum) / LUM_AA_RANGE) * 255)
        : 255;
      pixels[i+3] = alpha;
      continue;
    }

    // Texto/traços escuros: converter para BRANCO
    if (lum < LUM_DARK_CUTOFF) {
      pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255;
      pixels[i+3] = 255;
    } else {
      // Banda intermediária (cinza médio das bordas anti-aliased do texto)
      const t = (LUM_BG_CUTOFF - lum) / (LUM_BG_CUTOFF - LUM_DARK_CUTOFF);
      pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255;
      pixels[i+3] = Math.round(t * 255);
    }
  }
}

async function processLogo(maskFn, outName, width) {
  const raw = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(raw.data);
  maskFn(pixels);
  const outPath = path.join(OUT, outName);
  await sharp(pixels, { raw: { width: raw.info.width, height: raw.info.height, channels: 4 } })
    .trim({ threshold: 1 }) // remove o entorno totalmente transparente
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 100, effort: 5 })
    .toFile(outPath);
  const { size } = await import('node:fs/promises').then(f => f.stat(outPath));
  console.log(`OK  ${outName}  (${(size/1024).toFixed(1)} KB)`);
}

// Foto do sócio (Rodrigo Aguiar)
async function processFoto() {
  const src = path.join(ROOT, 'WhatsApp Image 2026-04-29 at 17.40.57.jpeg');
  const out = path.join(OUT, 'rodrigo-aguiar.webp');
  await sharp(src)
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(out);
  const { size } = await import('node:fs/promises').then(f => f.stat(out));
  console.log(`OK  rodrigo-aguiar.webp  (${(size/1024).toFixed(1)} KB)`);
}

console.log('Processando logos transparentes…');
await processLogo(makeAlphaMaskDark,  'logo.webp',       600);
await processLogo(makeAlphaMaskLight, 'logo-light.webp', 600);
await processFoto();
console.log('\nDone.');
