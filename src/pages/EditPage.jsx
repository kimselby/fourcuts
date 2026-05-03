import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhoto } from '../context/PhotoContext';
import { useCanvas } from '../hooks/useCanvas';
import { CANVAS_H, CANVAS_W, LAYOUT } from '../utils/canvasHelper';
import { downloadCanvas } from '../utils/downloadHelper';
import FloatingShapes from '../components/FloatingShapes';
import styles from './EditPage.module.css';

const FRAMES = [
  { id: 'frame-black',  label: '블랙',       bg: '#2C2330' },
  { id: 'frame-white',  label: '화이트',     bg: '#FFFFFF' },
  { id: 'frame-purple', label: '브랜드 퍼플', bg: '#7C6FF7' },
  { id: 'frame-coral',  label: '코랄',       bg: '#FF7B6B' },
  { id: 'frame-mint',   label: '민트',       bg: '#4CC9B0' },
];

const FONT_SIZES = [
  { label: 'S', size: 16 },
  { label: 'M', size: 20 },
  { label: 'L', size: 28 },
];

const STICKER_COLORS = ['#FFFFFF', '#2C2330', '#7C6FF7', '#FF7B6B', '#4CC9B0'];

export default function EditPage() {
  const navigate = useNavigate();
  const {
    selectedPhotos, setSelectedPhotos,
    frameId, setFrameId, frameColor, setFrameColor,
    stickers, setStickers, reset,
  } = usePhoto();

  const [canvasW, setCanvasW] = useState(300);
  const containerRef = useRef(null);

  // Photo drag state
  const dragSrcRef = useRef(null);
  const dragOverRef = useRef(null);
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sticker state
  const stickerDragRef = useRef(null);
  const [selectedSticker, setSelectedSticker] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sticker modal state
  const [stickerModal, setStickerModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalFontSize, setModalFontSize] = useState(20);
  const [modalColor, setModalColor] = useState('#FFFFFF');

  const { canvasRef, exportFullRes } = useCanvas({ selectedPhotos, frameColor, canvasW });

  useEffect(() => {
    if (selectedPhotos.length === 0) navigate('/');
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setCanvasW(containerRef.current.offsetWidth - 40);
    }
  }, []);

  const canvasH = Math.round(canvasW * (CANVAS_H / CANVAS_W));
  const scaleX = canvasW / CANVAS_W;
  const scaleY = canvasH / CANVAS_H;

  // ── Photo drag ──
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

  useEffect(() => {
    if (dragSrc === null) return;
    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const { clientX, clientY } = getXY(e);
      setGhostPos({ x: clientX, y: clientY });
      const idx = hitCell(clientX, clientY);
      dragOverRef.current = idx === -1 ? null : idx;
      setDragOver(idx === -1 ? null : idx);
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
    if (stickerDragRef.current) return;
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

  // ── Sticker drag ──
  useEffect(() => {
    const onMove = (e) => {
      if (!stickerDragRef.current) return;
      if (e.cancelable) e.preventDefault();
      const { clientX, clientY } = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
      const { id, startX, startY, origX, origY, stickerW, stickerH } = stickerDragRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const newX = Math.max(0, Math.min(rect.width - stickerW, origX + (clientX - startX)));
      const newY = Math.max(0, Math.min(rect.height - stickerH, origY + (clientY - startY)));
      setStickers(prev => prev.map(s => s.id === id ? { ...s, x: newX, y: newY } : s));
    };
    const onUp = () => { stickerDragRef.current = null; };
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
  }, []);

  const handleStickerPointerDown = (e, sticker) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX, clientY } = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
    const el = e.currentTarget;
    stickerDragRef.current = {
      id: sticker.id,
      startX: clientX,
      startY: clientY,
      origX: sticker.x,
      origY: sticker.y,
      stickerW: el.offsetWidth,
      stickerH: el.offsetHeight,
    };
    setSelectedSticker(sticker.id);
  };

  const deleteSticker = (id) => setStickers(prev => prev.filter(s => s.id !== id));

  // ── Frame ──
  const handleFrameSelect = (f) => {
    setFrameId(f.id);
    setFrameColor(f.bg);
  };

  // ── Sticker modal ──
  const addSticker = () => {
    if (!modalText.trim()) return;
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 - 40 : 100;
    const cy = canvas ? canvas.height / 2 - 20 : 150;
    setStickers(prev => [...prev, {
      id: String(Date.now()),
      text: modalText.trim(),
      x: cx,
      y: cy,
      fontSize: modalFontSize,
      color: modalColor,
      fontWeight: '700',
    }]);
    setModalText('');
    setStickerModal(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const canvas = await exportFullRes(stickers);
      await downloadCanvas(canvas);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <FloatingShapes />

      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => { reset(); navigate('/'); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span className={styles.title}>편집 & 저장</span>
        <span className={styles.step}>2 / 2</span>
      </header>

      <div className={styles.canvasArea} ref={containerRef}>
        <div
          className={styles.canvasWrap}
          style={{ width: canvasW, height: canvasH }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setSelectedSticker(null)}
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

          {showTooltip && dragSrc === null && selectedSticker === null && (
            <div className={styles.tooltip}>
              드래그해서 사진 순서를 바꿀 수 있어요
              <span className={styles.tooltipArrow} />
            </div>
          )}

          {stickers.map(sticker => {
            const isSelected = selectedSticker === sticker.id;
            return (
              <div
                key={sticker.id}
                className={`${styles.sticker} ${isSelected ? styles.stickerSelected : ''}`}
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  fontSize: sticker.fontSize,
                  color: sticker.color,
                  fontWeight: sticker.fontWeight,
                }}
                onMouseDown={(e) => handleStickerPointerDown(e, sticker)}
                onTouchStart={(e) => handleStickerPointerDown(e, sticker)}
                onClick={(e) => { e.stopPropagation(); setSelectedSticker(sticker.id); }}
              >
                <span className={styles.stickerText}>{sticker.text}</span>
                {isSelected && (
                  <button
                    className={styles.stickerDelete}
                    onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dragSrc !== null && ghostPos && (
        <img
          src={selectedPhotos[dragSrc]}
          className={styles.ghost}
          style={{ left: ghostPos.x, top: ghostPos.y }}
          alt=""
        />
      )}

      <div className={styles.toolbar}>
        <div className={styles.controlRow}>
          <div className={styles.frameRow}>
            {FRAMES.map(f => {
              const isActive = frameId === f.id;
              const isWhite = f.bg === '#FFFFFF';
              return (
                <button
                  key={f.id}
                  className={`${styles.frameSwatch} ${isActive ? styles.activeFrame : ''}`}
                  style={{
                    background: f.bg,
                    border: isWhite ? '1.5px solid #E2DCF5' : 'none',
                    outline: isActive ? `3px solid ${isWhite ? '#E2DCF5' : f.bg}` : undefined,
                    outlineOffset: isActive ? '3px' : undefined,
                  }}
                  onClick={() => handleFrameSelect(f)}
                />
              );
            })}
            <label className={`${styles.frameSwatch} ${styles.colorPicker}`}>
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
              />
              <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>+</span>
            </label>
          </div>
          <button className={styles.stickerBtn} onClick={() => setStickerModal(true)}>
            + 텍스트 추가
          </button>
        </div>
      </div>

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? '저장 중...' : saved ? '다시 저장하기' : '저장하기'}
      </button>

      {stickerModal && (
        <div className={styles.modalOverlay} onClick={() => setStickerModal(false)}>
          <div className={styles.modalSheet} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>텍스트 추가</p>
            <input
              className={styles.modalInput}
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              placeholder="텍스트를 입력하세요"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addSticker()}
            />
            <div className={styles.modalOptions}>
              <p className={styles.modalOptionLabel}>크기</p>
              <div className={styles.fontSizeRow}>
                {FONT_SIZES.map(({ label, size }) => (
                  <button
                    key={size}
                    className={`${styles.fontSizeBtn} ${modalFontSize === size ? styles.fontSizeBtnActive : ''}`}
                    onClick={() => setModalFontSize(size)}
                  >{label}</button>
                ))}
              </div>
              <p className={styles.modalOptionLabel}>색상</p>
              <div className={styles.colorRow}>
                {STICKER_COLORS.map(c => {
                  const isWhite = c === '#FFFFFF';
                  const isActive = modalColor === c;
                  return (
                    <button
                      key={c}
                      className={`${styles.colorDot} ${isActive ? styles.colorDotActive : ''}`}
                      style={{
                        background: c,
                        border: isWhite ? '1.5px solid #E2DCF5' : 'none',
                        outline: isActive ? `3px solid ${isWhite ? '#E2DCF5' : c}` : undefined,
                        outlineOffset: isActive ? '3px' : undefined,
                      }}
                      onClick={() => setModalColor(c)}
                    />
                  );
                })}
              </div>
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.modalCancel} onClick={() => setStickerModal(false)}>취소</button>
              <button className={styles.modalConfirm} onClick={addSticker}>추가하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
