import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import ErrorBoundary from './components/common/ErrorBoundary';

// Components
import ProtectedRoute from './components/layout/ProtectedRoute'; 

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CaretakerDashboard from './pages/CaretakerDashboard';
import NotFound from './pages/NotFound';

function App() {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-center" reverseOrder={false} />

        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              userInfo ? (
                <Navigate to={userInfo.role === 'student' ? "/student-dashboard" : "/caretaker-dashboard"} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- PROTECTED ROUTES --- */}
          
          {/* Student Dashboard: Only accessible by 'student' */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Caretaker Dashboard: Only accessible by 'caretaker' */}
          <Route 
            path="/caretaker-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['caretaker']}>
                <CaretakerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;