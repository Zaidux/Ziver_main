import { BrowserRouter, Routes, Route } from 'react-router-dom';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage'; // <-- IMPORT THIS
// import MiningHub from './pages/MiningHub';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} /> {/* <-- UNCOMMENT THIS */}
          {/* <Route path="/" element={<MiningHub />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;