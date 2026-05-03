import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PhotoProvider } from './context/PhotoContext';
import CameraPage from './pages/CameraPage';
import EditPage from './pages/EditPage';

export default function App() {
  return (
    <PhotoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CameraPage />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </BrowserRouter>
    </PhotoProvider>
  );
}
