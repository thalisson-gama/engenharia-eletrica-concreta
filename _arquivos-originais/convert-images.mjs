// Converte imagens originais em WebP com nomes semânticos para a LP do Grupo Concretta.
// Uso: node convert-images.mjs

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const ROOT = path.resolve('.');
const OUT  = path.join(ROOT, 'img');

await fs.mkdir(OUT, { recursive: true });

// origem → destino semântico (sem extensão; gera .webp)
const map = [
  // Logo
  ['logo concretta.jpg',                              'logo',                 { width: 600,  quality: 92 }],
  // Hero principal: equipe Concretta uniformizada em equipamento industrial pesado
  ['WhatsApp Image 2026-04-29 at 17.40.46.jpeg',      'hero',                 { width: 1920, quality: 80 }],
  // Subestação: transformador sendo ensaiado com megôhmetro
  ['WhatsApp Image 2026-04-29 at 17.40.13 (1).jpeg',  'subestacao',           { width: 1200, quality: 80 }],
  // Aterramento: medição com terrômetro digital
  ['WhatsApp Image 2026-04-29 at 17.40.58.jpeg',      'aterramento',          { width: 1200, quality: 80 }],
  // SPDA: cabo de aterramento em vala
  ['617f1190-c4ba-4cfe-ae23-17dad474e152.jpg',        'spda',                 { width: 1200, quality: 80 }],
  // Edifício Beira Mar Fortaleza
  ['WhatsApp Image 2026-04-29 at 17.40.55.jpeg',      'edificio-comercial',   { width: 1600, quality: 80 }],
  // Operação noturna 24h
  ['WhatsApp Image 2026-04-29 at 17.40.21.jpeg',      'operacao-noturna',     { width: 1600, quality: 80 }],
  // Equipe em obra comercial
  ['WhatsApp Image 2026-04-29 at 17.40.56.jpeg',      'obra-comercial',       { width: 1600, quality: 80 }],
  // Instalação com guindaste
  ['WhatsApp Image 2026-04-29 at 17.40.52.jpeg',      'instalacao-subestacao',{ width: 1200, quality: 80 }],
  // Equipe Concretta uniformizada em obra
  ['WhatsApp Image 2026-04-29 at 17.40.44.jpeg',      'equipe-obra',          { width: 1200, quality: 80 }],
  // Painel/quadro elétrico
  ['WhatsApp Image 2026-04-29 at 17.40.50.jpeg',      'painel-eletrico',      { width: 1200, quality: 80 }],
  // Trabalho em altura em edifício
  ['WhatsApp Image 2026-04-29 at 17.40.13.jpeg',      'obra-altura',          { width: 1200, quality: 80 }],
];

let ok = 0, fail = 0;
for (const [src, dest, opts] of map) {
  const inPath  = path.join(ROOT, src);
  const outPath = path.join(OUT, dest + '.webp');
  try {
    await sharp(inPath)
      .rotate() // honra EXIF orientation (importante para fotos do WhatsApp)
      .resize({ width: opts.width, withoutEnlargement: true })
      .webp({ quality: opts.quality, effort: 5 })
      .toFile(outPath);
    const stat = await fs.stat(outPath);
    console.log(`OK  ${dest}.webp  (${(stat.size/1024).toFixed(1)} KB)`);
    ok++;
  } catch (e) {
    console.error(`ERR ${src}: ${e.message}`);
    fail++;
  }
}
console.log(`\nDone. ${ok} ok, ${fail} fail.`);
