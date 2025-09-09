import { BrowserRouter, Routes, Route } from 'react-router-dom';

// We will create these page components in the next steps
import RegisterPage from './pages/RegisterPage'; // <-- IMPORT THIS
// import LoginPage from './pages/LoginPage';
// import MiningHub from './pages/MiningHub';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* We'll uncomment these as we build them */}
          <Route path="/register" element={<RegisterPage />} /> {/* <-- UNCOMMENT THIS */}
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/" element={<MiningHub />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;