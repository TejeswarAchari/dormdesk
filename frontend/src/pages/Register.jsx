import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Home, Loader2 } from 'lucide-react';
import api from '../services/api';
import { registerStart, registerSuccess, registerFailure } from '../features/auth/authSlice';
import PageTransition from '../components/layout/PageTransition';
import { validateEmail } from '../utils/helpers';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roomNumber: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, roomNumber } = formData;

    if (!name || !email || !password || !roomNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email');
      return;
    }

    dispatch(registerStart());

    try {
      // FORCE ROLE TO STUDENT
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'student', 
        roomNumber
      });

      dispatch(registerSuccess(data));
      toast.success('Account created successfully!');
      navigate('/student-dashboard');

    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch(registerFailure(message));
      toast.error(message);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-16">
        
        {/* Left Image Section */}
        <div className="hidden md:block w-1/2">
           <img src="/signupImage.png" alt="Register Illustration" className="w-full h-auto object-contain" />
        </div>

        {/* Form Card */}
        <div className="bg-primary-50/60 backdrop-blur-md p-8 rounded-2xl w-full max-w-md border border-white/20 ">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-dark-900">Student Registration</h1>
            <p className="text-dark-800 mt-2 text-sm">Create your account to raise complaints</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Room Number (Always Visible) */}
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">Room Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. A-101"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all mt-6"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Login
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;