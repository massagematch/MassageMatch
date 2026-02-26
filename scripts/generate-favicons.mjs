/**
 * Generate favicon files from public/logo-source.png (square logo).
 * Output: public/favicon.ico, favicon-48.png, favicon-96.png, favicon-192.png
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp';
import toIco from 'to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const sourcePath = join(publicDir, 'logo-source.png');

async function main() {
  const sizes = [48, 96, 192];
  const buffers = {};

  for (const size of sizes) {
    const buf = await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toBuffer();
    buffers[size] = buf;
    writeFileSync(join(publicDir, `favicon-${size}.png`), buf);
    console.log(`Wrote public/favicon-${size}.png`);
  }

  const icoBuffer = await toIco([buffers[48]]);
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Wrote public/favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
