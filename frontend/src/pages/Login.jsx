import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, Loader2, KeyRound } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { validateEmail } from '../utils/helpers';
import useAuth from '../hooks/useAuth';
import useLogin from '../hooks/useLogin';
import useOtp from '../hooks/useOtp';

const Login = () => {
  const [mode, setMode] = useState('password');
  const [otpEmail, setOtpEmail] = useState('');

  const { isLoading, startLogin, loginSucceeded, loginFailed } = useAuth();
  const { email, password, setEmail, setPassword, submitPasswordLogin } = useLogin();
  const {
    challengeId,
    otpCode,
    setOtpCode,
    requestLoading,
    verifyLoading,
    resendLoading,
    resendCooldown,
    requestOtp,
    verifyOtp,
    resendOtp,
    resetOtpFlow,
  } = useOtp({
    requestEndpoint: '/auth/otp/request',
    resendEndpoint: '/auth/otp/resend',
    verifyEndpoint: '/auth/otp/verify',
  });

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    startLogin();

    const loginResult = await submitPasswordLogin();
    if (!loginResult.ok) {
      loginFailed(loginResult.message);
      toast.error(loginResult.message);
      return;
    }

    loginSucceeded(loginResult.data);
    toast.success(`Welcome back, ${loginResult.data.name}!`);
  };

  const handleRequestOtp = async () => {
    const normalizedEmail = otpEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Email is required');
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

    setOtpEmail(normalizedEmail);
    toast.success(otpResult.data.message || 'OTP sent successfully');
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!challengeId) {
      toast.error('Request OTP first');
      return;
    }

    const normalizedOtp = otpCode.trim();
    if (!/^\d{4,8}$/.test(normalizedOtp)) {
      toast.error('Enter a valid OTP');
      return;
    }

    const verificationResult = await verifyOtp({
      challengeId,
      otp: normalizedOtp,
    });

    if (!verificationResult.ok) {
      loginFailed(verificationResult.message);
      toast.error(verificationResult.message);
      return;
    }

    loginSucceeded(verificationResult.data);
    toast.success(`Welcome back, ${verificationResult.data.name}!`);
  };

  const handleResendOtp = async () => {
    const resendResult = await resendOtp();
    if (!resendResult.ok) {
      toast.error(resendResult.message);
      return;
    }

    toast.success(resendResult.data.message || 'OTP resent successfully');
  };

  const handleResetOtpFlow = () => {
    resetOtpFlow();
    setOtpEmail('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-start gap-16">
          <div className="hidden md:block w-1/2">
            <img
              src="/loginPage.png"
              alt="Login Illustration"
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="bg-primary-50/60 backdrop-blur-md p-8 rounded-2xl w-full max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center rounded-full">
                <img
                  src="/logo-theme.png"
                  alt="DormDesk Logo"
                  className="w-70 h-40 object-contain"
                />
              </div>

              <h1 className="text-2xl font-bold text-dark-900">Login to HostelCMS</h1>
              <p className="text-dark-800 mt-2 text-sm">Welcome back! Please enter your details.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-primary-100/60 mb-6">
              <button
                type="button"
                onClick={() => setMode('password')}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'password'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-dark-700 hover:text-dark-900'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setMode('otp')}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'otp'
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-dark-700 hover:text-dark-900'
                }`}
              >
                OTP Login
              </button>
            </div>

            {mode === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-800 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-800 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-800 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your email"
                      value={otpEmail}
                      disabled={Boolean(challengeId)}
                      onChange={(event) => setOtpEmail(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={requestLoading || Boolean(challengeId)}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {requestLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                </button>

                {challengeId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-dark-800 mb-2">OTP</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyRound className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          maxLength={8}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="Enter OTP"
                          value={otpCode}
                          onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {verifyLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Verify OTP & Login'
                      )}
                    </button>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleResendOtp}
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
                        onClick={handleResetOtpFlow}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                        Use different email
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
