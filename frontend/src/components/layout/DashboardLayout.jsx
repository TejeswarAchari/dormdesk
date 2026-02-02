import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User } from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DashboardLayout = ({ children, title }) => {
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout API errors to avoid blocking UI logout
    } finally {
      dispatch(logout()); // 1. Clear Redux State
      toast.success('Logged out successfully');
      navigate('/login'); // 2. Redirect to Login
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-primary-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
          {/* Logo & Title Section */}
<div className="flex items-center gap-2 sm:gap-4">
  <div className="flex-shrink-0 flex items-center">
    <img
      src="/logo.png"
      alt="DormDesk Logo"
      className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain"
    />
  </div>

  {/* Page Title Divider (Vertical Line) */}
  <div className="hidden md:block h-6 w-px bg-gray-300"></div>

  <h2 className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-dark-800">
    {title}
  </h2>
</div>


            {/* Right Side: User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {userInfo?.name || 'User'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-slide-up">
          {children}
        </div>
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="text-center text-sm text-gray-500">
          © 2026 Dormdesk All rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;