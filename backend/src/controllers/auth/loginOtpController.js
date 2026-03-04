const {
  requestLoginOtp: requestLoginOtpService,
  resendLoginOtp: resendLoginOtpService,
  verifyLoginOtp: verifyLoginOtpService,
} = require('../../services/otp/otpAuthService');
const { sendTokenResponse, sendControllerError } = require('./authControllerUtils');

const requestLoginOtp = async (req, res) => {
  try {
    if (req.cookies?.token) {
      return res.status(400).json({ message: 'User is already logged in' });
    }

    const { email } = req.body;
    const otpSession = await requestLoginOtpService(email);

    return res.status(200).json({
      message: otpSession.alreadySent
        ? `OTP already sent to ${otpSession.deliveryHint}. Please enter it or use resend after cooldown.`
        : `OTP sent to ${otpSession.deliveryHint}`,
      challengeId: otpSession.challengeId,
      expiresInSeconds: otpSession.expiresInSeconds,
      resendAvailableInSeconds: otpSession.resendAvailableInSeconds,
      deliveryHint: otpSession.deliveryHint,
      alreadySent: Boolean(otpSession.alreadySent),
      ...(process.env.NODE_ENV === 'test' && otpSession.otpCode
        ? { otpCode: otpSession.otpCode }
        : {}),
    });
  } catch (error) {
    return sendControllerError(res, error, 'OTP request failed');
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    if (req.cookies?.token) {
      return res.status(400).json({ message: 'User is already logged in' });
    }

    const { challengeId, otp } = req.body;
    const user = await verifyLoginOtpService({ challengeId, otpInput: otp });

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return sendControllerError(res, error, 'OTP verification failed');
  }
};

const resendLoginOtp = async (req, res) => {
  try {
    if (req.cookies?.token) {
      return res.status(400).json({ message: 'User is already logged in' });
    }

    const { challengeId } = req.body;
    const otpSession = await resendLoginOtpService(challengeId);

    return res.status(200).json({
      message: `OTP resent to ${otpSession.deliveryHint}`,
      challengeId: otpSession.challengeId,
      expiresInSeconds: otpSession.expiresInSeconds,
      resendAvailableInSeconds: otpSession.resendAvailableInSeconds,
      deliveryHint: otpSession.deliveryHint,
      ...(process.env.NODE_ENV === 'test' && otpSession.otpCode
        ? { otpCode: otpSession.otpCode }
        : {}),
    });
  } catch (error) {
    return sendControllerError(res, error, 'OTP resend failed');
  }
};

module.exports = {
  requestLoginOtp,
  verifyLoginOtp,
  resendLoginOtp,
};
