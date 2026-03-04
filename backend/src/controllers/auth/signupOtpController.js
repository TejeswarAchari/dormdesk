const {
  requestSignupOtp: requestSignupOtpService,
  resendSignupOtp: resendSignupOtpService,
} = require('../../services/otp/signupOtpService');
const { sendControllerError } = require('./authControllerUtils');

const requestSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otpSession = await requestSignupOtpService({ email });

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
    return sendControllerError(res, error, 'Signup OTP request failed');
  }
};

const resendSignupOtp = async (req, res) => {
  try {
    const { challengeId } = req.body;
    const otpSession = await resendSignupOtpService(challengeId);

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
    return sendControllerError(res, error, 'Signup OTP resend failed');
  }
};

module.exports = {
  requestSignupOtp,
  resendSignupOtp,
};
