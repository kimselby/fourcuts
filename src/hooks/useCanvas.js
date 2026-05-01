import { useEffect, useRef, useCallback } from 'react';
import { CANVAS_W, CANVAS_H, renderCanvas } from '../utils/canvasHelper';

export function useCanvas({ selectedPhotos, frameColor, texts, canvasW }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);

  const loadImages = useCallback(async () => {
    imagesRef.current = await Promise.all(
      selectedPhotos.map(src => new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      }))
    );
  }, [selectedPhotos]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / CANVAS_W;
    renderCanvas(ctx, imagesRef.current, frameColor, texts, scale);
  }, [frameColor, texts, canvasW]); // canvasW 변경 시 canvas가 초기화되므로 재드로우 트리거

  useEffect(() => {
    loadImages().then(redraw);
  }, [loadImages, redraw]);

  const exportFullRes = useCallback(async () => {
    await loadImages();
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    renderCanvas(ctx, imagesRef.current, frameColor, texts, 1);
    return canvas;
  }, [loadImages, frameColor, texts]);

  return { canvasRef, redraw, exportFullRes };
}
