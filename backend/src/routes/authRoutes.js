const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	logoutUser,
	requestLoginOtp,
	verifyLoginOtp,
	resendLoginOtp,
	requestSignupOtp,
	resendSignupOtp,
} = require('../controllers/authController');
const {
	otpRequestLimiter,
	otpVerifyLimiter,
} = require('../middlewares/otpRateLimitMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/otp/request', otpRequestLimiter, requestLoginOtp);
router.post('/otp/verify', otpVerifyLimiter, verifyLoginOtp);
router.post('/otp/resend', otpRequestLimiter, resendLoginOtp);
router.post('/signup/otp/request', otpRequestLimiter, requestSignupOtp);
router.post('/signup/otp/resend', otpRequestLimiter, resendSignupOtp);

module.exports = router;