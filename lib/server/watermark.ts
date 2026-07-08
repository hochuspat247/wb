import sharp from "sharp";

export async function addWatermarkToImageBuffer(originalBuffer: Buffer) {
  const image = sharp(originalBuffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 1500;
  const watermark = buildWatermarkSvg(width, height);

  return image
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .composite([{ input: Buffer.from(watermark), blend: "over" }])
    .png()
    .toBuffer();
}

function buildWatermarkSvg(width: number, height: number) {
  const stepX = Math.max(220, Math.round(width / 3));
  const stepY = Math.max(160, Math.round(height / 5));
  const fontSize = Math.max(42, Math.round(width / 12));
  const labels: string[] = [];

  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      labels.push(`<text x="${x}" y="${y}" class="demo-mark">DEMO</text>`);
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .demo-mark {
          fill: #f8fafc;
          fill-opacity: 0.13;
          font-family: Arial, Helvetica, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 900;
          letter-spacing: 8px;
        }
      </style>
      <g transform="rotate(-32 ${width / 2} ${height / 2})">
        ${labels.join("")}
      </g>
    </svg>
  `;
}
