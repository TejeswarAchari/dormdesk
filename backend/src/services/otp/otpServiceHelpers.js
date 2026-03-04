const createServiceError = (statusCode, message, extras = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extras);
  return error;
};

const ensureRequestWindow = (challenge, now, windowMs) => {
  const requestWindowStartedAt = challenge.requestWindowStartedAt || now;
  const isWindowExpired =
    now.getTime() - requestWindowStartedAt.getTime() >= windowMs;

  if (isWindowExpired) {
    challenge.requestWindowStartedAt = now;
    challenge.requestCount = 0;
  }
};

const ensureRequestWithinLimit = (challenge, maxRequestsPerWindow) => {
  if (challenge.requestCount >= maxRequestsPerWindow) {
    throw createServiceError(429, 'Too many OTP requests. Please try again later.');
  }
};

const getSecondsUntil = (futureDate, now = new Date()) =>
  Math.max(Math.ceil((futureDate.getTime() - now.getTime()) / 1000), 0);

const buildOtpSessionPayload = ({ challenge, now, deliveryHint, extras = {} }) => ({
  challengeId: challenge._id,
  expiresInSeconds: getSecondsUntil(challenge.expiresAt, now),
  resendAvailableInSeconds: getSecondsUntil(challenge.nextResendAllowedAt, now),
  deliveryHint,
  ...extras,
});

module.exports = {
  createServiceError,
  ensureRequestWindow,
  ensureRequestWithinLimit,
  getSecondsUntil,
  buildOtpSessionPayload,
};
