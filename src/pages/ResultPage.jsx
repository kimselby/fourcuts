import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePhoto } from '../context/PhotoContext';
import { downloadCanvas } from '../utils/downloadHelper';
import styles from './ResultPage.module.css';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reset } = usePhoto();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dataUrl = location.state?.canvasDataUrl;

  useEffect(() => {
    if (!dataUrl) navigate('/');
  }, []);

  const handleDownload = async () => {
    if (!dataUrl) return;
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = dataUrl; });
      ctx.drawImage(img, 0, 0);
      await downloadCanvas(canvas);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    reset();
    navigate('/');
  };

  if (!dataUrl) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.title}>완성!</span>
        <span className={styles.step}>3 / 3</span>
      </header>

      <div className={styles.preview}>
        <img src={dataUrl} className={styles.result} alt="완성된 네컷" />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={saving}
        >
          {saving ? '저장 중...' : saved ? '다시 저장하기' : '저장하기'}
        </button>
        <button className={styles.retakeBtn} onClick={handleRetake}>
          다시 찍기
        </button>
      </div>
    </div>
  );
}
