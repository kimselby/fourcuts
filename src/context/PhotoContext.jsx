import { createContext, useContext, useState } from 'react';

const PhotoContext = createContext(null);

export function PhotoProvider({ children }) {
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [frameId, setFrameId] = useState('frame-white');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [stickers, setStickers] = useState([]);

  const reset = () => {
    setCapturedPhotos([]);
    setSelectedPhotos([]);
    setFrameId('frame-white');
    setFrameColor('#FFFFFF');
    setStickers([]);
  };

  return (
    <PhotoContext.Provider value={{
      capturedPhotos, setCapturedPhotos,
      selectedPhotos, setSelectedPhotos,
      frameId, setFrameId,
      frameColor, setFrameColor,
      stickers, setStickers,
      reset,
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhoto() {
  const ctx = useContext(PhotoContext);
  if (!ctx) throw new Error('usePhoto must be used within PhotoProvider');
  return ctx;
}
