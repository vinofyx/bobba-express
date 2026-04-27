const User = require('../models/User');
const bcrypt = require('bcryptjs');
const apiResponse = require('../shared/utils/apiResponse');
const { generatePassword } = require('../shared/utils/passwordGenerator');

// GET /api/users - Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return apiResponse(res, 200, 'Users retrieved successfully', {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// GET /api/users/agents - Get all agents
const getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email phone isActive createdAt')
      .sort({ name: 1 });

    return apiResponse(res, 200, 'Agents retrieved successfully', { agents });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// GET /api/users/profile - Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    return apiResponse(res, 200, 'Profile retrieved successfully', { user });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// GET /api/users/:id - Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return apiResponse(res, 404, 'User not found');
    }

    return apiResponse(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// POST /api/users - Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Validation
    if (!name || !email || !role) {
      return apiResponse(res, 400, 'Name, email, and role are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return apiResponse(res, 400, 'User with this email already exists');
    }

    // Generate password if not provided
    const userPassword = password || generatePassword();
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address
    });

    await user.save();

    // Don't return password
    user.password = undefined;

    return apiResponse(res, 201, 'User created successfully', { 
      user,
      temporaryPassword: password ? null : userPassword
    });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// PUT /api/users/:id - Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user is updating their own profile or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return apiResponse(res, 403, 'Not authorized to update this user');
    }

    // Remove sensitive fields if not admin
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.isActive;
    }

    // Don't allow password update through this endpoint
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return apiResponse(res, 404, 'User not found');
    }

    return apiResponse(res, 200, 'User updated successfully', { user });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// PATCH /api/users/profile - Update own profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.isActive;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    return apiResponse(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

// DELETE /api/users/:id - Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return apiResponse(res, 404, 'User not found');
    }

    return apiResponse(res, 200, 'User deleted successfully', { user });
  } catch (error) {
    return apiResponse(res, 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getAgents,
  getProfile,
  getUserById,
  createUser,
  updateUser,
  updateProfile,
  deleteUser
};
