import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PhotoProvider } from './context/PhotoContext';
import CameraPage from './pages/CameraPage';
import EditPage from './pages/EditPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <PhotoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CameraPage />} />
          <Route path="/edit" element={<EditPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </BrowserRouter>
    </PhotoProvider>
  );
}
