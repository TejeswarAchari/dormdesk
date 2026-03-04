const rateLimit = require('express-rate-limit');

const formatRateLimitMessage = (message) => ({ message });

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: formatRateLimitMessage(
    'Too many OTP requests from this IP, please try again later.'
  ),
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: formatRateLimitMessage(
    'Too many OTP verification attempts from this IP, please try again later.'
  ),
});

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
};
