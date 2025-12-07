import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import Login from './pages/login';

function App() {
  // IMPORTANT: Don't check localStorage in App.jsx on initial render
  // It causes hydration mismatch on server vs client
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;