import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../../models/User';
import config from '../../config';
import { logger } from '../../utils/logger';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      res
        .status(400)
        .json({ message: 'Please provide username, email, and password' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: 'user', // Default role
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // User is attached to the request by auth middleware
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (user: IUser): string => {
  const payload = { id: user.id };
  const secret = Buffer.from(config.auth.jwtSecret, 'utf8');
  const options: SignOptions = {
    expiresIn: parseInt(config.auth.jwtExpiresIn as string),
  };

  return jwt.sign(payload, secret, options);
};
