import { useRef, useState, useCallback } from 'react';
import { CELL_W, CELL_H } from '../utils/canvasHelper';

const CELL_RATIO = CELL_W / CELL_H; // 518/618 ≈ 0.838

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('user');
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const start = useCallback(async (facing = facingMode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsReady(false);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'permission' : 'unknown');
    }
  }, [facingMode]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
  }, []);

  const flip = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    start(next);
  }, [facingMode, start]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoRatio = vw / vh;

    let sw, sh, sx, sy;
    if (videoRatio > CELL_RATIO) {
      // 영상이 셀보다 가로로 넓음 → 좌우 크롭
      sh = vh;
      sw = vh * CELL_RATIO;
      sx = (vw - sw) / 2;
      sy = 0;
    } else {
      // 영상이 셀보다 세로로 긺 → 상하 크롭
      sw = vw;
      sh = vw / CELL_RATIO;
      sx = 0;
      sy = (vh - sh) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [facingMode]);

  return { videoRef, start, stop, flip, capture, facingMode, error, isReady };
}
