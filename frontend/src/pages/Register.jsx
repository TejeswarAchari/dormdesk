import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, Home, Loader2, KeyRound, Phone } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/layout/PageTransition';
import { validateEmail, validatePhone } from '../utils/helpers';
import useAuth from '../hooks/useAuth';
import useOtp from '../hooks/useOtp';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roomNumber: '',
  });

  const { isLoading, startRegister, registerSucceeded, registerFailed } = useAuth();
  const {
    challengeId,
    otpCode,
    setOtpCode,
    requestLoading,
    resendLoading,
    resendCooldown,
    requestOtp,
    resendOtp,
    resetOtpFlow,
  } = useOtp({
    requestEndpoint: '/auth/signup/otp/request',
    resendEndpoint: '/auth/signup/otp/resend',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'email') {
      resetOtpFlow();
    }

    setFormData((previousState) => ({ ...previousState, [name]: value }));
  };

  const handleRequestSignupOtp = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Email is required to receive OTP');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    const otpResult = await requestOtp({ email: normalizedEmail });
    if (!otpResult.ok) {
      toast.error(otpResult.message);
      return;
    }

    toast.success(otpResult.data.message || 'Signup OTP sent successfully');
  };

  const handleResendSignupOtp = async () => {
    const resendResult = await resendOtp();
    if (!resendResult.ok) {
      toast.error(resendResult.message);
      return;
    }

    toast.success(resendResult.data.message || 'Signup OTP resent successfully');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { name, email, phone, password, roomNumber } = formData;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!name || !normalizedEmail || !password || !roomNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    if (normalizedPhone && !validatePhone(normalizedPhone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (!challengeId || !otpCode) {
      toast.error('OTP verification is required for signup');
      return;
    }

    startRegister();

    try {
      const { data } = await api.post('/auth/register', {
        name,
        email: normalizedEmail,
        phone: normalizedPhone || undefined,
        password,
        role: 'student',
        roomNumber,
        signupChallengeId: challengeId,
        signupOtp: otpCode.trim(),
      });

      registerSucceeded(data);
      toast.success('Account created successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      registerFailed(message);
      toast.error(message);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-16">
          <div className="hidden md:block w-1/2">
            <img src="/signupImage.png" alt="Register Illustration" className="w-full h-auto object-contain" />
          </div>

          <div className="bg-primary-50/60 backdrop-blur-md p-8 rounded-2xl w-full max-w-md border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-dark-900">Student Registration</h1>
              <p className="text-dark-800 mt-2 text-sm">Create your account to raise complaints</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <div>
                <label className="block text-sm font-medium text-dark-800 mb-1">Phone (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
              </div>

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

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleRequestSignupOtp}
                  disabled={requestLoading || Boolean(challengeId)}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
                >
                  {requestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Signup OTP'}
                </button>

                {challengeId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-dark-800 mb-1">OTP</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          maxLength={8}
                          placeholder="Enter OTP"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleResendSignupOtp}
                        disabled={resendLoading || resendCooldown > 0}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {resendLoading
                          ? 'Resending...'
                          : resendCooldown > 0
                            ? `Resend OTP in ${resendCooldown}s`
                            : 'Resend OTP'}
                      </button>

                      <button
                        type="button"
                        onClick={resetOtpFlow}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                        Use different email
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !challengeId}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all mt-6"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP & Register'}
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
