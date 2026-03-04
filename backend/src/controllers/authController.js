const {
  registerUser,
  loginUser,
  logoutUser,
} = require('./auth/passwordAuthController');
const {
  requestLoginOtp,
  verifyLoginOtp,
  resendLoginOtp,
} = require('./auth/loginOtpController');
const {
  requestSignupOtp,
  resendSignupOtp,
} = require('./auth/signupOtpController');

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  requestLoginOtp,
  verifyLoginOtp,
  resendLoginOtp,
  requestSignupOtp,
  resendSignupOtp,
};
