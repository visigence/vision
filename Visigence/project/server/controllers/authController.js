import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { sanitizeText } from '../utils/sanitizer.js';
import logger from '../utils/logger.js';

/**
 * Generate JWT tokens with enhanced security
 * @param {string} userId - User ID
 * @returns {object} - Access and refresh tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      issuer: 'visigence-api',
      audience: 'visigence-client'
    }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'visigence-api',
      audience: 'visigence-client'
    }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Store refresh token in database with expiration
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 */
const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  await sql`
    INSERT INTO refresh_tokens (token, user_id, expires_at)
    VALUES (${refreshToken}, ${userId}, ${expiresAt})
  `;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength && hasLowerCase && hasUpperCase && hasNumbers;
  
  return {
    isValid,
    score: [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length,
    feedback: {
      minLength: password.length >= minLength,
      hasLowerCase,
      hasUpperCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

/**
 * Register new user with enhanced validation and security
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    
    // Sanitize input data
    const sanitizedData = {
      email: email.toLowerCase().trim(),
      firstName: sanitizeText(firstName),
      lastName: sanitizeText(lastName),
      username: sanitizeText(username)
    };
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        details: passwordValidation.feedback
      });
    }
    
    // Check if user already exists
    const [existingUser] = await sql`
      SELECT id FROM users WHERE email = ${sanitizedData.email} OR username = ${sanitizedData.username}
    `;
    
    if (existingUser) {
      logger.warn(`Registration attempt with existing credentials`, { 
        email: sanitizedData.email, 
        username: sanitizedData.username,
        ip: req.ip 
      });
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Hash password with higher cost for better security
    const passwordHash = await bcrypt.hash(password, 14);
    
    // Create user
    const [user] = await sql`
      INSERT INTO users (
        email, password_hash, first_name, last_name, username,
        role, status, email_verified
      ) VALUES (
        ${sanitizedData.email}, ${passwordHash}, ${sanitizedData.firstName}, 
        ${sanitizedData.lastName}, ${sanitizedData.username},
        'user', 'active', true
      ) RETURNING id, email, first_name, last_name, username, role, created_at
    `;
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);
    
    // Log registration
    await createAuditLog(user.id, 'create', 'user', user.id, null, user, req.ip, req.get('User-Agent'));
    
    logger.info(`User registered successfully`, { 
      userId: user.id, 
      email: user.email, 
      username: user.username,
      ip: req.ip 
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role,
          createdAt: user.created_at
        },
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    logger.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      body: { ...req.body, password: '[REDACTED]' },
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login user with enhanced security and rate limiting
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sanitize email input
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Find user
    const [user] = await sql`
      SELECT id, email, password_hash, first_name, last_name, username, role, status, login_count
      FROM users 
      WHERE email = ${sanitizedEmail}
    `;
    
    if (!user) {
      logger.warn(`Login attempt with non-existent email`, { 
        email: sanitizedEmail, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      logger.warn(`Login attempt with inactive account`, { 
        userId: user.id, 
        status: user.status, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.warn(`Login attempt with invalid password`, { 
        userId: user.id, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update login info
    await sql`
      UPDATE users 
      SET last_login = NOW(), login_count = ${user.login_count + 1}
      WHERE id = ${user.id}
    `;
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    await storeRefreshToken(user.id, refreshToken);
    
    // Log login
    await createAuditLog(user.id, 'login', 'user', user.id, null, null, req.ip, req.get('User-Agent'));
    
    logger.info(`User logged in successfully`, { 
      userId: user.id, 
      email: user.email, 
      ip: req.ip 
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    logger.error('Login error:', {
      error: error.message,
      stack: error.stack,
      body: { ...req.body, password: '[REDACTED]' },
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh access token with enhanced validation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'visigence-api',
      audience: 'visigence-client'
    });
    
    // Check if refresh token exists and is not revoked
    const [tokenRecord] = await sql`
      SELECT user_id, expires_at, is_revoked
      FROM refresh_tokens 
      WHERE token = ${refreshToken}
    `;
    
    if (!tokenRecord || tokenRecord.is_revoked || new Date() > tokenRecord.expires_at) {
      logger.warn(`Invalid or expired refresh token used`, { 
        userId: decoded.userId, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Get user
    const [user] = await sql`
      SELECT id, email, first_name, last_name, username, role, status
      FROM users 
      WHERE id = ${decoded.userId} AND status = 'active'
    `;
    
    if (!user) {
      logger.warn(`Refresh token used for non-existent or inactive user`, { 
        userId: decoded.userId, 
        ip: req.ip 
      });
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'visigence-api',
        audience: 'visigence-client'
      }
    );
    
    logger.info(`Access token refreshed`, { 
      userId: user.id, 
      ip: req.ip 
    });
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    logger.error('Refresh token error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Logout user and revoke tokens
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Revoke refresh token
      await sql`
        UPDATE refresh_tokens 
        SET is_revoked = true 
        WHERE token = ${refreshToken}
      `;
    }
    
    // Log logout
    if (req.user) {
      await createAuditLog(req.user.id, 'logout', 'user', req.user.id, null, null, req.ip, req.get('User-Agent'));
      
      logger.info(`User logged out`, { 
        userId: req.user.id, 
        ip: req.ip 
      });
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    logger.error('Logout error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getProfile = async (req, res) => {
  try {
    const [user] = await sql`
      SELECT id, email, first_name, last_name, username, avatar_url, bio, role, status, 
             email_verified, last_login, login_count, created_at, updated_at
      FROM users 
      WHERE id = ${req.user.id}
    `;
    
    if (!user) {
      logger.warn(`Profile request for non-existent user`, { 
        userId: req.user.id, 
        ip: req.ip 
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info(`Profile accessed`, { 
      userId: user.id, 
      ip: req.ip 
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          avatarUrl: user.avatar_url,
          bio: user.bio,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          loginCount: user.login_count,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
    
  } catch (error) {
    logger.error('Get profile error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};