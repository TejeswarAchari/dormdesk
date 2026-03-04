const toInt = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) ? parsedValue : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const OTP_EXPIRY_MINUTES = clamp(
  toInt(process.env.OTP_EXPIRY_MINUTES, 5),
  1,
  5
);
const OTP_RESEND_COOLDOWN_SECONDS = clamp(
  toInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
  15,
  300
);
const OTP_MAX_REQUESTS_PER_WINDOW = clamp(
  toInt(process.env.OTP_MAX_REQUESTS_PER_WINDOW, 5),
  1,
  20
);
const OTP_REQUEST_WINDOW_MINUTES = clamp(
  toInt(process.env.OTP_REQUEST_WINDOW_MINUTES, 15),
  1,
  60
);
const OTP_MAX_VERIFY_ATTEMPTS = clamp(
  toInt(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
  1,
  10
);
const OTP_LENGTH = clamp(
  toInt(process.env.OTP_LENGTH, 6),
  4,
  8
);

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MINUTES,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_LENGTH,
};
