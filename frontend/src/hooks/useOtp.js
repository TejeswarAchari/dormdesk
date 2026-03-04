import { useEffect, useState } from 'react';
import api from '../services/api';

const useOtp = ({ requestEndpoint, resendEndpoint, verifyEndpoint }) => {
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setResendCooldown((currentValue) => {
        if (currentValue <= 1) {
          clearInterval(timerId);
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [resendCooldown]);

  const resetOtpFlow = () => {
    setChallengeId('');
    setOtpCode('');
    setResendCooldown(0);
  };

  const requestOtp = async (payload) => {
    try {
      setRequestLoading(true);

      const { data } = await api.post(requestEndpoint, payload);
      setChallengeId(data.challengeId);
      setOtpCode('');
      setResendCooldown(Number(data.resendAvailableInSeconds) || 0);

      return { ok: true, data };
    } catch (error) {
      const retryAfterSeconds = Number(error.response?.data?.retryAfterSeconds) || 0;
      const existingChallengeId = error.response?.data?.challengeId;

      if (existingChallengeId) {
        setChallengeId(existingChallengeId);
      }

      if (retryAfterSeconds > 0) {
        setResendCooldown(retryAfterSeconds);
      }

      return {
        ok: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    } finally {
      setRequestLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!challengeId) {
      return { ok: false, message: 'Request OTP first' };
    }

    if (resendCooldown > 0) {
      return {
        ok: false,
        message: `Please wait ${resendCooldown}s before retrying`,
      };
    }

    try {
      setResendLoading(true);

      const { data } = await api.post(resendEndpoint, { challengeId });
      setResendCooldown(Number(data.resendAvailableInSeconds) || 0);

      return { ok: true, data };
    } catch (error) {
      const retryAfterSeconds = Number(error.response?.data?.retryAfterSeconds) || 0;

      if (retryAfterSeconds > 0) {
        setResendCooldown(retryAfterSeconds);
      }

      return {
        ok: false,
        message: error.response?.data?.message || 'Failed to resend OTP',
      };
    } finally {
      setResendLoading(false);
    }
  };

  const verifyOtp = async (payload) => {
    if (!verifyEndpoint) {
      return { ok: false, message: 'OTP verification is not configured' };
    }

    try {
      setVerifyLoading(true);

      const { data } = await api.post(verifyEndpoint, payload);
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || 'OTP verification failed',
      };
    } finally {
      setVerifyLoading(false);
    }
  };

  return {
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
  };
};

export default useOtp;
