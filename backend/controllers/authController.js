const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password, role } = req.body;

    // Basic validation (should be improved)
    if (!fullname || !email || !password) {
        res.status(400);
        throw new Error('Please include all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        fullname,
        email,
        password,
        role: role || 'user', // Default to 'user' if not provided
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email (include password as it was hidden)
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
