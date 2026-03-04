const generateToken = require('../../utils/generateToken');

const getCookieOptions = () => {
  const isSecureContext =
    process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true';

  return {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isSecureContext,
    sameSite: isSecureContext ? 'none' : 'lax',
    path: '/',
  };
};

const getCookieClearOptions = () => ({
  ...getCookieOptions(),
  expires: new Date(0),
});

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res
    .status(statusCode)
    .cookie('token', token, getCookieOptions())
    .json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roomNumber: user.roomNumber,
    });
};

const sendControllerError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || 500;
  const responseBody = {
    message: error.message || fallbackMessage,
  };

  if (error.retryAfterSeconds) {
    responseBody.retryAfterSeconds = error.retryAfterSeconds;
  }

  if (error.challengeId) {
    responseBody.challengeId = error.challengeId;
  }

  if (statusCode >= 500) {
    console.error(fallbackMessage, error);
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = {
  getCookieClearOptions,
  sendTokenResponse,
  sendControllerError,
};
