const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Helper to set cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

 const options = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.HTTPS === 'true',
  sameSite: 'none',  // ← Change this to 'none' for cross-origin
  domain: undefined  // ← Add this line
};

  res
    .status(statusCode)
    .cookie('token', token, options) // Set the cookie
    .json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roomNumber: user.roomNumber,
    
    });
};

// @desc    Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, roomNumber } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow 'student' role for registration (Caretakers added by admin)
    if (role && role !== 'student') {
      return res.status(403).json({ message: 'Students can only register as student role' });
    }

    if (role === 'student' && !roomNumber) {
      return res.status(400).json({ message: 'Room number is required for students' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      roomNumber: role === 'student' ? roomNumber : undefined,
    });

    if (user) {
      sendTokenResponse(user, 201, res); // Use helper
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// @desc    Auth user & get token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res); // Use helper
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, loginUser, logoutUser };