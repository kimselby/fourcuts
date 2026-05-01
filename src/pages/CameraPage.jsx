import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { usePhoto } from '../context/PhotoContext';
import styles from './CameraPage.module.css';

const MAX_PHOTOS = 4;

export default function CameraPage() {
  const navigate = useNavigate();
  const { videoRef, start, stop, flip, capture, error, isReady } = useCamera();
  const { capturedPhotos, setCapturedPhotos, setSelectedPhotos, reset } = usePhoto();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      reset();
      start();
    }
    return () => stop();
  }, []);

  useEffect(() => {
    if (capturedPhotos.length >= MAX_PHOTOS) {
      setSelectedPhotos([...capturedPhotos]);
      navigate('/edit');
    }
  }, [capturedPhotos.length]);

  const handleCapture = () => {
    if (capturedPhotos.length >= MAX_PHOTOS) return;
    const dataUrl = capture();
    if (dataUrl) setCapturedPhotos(prev => [...prev, dataUrl]);
  };

  if (error === 'permission') {
    return (
      <div className={styles.errorScreen}>
        <p className={styles.errorIcon}>📷</p>
        <p className={styles.errorTitle}>카메라 권한이 필요해요</p>
        <p className={styles.errorDesc}>브라우저 설정에서 카메라 접근을 허용해주세요.</p>
        <button className={styles.retryBtn} onClick={() => start()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.title}>촬영하기</span>
        <span className={styles.step}>{capturedPhotos.length} / {MAX_PHOTOS}</span>
      </header>

      <div className={styles.viewfinder}>
        <video
          ref={videoRef}
          className={styles.video}
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        {!isReady && (
          <div className={styles.loading}>카메라 연결 중...</div>
        )}
      </div>

      <div className={styles.thumbnailRow}>
        {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
          capturedPhotos[i]
            ? <img key={i} src={capturedPhotos[i]} className={styles.thumb} alt={`촬영 ${i + 1}`} />
            : <div key={i} className={styles.thumbEmpty} />
        ))}
      </div>

      <div className={styles.controls}>
        <button className={styles.flipBtn} onClick={flip} aria-label="카메라 전환">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
        <button
          className={styles.shutterBtn}
          onClick={handleCapture}
          disabled={!isReady}
          aria-label="촬영"
        />
        <div className={styles.placeholder} />
      </div>
    </div>
  );
}
