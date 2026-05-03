import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { usePhoto } from '../context/PhotoContext';
import FloatingShapes from '../components/FloatingShapes';
import styles from './CameraPage.module.css';

const MAX_PHOTOS = 4;

export default function CameraPage() {
  const navigate = useNavigate();
  const { videoRef, start, stop, flip, capture, error, isReady } = useCamera();
  const { capturedPhotos, setCapturedPhotos, setSelectedPhotos, reset } = usePhoto();
  const hasStarted = useRef(false);
  const timersRef = useRef([]);

  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      reset();
      start();
    }
    return () => {
      stop();
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (capturedPhotos.length >= MAX_PHOTOS) {
      setSelectedPhotos([...capturedPhotos]);
      navigate('/edit');
    }
  }, [capturedPhotos.length]);

  const handleCapture = () => {
    if (countdown !== null) return;
    if (retakeIndex === null && capturedPhotos.length >= MAX_PHOTOS) return;

    const captureRetakeIdx = retakeIndex;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const doCapture = () => {
      setCountdown(null);
      setIsFlashing(true);
      timersRef.current.push(setTimeout(() => {
        const dataUrl = capture();
        if (dataUrl) {
          if (captureRetakeIdx !== null) {
            setCapturedPhotos(prev => {
              const next = [...prev];
              next[captureRetakeIdx] = dataUrl;
              return next;
            });
            setRetakeIndex(null);
          } else {
            setCapturedPhotos(prev => [...prev, dataUrl]);
          }
        }
        timersRef.current.push(setTimeout(() => setIsFlashing(false), 200));
      }, 80));
    };

    if (timerSeconds === 0) {
      doCapture();
      return;
    }

    setCountdown(timerSeconds);
    for (let i = 1; i < timerSeconds; i++) {
      timersRef.current.push(setTimeout(() => setCountdown(timerSeconds - i), i * 1000));
    }
    timersRef.current.push(setTimeout(doCapture, timerSeconds * 1000));
  };

  const handleThumbTap = (i) => {
    if (countdown !== null) return;
    if (capturedPhotos[i]) {
      setRetakeIndex(prev => prev === i ? null : i);
    } else {
      setRetakeIndex(null);
    }
  };

  const isRetakeMode = retakeIndex !== null;

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
      <FloatingShapes />

      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.brand}>Selby's Fourcuts ✦</span>
          <span className={styles.headerSub}>나만의 네컷 사진관</span>
        </div>
        <span className={`${styles.step} ${isRetakeMode ? styles.stepRetake : ''}`}>
          {isRetakeMode
            ? `재촬영 중 · ${retakeIndex + 1}번째`
            : `${capturedPhotos.length} / ${MAX_PHOTOS}`}
        </span>
      </header>

      <div className={`${styles.viewfinder} ${isRetakeMode ? styles.viewfinderRetake : ''}`}>
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
        {countdown !== null && (
          <div className={styles.countdownOverlay}>
            <div className={styles.countdownBubble}>
              <span className={styles.countdownNum} key={countdown}>{countdown}</span>
            </div>
          </div>
        )}
        {isFlashing && <div className={styles.flash} />}
      </div>

      {/* Row 1: timer chips (left) + thumbnails (right) */}
      <div className={styles.bottomRow1}>
        <div className={`${styles.timerChips} ${countdown !== null ? styles.timerChipsDisabled : ''}`}>
          {[{ label: '즉시', val: 0 }, { label: '3초', val: 3 }, { label: '5초', val: 5 }].map(({ label, val }) => (
            <button
              key={val}
              className={`${styles.timerChip} ${timerSeconds === val ? styles.timerChipActive : ''}`}
              onClick={() => setTimerSeconds(val)}
              disabled={countdown !== null}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.thumbsGroup}>
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
            capturedPhotos[i] ? (
              <div key={i} className={styles.thumbWrap} onClick={() => handleThumbTap(i)}>
                <img
                  src={capturedPhotos[i]}
                  className={`${styles.thumb} ${retakeIndex === i ? styles.thumbActive : ''}`}
                  alt={`촬영 ${i + 1}`}
                />
                <div className={`${styles.thumbOverlay} ${retakeIndex === i ? styles.thumbOverlayActive : ''}`}>
                  <span className={styles.retakeIcon}>↺</span>
                </div>
              </div>
            ) : (
              <div key={i} className={styles.thumbEmpty} onClick={() => handleThumbTap(i)} />
            )
          ))}
        </div>
      </div>

      {/* Row 2: flip (left) + shutter (center) */}
      <div className={styles.bottomRow2}>
        <button className={styles.flipBtn} onClick={flip} aria-label="카메라 전환">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
        <button
          className={styles.shutterBtn}
          onClick={handleCapture}
          disabled={!isReady || countdown !== null}
          aria-label="촬영"
        />
        <div />
      </div>
    </div>
  );
}
