const User = require('../../models/User');
const {
  consumeSignupOtpForRegistration,
} = require('../../services/otp/signupOtpService');
const {
  sanitizeEmail,
  sanitizePhone,
  isValidEmail,
  isValidPhone,
} = require('../../services/otp/otpUtils');
const {
  getCookieClearOptions,
  sendTokenResponse,
  sendControllerError,
} = require('./authControllerUtils');

const isSignupOtpRequired = process.env.REQUIRE_SIGNUP_OTP !== 'false';

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      roomNumber,
      phone,
      signupChallengeId,
      signupOtp,
    } = req.body;

    const normalizedEmail = sanitizeEmail(email);
    const normalizedPhone = sanitizePhone(phone);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (normalizedPhone) {
      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    if (role && role !== 'student') {
      return res.status(403).json({ message: 'Students can only register as student role' });
    }

    if (role === 'student' && !roomNumber) {
      return res.status(400).json({ message: 'Room number is required for students' });
    }

    if (isSignupOtpRequired) {
      if (!signupChallengeId || !signupOtp) {
        return res.status(400).json({ message: 'Signup OTP verification is required' });
      }

      await consumeSignupOtpForRegistration({
        challengeId: signupChallengeId,
        otpInput: signupOtp,
        email: normalizedEmail,
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      password,
      role,
      roomNumber: role === 'student' ? roomNumber : undefined,
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    return sendControllerError(res, error, 'Registration failed');
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = sanitizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return sendControllerError(res, error, 'Login failed');
  }
};

const logoutUser = (req, res) => {
  res.cookie('token', '', getCookieClearOptions());
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
