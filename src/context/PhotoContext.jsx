import { createContext, useContext, useState } from 'react';

const PhotoContext = createContext(null);

export function PhotoProvider({ children }) {
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [frameId, setFrameId] = useState('frame-white');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [texts, setTexts] = useState([]);

  const reset = () => {
    setCapturedPhotos([]);
    setSelectedPhotos([]);
    setFrameId('frame-white');
    setFrameColor('#FFFFFF');
    setTexts([]);
  };

  return (
    <PhotoContext.Provider value={{
      capturedPhotos, setCapturedPhotos,
      selectedPhotos, setSelectedPhotos,
      frameId, setFrameId,
      frameColor, setFrameColor,
      texts, setTexts,
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
