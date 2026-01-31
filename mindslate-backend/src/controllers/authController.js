const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Helper to set cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true, // Prevents client-side JS from accessing the cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict' 
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

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res); // Use helper
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
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