const crypto = require('crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;
const OTP_REGEX = /^\d{4,8}$/;

const sanitizeText = (value = '') => String(value).trim();

const sanitizeEmail = (email = '') => sanitizeText(email).toLowerCase();

const sanitizePhone = (phone = '') => {
  const rawPhone = sanitizeText(phone);
  if (!rawPhone) {
    return '';
  }

  const startsWithPlus = rawPhone.startsWith('+');
  const digits = rawPhone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return startsWithPlus ? `+${digits}` : digits;
};

const isValidEmail = (email = '') => EMAIL_REGEX.test(sanitizeEmail(email));

const isValidPhone = (phone = '') => PHONE_REGEX.test(sanitizePhone(phone));

const normalizeOtp = (otpInput = '') => {
  const sanitizedOtp = sanitizeText(otpInput);

  if (!OTP_REGEX.test(sanitizedOtp)) {
    return null;
  }

  return sanitizedOtp;
};

const generateOtpCode = (length = 6) => {
  if (process.env.NODE_ENV === 'test' && process.env.OTP_TEST_CODE) {
    return process.env.OTP_TEST_CODE;
  }

  const minValue = 10 ** (length - 1);
  const maxValue = (10 ** length) - 1;
  return String(crypto.randomInt(minValue, maxValue + 1));
};

const hashOtp = (otpCode) =>
  crypto.createHash('sha256').update(String(otpCode)).digest('hex');

const verifyOtpHash = (plainOtp, storedOtpHash) => {
  const computedHash = hashOtp(plainOtp);

  const computedHashBuffer = Buffer.from(computedHash, 'hex');
  const storedHashBuffer = Buffer.from(storedOtpHash, 'hex');

  if (computedHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedHashBuffer, storedHashBuffer);
};

const maskEmail = (email = '') => {
  if (!email) {
    return '';
  }

  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart) {
    return email;
  }

  const visibleLocalPart = localPart.slice(0, 3);
  return `${visibleLocalPart}${'*'.repeat(Math.max(localPart.length - 3, 2))}@${domainPart}`;
};

module.exports = {
  sanitizeEmail,
  sanitizePhone,
  isValidEmail,
  isValidPhone,
  normalizeOtp,
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  maskEmail,
};
