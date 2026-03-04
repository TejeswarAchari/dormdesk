const mongoose = require('mongoose');
const User = require('../../models/User');
const OtpChallenge = require('../../models/OtpChallenge');
const {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_REQUESTS_PER_WINDOW,
  OTP_REQUEST_WINDOW_MINUTES,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_LENGTH,
} = require('./otpConfig');
const {
  sanitizeEmail,
  isValidEmail,
  normalizeOtp,
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  maskEmail,
} = require('./otpUtils');
const { sendOtpEmail } = require('./otpDeliveryService');
const {
  createServiceError,
  ensureRequestWindow,
  ensureRequestWithinLimit,
  getSecondsUntil,
  buildOtpSessionPayload,
} = require('./otpServiceHelpers');

const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_REQUEST_WINDOW_MS = OTP_REQUEST_WINDOW_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = OTP_RESEND_COOLDOWN_SECONDS * 1000;

const resolveUserByEmail = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw createServiceError(404, 'No account found for this email');
  }

  return user;
};

const findActiveChallenge = async (userId) => {
  const now = new Date();
  return OtpChallenge.findOne({
    user: userId,
    consumedAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .select('+otpHash');
};

const issueOtp = async (challenge, email) => {
  const now = new Date();
  const otpCode = generateOtpCode(OTP_LENGTH);

  challenge.otpHash = hashOtp(otpCode);
  challenge.expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  challenge.attempts = 0;
  challenge.maxAttempts = OTP_MAX_VERIFY_ATTEMPTS;
  challenge.nextResendAllowedAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_MS);

  await challenge.save();

  await sendOtpEmail({
    toEmail: email,
    otpCode,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });

  return buildOtpSessionPayload({
    challenge,
    now,
    deliveryHint: maskEmail(email),
    extras: {
    ...(process.env.NODE_ENV === 'test' ? { otpCode } : {}),
    },
  });
};

const requestLoginOtp = async (emailInput) => {
  const email = sanitizeEmail(emailInput);
  if (!email || !isValidEmail(email)) {
    throw createServiceError(400, 'Enter a valid email address');
  }

  const user = await resolveUserByEmail(email);
  const now = new Date();

  let challenge = await findActiveChallenge(user._id);

  if (!challenge) {
    challenge = new OtpChallenge({
      user: user._id,
      email,
      otpHash: hashOtp(generateOtpCode(OTP_LENGTH)),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      requestCount: 0,
      requestWindowStartedAt: now,
      resendCount: 0,
      nextResendAllowedAt: now,
      maxAttempts: OTP_MAX_VERIFY_ATTEMPTS,
    });
  }

  ensureRequestWindow(challenge, now, OTP_REQUEST_WINDOW_MS);

  if (challenge.nextResendAllowedAt && challenge.nextResendAllowedAt > now) {
    return buildOtpSessionPayload({
      challenge,
      now,
      deliveryHint: maskEmail(email),
      extras: {
      alreadySent: true,
      },
    });
  }

  ensureRequestWithinLimit(challenge, OTP_MAX_REQUESTS_PER_WINDOW);
  challenge.requestCount += 1;
  challenge.email = email;

  return issueOtp(challenge, email);
};

const resendLoginOtp = async (challengeId) => {
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw createServiceError(400, 'Invalid OTP session');
  }

  const now = new Date();
  const challenge = await OtpChallenge.findOne({
    _id: challengeId,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).select('+otpHash');

  if (!challenge) {
    throw createServiceError(404, 'OTP session expired or invalid. Please request a new OTP.');
  }

  if (challenge.nextResendAllowedAt && challenge.nextResendAllowedAt > now) {
    throw createServiceError(429, 'Please wait before resending OTP', {
      retryAfterSeconds: getSecondsUntil(challenge.nextResendAllowedAt, now),
      challengeId: challenge._id,
    });
  }

  ensureRequestWindow(challenge, now, OTP_REQUEST_WINDOW_MS);
  ensureRequestWithinLimit(challenge, OTP_MAX_REQUESTS_PER_WINDOW);

  challenge.requestCount += 1;
  challenge.resendCount += 1;

  return issueOtp(challenge, challenge.email);
};

const verifyLoginOtp = async ({ challengeId, otpInput }) => {
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw createServiceError(400, 'Invalid OTP session');
  }

  const otpCode = normalizeOtp(otpInput);
  if (!otpCode) {
    throw createServiceError(400, 'OTP must be numeric and 4-8 digits long');
  }

  const now = new Date();

  const challenge = await OtpChallenge.findOne({
    _id: challengeId,
    consumedAt: null,
  }).select('+otpHash');

  if (!challenge) {
    throw createServiceError(400, 'OTP session is invalid. Please request a new OTP.');
  }

  if (challenge.expiresAt <= now) {
    throw createServiceError(400, 'OTP expired. Please request a new OTP.');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw createServiceError(429, 'Too many invalid OTP attempts. Please request a new OTP.');
  }

  const isValidOtp = verifyOtpHash(otpCode, challenge.otpHash);

  if (!isValidOtp) {
    challenge.attempts += 1;
    await challenge.save();

    const remainingAttempts = Math.max(challenge.maxAttempts - challenge.attempts, 0);

    if (remainingAttempts === 0) {
      throw createServiceError(429, 'Too many invalid OTP attempts. Please request a new OTP.');
    }

    throw createServiceError(401, `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
  }

  challenge.consumedAt = now;
  await challenge.save();

  const user = await User.findById(challenge.user);
  if (!user) {
    throw createServiceError(404, 'User not found');
  }

  return user;
};

module.exports = {
  requestLoginOtp,
  resendLoginOtp,
  verifyLoginOtp,
};
