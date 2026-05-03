export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

const PAD = 16;
const GAP = 12;
const STRIP_H = 70;
export const CELL_W = (CANVAS_W - PAD * 2 - GAP) / 2; // 518
export const CELL_H = (CANVAS_H - STRIP_H - PAD * 2 - GAP) / 2; // 618

export const LAYOUT = {
  cells: [
    { x: PAD,                  y: PAD,                  w: CELL_W, h: CELL_H },
    { x: PAD + CELL_W + GAP,   y: PAD,                  w: CELL_W, h: CELL_H },
    { x: PAD,                  y: PAD + CELL_H + GAP,   w: CELL_W, h: CELL_H },
    { x: PAD + CELL_W + GAP,   y: PAD + CELL_H + GAP,   w: CELL_W, h: CELL_H },
  ],
  stripY: PAD + CELL_H * 2 + GAP + PAD,
};

export function drawCoverImage(ctx, img, x, y, w, h) {
  const imgAspect = img.width / img.height;
  const cellAspect = w / h;
  let sx, sy, sw, sh;
  if (imgAspect > cellAspect) {
    sh = img.height;
    sw = img.height * cellAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width / cellAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// stickers: array of { text, x, y, fontSize, color, fontWeight }
//   x, y are in display-canvas px space (0..canvasDisplayW / 0..canvasDisplayH)
// canvasDisplayW: the display canvas width used when placing stickers
export function renderCanvas(ctx, images, frameColor, stickers = [], scale = 1, canvasDisplayW = CANVAS_W) {
  const { cells, stripY } = LAYOUT;
  const cw = CANVAS_W * scale;
  const ch = CANVAS_H * scale;

  ctx.fillStyle = frameColor;
  ctx.fillRect(0, 0, cw, ch);

  images.forEach((img, i) => {
    if (!img || !cells[i]) return;
    const c = cells[i];
    drawCoverImage(ctx, img, c.x * scale, c.y * scale, c.w * scale, c.h * scale);
  });

  // Bottom strip
  const stripMidY = (stripY + (CANVAS_H - stripY) / 2) * scale;
  ctx.font = `${22 * scale}px -apple-system, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#aaaaaa';
  ctx.textAlign = 'left';
  ctx.fillText('DUAI', (PAD + 4) * scale, stripMidY);
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  ctx.fillStyle = '#aaaaaa';
  ctx.textAlign = 'right';
  ctx.fillText(date, (CANVAS_W - PAD - 4) * scale, stripMidY);

  // Sticker text (used for full-res export)
  if (stickers.length === 0) return;
  const sScale = (scale * CANVAS_W) / canvasDisplayW;
  stickers.forEach(({ text, x, y, fontSize, color, fontWeight }) => {
    ctx.save();
    ctx.font = `${fontWeight || '700'} ${(fontSize || 20) * sScale}px Pretendard, -apple-system, sans-serif`;
    ctx.fillStyle = color || '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4 * sScale;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(text, x * sScale, y * sScale);
    ctx.restore();
  });
}
