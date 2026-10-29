/**
 * Stitch Dışa Aktarım (Export) Eşleştirme ve Görsel Hazırlama Betiği
 *
 * Mevcut Stitch klasörlerini kontrol eder:
 * - se_primer_onboarding       -> assets/screens/01_onboarding.png
 * - se_primer_kriz_karar       -> assets/screens/02_crisis_decision.png
 * - se_primer_kriz_sonu_raporu -> assets/screens/03_outcome_report.png
 * - obsidian_terminal          -> Tasarım sistemi referansı
 *
 * Klasörlerde PNG varsa kopyalar; yoksa obsidian_terminal paletine uygun
 * 390x844 mobil ekran referans PNG görsellerini üretir.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SCREENS_DIR = path.join(__dirname, '..', 'assets', 'screens');
fs.mkdirSync(SCREENS_DIR, { recursive: true });

const STITCH_MAPPING = [
  {
    sourceDir: 'se_primer_onboarding',
    targetFile: '01_onboarding.png',
    accent: [59, 130, 246], // #3B82F6 Primary Blue
    badge: [245, 158, 11],  // #F59E0B Amber Alert
  },
  {
    sourceDir: 'se_primer_kriz_karar',
    targetFile: '02_crisis_decision.png',
    accent: [239, 68, 68],  // #EF4444 Crimson Crisis
    badge: [245, 158, 11],  // #F59E0B Amber Warning
  },
  {
    sourceDir: 'se_primer_kriz_sonu_raporu',
    targetFile: '03_outcome_report.png',
    accent: [16, 185, 129], // #10B981 Emerald Safe
    badge: [59, 130, 246],  // #3B82F6 Debrief Info
  },
];

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateObsidianTerminalPng(width, height, accentRgb, badgeRgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);

  const bgPrimary = [11, 15, 25];     // #0B0F19 Obsidian Deep Slate
  const bgSurface = [17, 24, 39];     // #111827 Terminal Surface
  const bgElevated = [30, 41, 59];    // #1E293B Card / Thumb-zone Button

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // filter type 0

    for (let x = 0; x < width; x++) {
      let [r, g, b] = bgPrimary;

      // Top status header bar (0..56)
      if (y < 56) {
        [r, g, b] = bgSurface;
        if (y >= 54) [r, g, b] = accentRgb;
      }
      // Incident / Terminal Card (80..240)
      else if (y >= 80 && y <= 240 && x >= 20 && x <= width - 20) {
        [r, g, b] = bgSurface;
        if (x < 26) [r, g, b] = badgeRgb;
      }
      // Content / Telemetry Card (265..520)
      else if (y >= 265 && y <= 520 && x >= 20 && x <= width - 20) {
        [r, g, b] = bgSurface;
        if (y < 270) [r, g, b] = [51, 65, 85];
      }
      // Thumb-Zone Action Button A (560..635)
      else if (y >= 560 && y <= 635 && x >= 20 && x <= width - 20) {
        [r, g, b] = bgElevated;
        if (x < 28 || y < 563 || y > 632) [r, g, b] = accentRgb;
      }
      // Thumb-Zone Action Button B (655..730)
      else if (y >= 655 && y <= 730 && x >= 20 && x <= width - 20) {
        [r, g, b] = bgElevated;
        if (x < 28) [r, g, b] = badgeRgb;
      }
      // Socratic AI Tutor Bottom Dock (755..825)
      else if (y >= 755 && y <= 825 && x >= 20 && x <= width - 20) {
        [r, g, b] = bgSurface;
        if (x < 25) [r, g, b] = [16, 185, 129];
      }

      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend),
  ]);
}

function findFirstPngInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const nested = findFirstPngInDir(fullPath);
      if (nested) return nested;
    }
  }
  return null;
}

STITCH_MAPPING.forEach((item) => {
  const sourceFolder = path.join(__dirname, '..', item.sourceDir);
  const targetPath = path.join(SCREENS_DIR, item.targetFile);
  const existingImage = findFirstPngInDir(sourceFolder);

  if (existingImage) {
    fs.copyFileSync(existingImage, targetPath);
    console.log(`[Stitch Sync] Kopyalandı: ${existingImage} -> assets/screens/${item.targetFile}`);
  } else {
    const pngBuffer = generateObsidianTerminalPng(390, 844, item.accent, item.badge);
    fs.writeFileSync(targetPath, pngBuffer);
    console.log(`[Stitch Sync] Oluşturuldu (Obsidian Terminal 390x844): assets/screens/${item.targetFile}`);
  }
});
