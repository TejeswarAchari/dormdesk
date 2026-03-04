const mongoose = require('mongoose');
const User = require('../../models/User');
const SignupOtpChallenge = require('../../models/SignupOtpChallenge');
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
  normalizeOtp,
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  maskEmail,
  isValidEmail,
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

const ensureSignupEmailAvailable = async (email) => {
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    throw createServiceError(400, 'User already exists');
  }
};

const findActiveSignupChallengeByEmail = async (email) => {
  const now = new Date();

  return SignupOtpChallenge.findOne({
    email,
    consumedAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .select('+otpHash');
};

const issueSignupOtp = async (challenge, email) => {
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

const requestSignupOtp = async ({ email }) => {
  const normalizedEmail = sanitizeEmail(email);

  if (!normalizedEmail) {
    throw createServiceError(400, 'Email is required');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw createServiceError(400, 'Please enter a valid email');
  }

  await ensureSignupEmailAvailable(normalizedEmail);

  const now = new Date();
  let challenge = await findActiveSignupChallengeByEmail(normalizedEmail);

  if (!challenge) {
    challenge = new SignupOtpChallenge({
      email: normalizedEmail,
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
      deliveryHint: maskEmail(normalizedEmail),
      extras: {
      alreadySent: true,
      },
    });
  }

  ensureRequestWithinLimit(challenge, OTP_MAX_REQUESTS_PER_WINDOW);
  challenge.requestCount += 1;
  challenge.email = normalizedEmail;

  return issueSignupOtp(challenge, normalizedEmail);
};

const resendSignupOtp = async (challengeId) => {
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw createServiceError(400, 'Invalid signup OTP session');
  }

  const now = new Date();

  const challenge = await SignupOtpChallenge.findOne({
    _id: challengeId,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).select('+otpHash');

  if (!challenge) {
    throw createServiceError(404, 'Signup OTP session expired or invalid. Please request a new OTP.');
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

  return issueSignupOtp(challenge, challenge.email);
};

const consumeSignupOtpForRegistration = async ({
  challengeId,
  otpInput,
  email,
}) => {
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw createServiceError(400, 'Invalid signup OTP session');
  }

  const otpCode = normalizeOtp(otpInput);
  if (!otpCode) {
    throw createServiceError(400, 'OTP must be numeric and 4-8 digits long');
  }

  const normalizedEmail = sanitizeEmail(email);

  const challenge = await SignupOtpChallenge.findOne({
    _id: challengeId,
    consumedAt: null,
  }).select('+otpHash');

  if (!challenge) {
    throw createServiceError(400, 'Signup OTP session is invalid. Please request a new OTP.');
  }

  const now = new Date();

  if (challenge.expiresAt <= now) {
    throw createServiceError(400, 'Signup OTP expired. Please request a new OTP.');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw createServiceError(429, 'Too many invalid OTP attempts. Please request a new OTP.');
  }

  if (challenge.email !== normalizedEmail) {
    throw createServiceError(400, 'Signup OTP is linked to a different email');
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

  return true;
};

module.exports = {
  requestSignupOtp,
  resendSignupOtp,
  consumeSignupOtpForRegistration,
};
