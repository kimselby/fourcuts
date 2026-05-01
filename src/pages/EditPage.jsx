import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhoto } from '../context/PhotoContext';
import { useCanvas } from '../hooks/useCanvas';
import { CANVAS_H, CANVAS_W, LAYOUT } from '../utils/canvasHelper';
import styles from './EditPage.module.css';

const FRAMES = [
  { id: 'frame-black', label: '블랙', bg: '#1a1a1a' },
  { id: 'frame-white', label: '화이트', bg: '#FFFFFF' },
  { id: 'frame-blue',  label: '블루',  bg: '#10069F' },
];

export default function EditPage() {
  const navigate = useNavigate();
  const {
    selectedPhotos, setSelectedPhotos,
    frameId, setFrameId, frameColor, setFrameColor,
    texts, setTexts,
  } = usePhoto();

  const [canvasW, setCanvasW] = useState(300);
  const containerRef = useRef(null);

  // drag state — refs for global handlers, state for rendering
  const dragSrcRef = useRef(null);
  const dragOverRef = useRef(null);
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [textModal, setTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  const { canvasRef, exportFullRes } = useCanvas({ selectedPhotos, frameColor, texts, canvasW });

  useEffect(() => {
    if (selectedPhotos.length === 0) navigate('/');
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setCanvasW(containerRef.current.offsetWidth - 32);
    }
  }, []);

  const canvasH = Math.round(canvasW * (CANVAS_H / CANVAS_W));
  const scaleX = canvasW / CANVAS_W;
  const scaleY = canvasH / CANVAS_H;

  const hitCell = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const cx = (clientX - rect.left) * (CANVAS_W / rect.width);
    const cy = (clientY - rect.top) * (CANVAS_H / rect.height);
    return LAYOUT.cells.findIndex(c =>
      cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h
    );
  };

  const getXY = (e) => {
    const src = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
    return { clientX: src.clientX, clientY: src.clientY };
  };

  const clearDrag = () => {
    dragSrcRef.current = null;
    dragOverRef.current = null;
    setDragSrc(null);
    setDragOver(null);
    setGhostPos(null);
  };

  // global move + up handlers while dragging
  useEffect(() => {
    if (dragSrc === null) return;

    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const { clientX, clientY } = getXY(e);
      setGhostPos({ x: clientX, y: clientY });
      const idx = hitCell(clientX, clientY);
      const next = idx === -1 ? null : idx;
      dragOverRef.current = next;
      setDragOver(next);
    };

    const onUp = () => {
      const src = dragSrcRef.current;
      const over = dragOverRef.current;
      if (src !== null && over !== null && src !== over) {
        setSelectedPhotos(prev => {
          const next = [...prev];
          [next[src], next[over]] = [next[over], next[src]];
          return next;
        });
      }
      clearDrag();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragSrc]);

  const onPointerDown = (e) => {
    e.preventDefault();
    const { clientX, clientY } = getXY(e);
    const idx = hitCell(clientX, clientY);
    if (idx !== -1) {
      dragSrcRef.current = idx;
      setDragSrc(idx);
      setGhostPos({ x: clientX, y: clientY });
      setShowTooltip(false);
    }
  };

  const handleFrameSelect = (f) => {
    setFrameId(f.id);
    setFrameColor(f.bg);
  };

  const addText = () => {
    if (!textInput.trim()) return;
    setTexts(prev => [...prev, {
      id: Date.now(),
      text: textInput.trim(),
      x: 40,
      y: 1200,
      fontSize: 36,
      color: frameColor === '#FFFFFF' ? '#1a1a1a' : '#ffffff',
    }]);
    setTextInput('');
    setTextModal(false);
  };

  const removeText = (id) => setTexts(prev => prev.filter(t => t.id !== id));

  const handleSave = async () => {
    const canvas = await exportFullRes();
    navigate('/result', { state: { canvasDataUrl: canvas.toDataURL('image/jpeg', 0.92) } });
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className={styles.title}>편집하기</span>
        <span className={styles.step}>2 / 3</span>
      </header>

      <div className={styles.canvasArea} ref={containerRef}>
        <div
          className={styles.canvasWrap}
          style={{ width: canvasW, height: canvasH }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <canvas ref={canvasRef} width={canvasW} height={canvasH} className={styles.canvas} />

          {LAYOUT.cells.map((cell, i) => (
            <div
              key={i}
              className={[
                styles.cellOverlay,
                dragSrc === i ? styles.cellSrc : '',
                dragOver === i && dragSrc !== i ? styles.cellTarget : '',
              ].join(' ')}
              style={{
                left: cell.x * scaleX,
                top: cell.y * scaleY,
                width: cell.w * scaleX,
                height: cell.h * scaleY,
              }}
            />
          ))}

          {showTooltip && dragSrc === null && (
            <div className={styles.tooltip}>
              드래그해서 사진 순서를 바꿀 수 있어요
              <span className={styles.tooltipArrow} />
            </div>
          )}
        </div>
      </div>

      {/* ghost image follows pointer */}
      {dragSrc !== null && ghostPos && (
        <img
          src={selectedPhotos[dragSrc]}
          className={styles.ghost}
          style={{ left: ghostPos.x, top: ghostPos.y }}
          alt=""
        />
      )}

      <div className={styles.toolbar}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>프레임 색상</p>
          <div className={styles.frameRow}>
            {FRAMES.map(f => (
              <button
                key={f.id}
                className={`${styles.frameSwatch} ${frameId === f.id ? styles.activeFrame : ''}`}
                style={{ background: f.bg, border: f.bg === '#FFFFFF' ? '1px solid #ddd' : 'none' }}
                onClick={() => handleFrameSelect(f)}
              />
            ))}
            <label className={`${styles.frameSwatch} ${styles.colorPicker}`}>
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              />
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>+</span>
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>텍스트</p>
          <div className={styles.textList}>
            {texts.map(t => (
              <div key={t.id} className={styles.textItem}>
                <span className={styles.textPreview}>{t.text}</span>
                <button className={styles.textRemove} onClick={() => removeText(t.id)}>×</button>
              </div>
            ))}
          </div>
          <button className={styles.textBtn} onClick={() => setTextModal(true)}>+ 텍스트 추가</button>
        </div>
      </div>

      <button className={styles.saveBtn} onClick={handleSave}>완성하기</button>

      {textModal && (
        <div className={styles.modalOverlay} onClick={() => setTextModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>텍스트 추가</p>
            <input
              className={styles.modalInput}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="텍스트를 입력하세요"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addText()}
            />
            <div className={styles.modalBtns}>
              <button className={styles.modalCancel} onClick={() => setTextModal(false)}>취소</button>
              <button className={styles.modalConfirm} onClick={addText}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
