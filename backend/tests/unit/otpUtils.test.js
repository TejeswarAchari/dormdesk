const {
  sanitizeEmail,
  isValidEmail,
  maskEmail,
  normalizeOtp,
  hashOtp,
  verifyOtpHash,
} = require('../../src/services/otp/otpUtils');

describe('OTP utilities', () => {
  test('normalizes and validates email correctly', () => {
    const normalizedEmail = sanitizeEmail('Student@Example.com');

    expect(normalizedEmail).toBe('student@example.com');
    expect(isValidEmail(normalizedEmail)).toBe(true);
  });

  test('masks email safely for delivery hint', () => {
    const maskedEmail = maskEmail('student@example.com');

    expect(maskedEmail).toMatch(/@example.com$/);
  });

  test('normalizes and validates OTP format', () => {
    expect(normalizeOtp('123456')).toBe('123456');
    expect(normalizeOtp('1234')).toBe('1234');
    expect(normalizeOtp('12ab')).toBeNull();
  });

  test('hashes and verifies OTP correctly', () => {
    const otpCode = '654321';
    const otpHash = hashOtp(otpCode);

    expect(verifyOtpHash('654321', otpHash)).toBe(true);
    expect(verifyOtpHash('123456', otpHash)).toBe(false);
  });
});
