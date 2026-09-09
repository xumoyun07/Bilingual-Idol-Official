import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPng(width, height, drawFn) {
  // Create RGBA raw buffer with 1 filter byte per row
  const rowBytes = 1 + width * 4;
  const raw = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk("IHDR", ihdrData);

  // IDAT
  const idatChunk = makeChunk("IDAT", compressed);

  // IEND
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Icon generator with BILC brand colors (Navy #10253E, Gold #E5A93C, Accent #173FAD)
function drawBILCIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = w * 0.48;

  // Background: Rich Deep Navy Gradient
  const grad = (y / h) * 0.15;
  let r = Math.round(16 + grad * 10);
  let g = Math.round(37 + grad * 15);
  let b = Math.round(62 + grad * 35);
  let a = 255;

  // Outer circular ring
  const ringR = w * (isMaskable ? 0.38 : 0.42);
  const ringThick = w * 0.025;
  if (Math.abs(dist - ringR) < ringThick) {
    // Gold ring #E5A93C
    r = 229; g = 169; b = 60;
  }

  // Inner subtle star/diamond beacon
  const diamondDist = Math.abs(dx) + Math.abs(dy);
  if (diamondDist < w * 0.28 && diamondDist > w * 0.26) {
    r = 243; g = 181; b = 159; // Coral gold accent
  }

  // Center crest emblem: Stylized B and I
  // Box for central glyph
  const boxW = w * 0.24;
  const boxH = h * 0.24;
  if (Math.abs(dx) < boxW && Math.abs(dy) < boxH) {
    // Left vertical bar of B
    if (dx >= -boxW * 0.75 && dx <= -boxW * 0.45 && Math.abs(dy) <= boxH * 0.75) {
      r = 255; g = 255; b = 255;
    }
    // Top bar of B
    if (dx >= -boxW * 0.75 && dx <= boxW * 0.1 && dy >= -boxH * 0.75 && dy <= -boxH * 0.5) {
      r = 255; g = 255; b = 255;
    }
    // Middle bar of B
    if (dx >= -boxW * 0.75 && dx <= boxW * 0.1 && Math.abs(dy) <= boxH * 0.12) {
      r = 255; g = 255; b = 255;
    }
    // Bottom bar of B
    if (dx >= -boxW * 0.75 && dx <= boxW * 0.1 && dy >= boxH * 0.5 && dy <= boxH * 0.75) {
      r = 255; g = 255; b = 255;
    }
    // Right curve of B (top)
    if (dx >= boxW * 0.1 && dx <= boxW * 0.35 && dy >= -boxH * 0.75 && dy <= -boxH * 0.05) {
      r = 255; g = 255; b = 255;
    }
    // Right curve of B (bottom)
    if (dx >= boxW * 0.1 && dx <= boxW * 0.35 && dy >= 0.05 && dy <= boxH * 0.75) {
      r = 255; g = 255; b = 255;
    }
    // Right star beacon dot (Gold)
    const sDx = dx - boxW * 0.55;
    const sDy = dy;
    if (Math.sqrt(sDx * sDx + sDy * sDy) < boxW * 0.18) {
      r = 229; g = 169; b = 60;
    }
  }

  // Rounded corners for standard icon if not maskable
  if (!isMaskable) {
    const cornerRadius = w * 0.18;
    const innerX = Math.max(0, Math.abs(dx) - (w / 2 - cornerRadius));
    const innerY = Math.max(0, Math.abs(dy) - (h / 2 - cornerRadius));
    if (Math.sqrt(innerX * innerX + innerY * innerY) > cornerRadius) {
      return [0, 0, 0, 0];
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(import.meta.dirname, "../client/public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
console.log("Generating PWA icons...");
fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), createPng(192, 192, (x, y, w, h) => drawBILCIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), createPng(512, 512, (x, y, w, h) => drawBILCIcon(x, y, w, h, false)));
fs.writeFileSync(path.join(publicDir, "pwa-maskable-512x512.png"), createPng(512, 512, (x, y, w, h) => drawBILCIcon(x, y, w, h, true)));
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), createPng(180, 180, (x, y, w, h) => drawBILCIcon(x, y, w, h, false)));

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10253E"/>
      <stop offset="100%" stop-color="#193B63"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7D070"/>
      <stop offset="100%" stop-color="#D99B26"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="url(#gold)" stroke-width="12" opacity="0.85"/>
  <circle cx="256" cy="256" r="175" fill="none" stroke="#F3B59F" stroke-width="2" stroke-dasharray="8 8" opacity="0.6"/>
  <path d="M190 160 H260 C295 160 315 178 315 205 C315 222 305 238 285 246 C310 254 325 272 325 305 C325 338 295 352 260 352 H190 Z M225 195 V240 H255 C275 240 282 230 282 218 C282 205 275 195 255 195 Z M225 272 V317 H260 C280 317 290 307 290 294 C290 282 280 272 260 272 Z" fill="#FFFFFF"/>
  <polygon points="360,230 367,247 385,247 371,257 376,274 360,263 344,274 349,257 335,247 353,247" fill="url(#gold)"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, "icon.svg"), svgContent, "utf-8");

console.log("PWA icons generated successfully!");
