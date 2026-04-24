const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const catchAsync = require('../src/shared/utils/catchAsync.js');
const apiResponse = require('../src/shared/utils/apiResponse.js');

// Generate JWT access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Generate JWT refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Register new user
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return apiResponse(res, 400, 'User already exists with this email');
  }

  // Hash password
  const salt = bcrypt.genSaltSync(12);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Create new user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'customer'
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token in user document
  user.refreshToken = refreshToken;
  await user.save();

  // Remove password from response
  user.password = undefined;
  user.refreshToken = undefined;

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return apiResponse(res, 201, 'User registered successfully', {
    user,
    accessToken
  });
});

// Login user
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return apiResponse(res, 401, 'Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return apiResponse(res, 401, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update last login and store refresh token
  user.lastLogin = new Date();
  user.refreshToken = refreshToken;
  await user.save();

  // Remove password from response
  user.password = undefined;
  user.refreshToken = undefined;

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return apiResponse(res, 200, 'Login successful', {
    user,
    accessToken
  });
});

// Get current user
const getCurrentUser = catchAsync(async (req, res, next) => {
  console.log('req.user:', req.user);
  if (!req.user) {
    return apiResponse(res, 401, 'User not authenticated');
  }
  
  const user = await User.findById(req.user.id);
  
  if (!user || !user.isActive) {
    return apiResponse(res, 404, 'User not found');
  }

  return apiResponse(res, 200, 'User retrieved successfully', {
    user
  });
});

// Refresh token
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return apiResponse(res, 401, 'Refresh token not provided');
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive || user.refreshToken !== refreshToken) {
    return apiResponse(res, 401, 'Invalid refresh token');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  // Update refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  // Set new refresh token in httpOnly cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return apiResponse(res, 200, 'Token refreshed successfully', {
    accessToken: newAccessToken
  });
});

// Logout user
const logout = catchAsync(async (req, res, next) => {
  // Clear refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0)
  });

  // Clear refresh token from database if user is authenticated
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: undefined });
  }

  return apiResponse(res, 200, 'Logout successful');
});

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout
};
