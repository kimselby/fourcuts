import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhoto } from '../context/PhotoContext';
import styles from './SelectPage.module.css';

export default function SelectPage() {
  const navigate = useNavigate();
  const { capturedPhotos, setSelectedPhotos } = usePhoto();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (capturedPhotos.length === 0) navigate('/');
  }, []);

  const toggle = (src) => {
    setSelected(prev => {
      const idx = prev.indexOf(src);
      if (idx !== -1) return prev.filter(s => s !== src);
      if (prev.length >= 4) return prev;
      return [...prev, src];
    });
  };

  const handleNext = () => {
    setSelectedPhotos(selected);
    navigate('/edit');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className={styles.title}>사진 선택</span>
        <span className={styles.step}>2 / 4</span>
      </header>

      <p className={styles.hint}>네컷에 넣을 사진 4장을 선택하세요 ({selected.length}/4)</p>

      <div className={styles.grid}>
        {capturedPhotos.map((src, i) => {
          const orderIdx = selected.indexOf(src);
          const isSelected = orderIdx !== -1;
          return (
            <button key={i} className={styles.cell} onClick={() => toggle(src)}>
              <img src={src} className={styles.photo} alt={`사진 ${i + 1}`} />
              {isSelected && (
                <div className={styles.badge}>{orderIdx + 1}</div>
              )}
              {isSelected && <div className={styles.overlay} />}
            </button>
          );
        })}
      </div>

      <button
        className={styles.nextBtn}
        onClick={handleNext}
        disabled={selected.length !== 4}
      >
        다음
      </button>
    </div>
  );
}
