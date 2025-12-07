import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Login from './pages/login';

function App() {
  const token = localStorage.getItem('adminToken');

  return (
    <BrowserRouter>
      <Routes>
        {/* If already logged in → go to dashboard */}
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        
        {/* Login page */}
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;