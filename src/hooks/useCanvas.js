import { useEffect, useRef, useCallback } from 'react';
import { CANVAS_W, CANVAS_H, renderCanvas } from '../utils/canvasHelper';

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

export function useCanvas({ selectedPhotos, frameColor, canvasW }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  const loadImages = useCallback(async () => {
    imagesRef.current = await Promise.all(selectedPhotos.map(loadImage));
  }, [selectedPhotos]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / CANVAS_W;
    renderCanvas(ctx, imagesRef.current, frameColor, [], scale);
  }, [frameColor, canvasW]);

  useEffect(() => {
    loadImages().then(redraw);
  }, [loadImages, redraw]);

  // stickers passed at call-time so they don't force redraw of display canvas
  const exportFullRes = useCallback(async (stickers = []) => {
    await loadImages();
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    renderCanvas(ctx, imagesRef.current, frameColor, stickers, 1, canvasW);
    return canvas;
  }, [loadImages, frameColor, canvasW]);

  return { canvasRef, redraw, exportFullRes };
}
