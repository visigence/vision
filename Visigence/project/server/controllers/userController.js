import bcrypt from 'bcryptjs';
import { sql } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { ALLOWED_USER_UPDATE_FIELDS } from '../middleware/validation.js';
import logger from '../utils/logger.js';

/**
 * Build safe WHERE clause for user queries
 * @param {object} filters - Filter parameters
 * @returns {object} - WHERE clause and parameters
 */
const buildSafeUserWhereClause = (filters) => {
  const whereConditions = [];
  const params = [];
  
  const { search, role, status } = filters;
  
  if (search) {
    whereConditions.push(`(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR username ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }
  
  if (role) {
    whereConditions.push(`role = $${params.length + 1}`);
    params.push(role);
  }
  
  if (status) {
    whereConditions.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  
  return {
    whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
    params
  };
};

/**
 * Get all users (admin only) with enhanced security
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
    const offset = (page - 1) * limit;
    
    // Whitelist sort fields for security
    const allowedSortFields = ['created_at', 'updated_at', 'email', 'username', 'last_login'];
    const sort = allowedSortFields.includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    
    const filters = {
      search: req.query.search || '',
      role: req.query.role || '',
      status: req.query.status || ''
    };
    
    const { whereClause, params } = buildSafeUserWhereClause(filters);
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const [{ total }] = await sql.unsafe(countQuery, ...params);
    
    // Get users with safe parameterized query
    const usersQuery = `
      SELECT id, email, first_name, last_name, username, avatar_url, role, status, 
             email_verified, last_login, login_count, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const users = await sql.unsafe(usersQuery, ...params, limit, offset);
    
    logger.info(`Retrieved ${users.length} users`, { adminId: req.user.id });
    
    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          avatarUrl: user.avatar_url,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          loginCount: user.login_count,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        })),
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Get users error:', {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID with validation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    const [user] = await sql`
      SELECT id, email, first_name, last_name, username, avatar_url, bio, role, status, 
             email_verified, last_login, login_count, created_at, updated_at
      FROM users 
      WHERE id = ${id}
    `;
    
    if (!user) {
      logger.warn(`User not found: ${id}`, { requesterId: req.user?.id });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    logger.info(`User profile accessed: ${id}`, { requesterId: req.user?.id });
    
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
    logger.error('Get user by ID error:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      requesterId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user with field whitelisting and enhanced security
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, username, bio, avatarUrl, role, status } = req.body;
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const [existingUser] = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if username is already taken (if being updated)
    if (username && username !== existingUser.username) {
      const [usernameExists] = await sql`
        SELECT id FROM users WHERE username = ${username} AND id != ${id}
      `;
      
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }
    
    // Permission checks
    const isAdmin = req.user.role === 'admin';
    const canUpdateUser = isAdmin || req.user.id === id;
    
    if (!canUpdateUser) {
      logger.warn(`Unauthorized user update attempt`, { 
        requesterId: req.user.id, 
        targetUserId: id 
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Build update object with whitelisted fields only
    const updates = {};
    
    // Regular user fields
    if (firstName !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('first_name')) {
      updates.first_name = firstName;
    }
    if (lastName !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('last_name')) {
      updates.last_name = lastName;
    }
    if (username !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('username')) {
      updates.username = username;
    }
    if (bio !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('bio')) {
      updates.bio = bio;
    }
    if (avatarUrl !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('avatar_url')) {
      updates.avatar_url = avatarUrl;
    }
    
    // Admin-only fields
    if (isAdmin) {
      if (role !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('role')) {
        // Validate role value
        const allowedRoles = ['user', 'admin', 'moderator'];
        if (allowedRoles.includes(role)) {
          updates.role = role;
        }
      }
      if (status !== undefined && ALLOWED_USER_UPDATE_FIELDS.includes('status')) {
        // Validate status value
        const allowedStatuses = ['active', 'inactive', 'suspended', 'pending_verification'];
        if (allowedStatuses.includes(status)) {
          updates.status = status;
        }
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update user using safe parameterized query
    const updateFields = Object.keys(updates);
    const updateValues = Object.values(updates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const [updatedUser] = await sql.unsafe(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      id, ...updateValues
    );
    
    // Log update
    await createAuditLog(
      req.user.id, 
      'update', 
      'user', 
      id, 
      existingUser, 
      updatedUser, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`User updated: ${updatedUser.username}`, { 
      requesterId: req.user.id, 
      targetUserId: id 
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          username: updatedUser.username,
          avatarUrl: updatedUser.avatar_url,
          bio: updatedUser.bio,
          role: updatedUser.role,
          status: updatedUser.status,
          emailVerified: updatedUser.email_verified,
          lastLogin: updatedUser.last_login,
          loginCount: updatedUser.login_count,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      }
    });
    
  } catch (error) {
    logger.error('Update user error:', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user?.id,
      targetUserId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete user (admin only) with enhanced security
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const [user] = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    // Prevent deletion of other admins (unless super admin)
    if (user.role === 'admin' && req.user.role !== 'super_admin') {
      logger.warn(`Attempt to delete admin user`, { 
        requesterId: req.user.id, 
        targetUserId: id 
      });
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    // Delete user (cascade will handle related records)
    await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    
    // Log deletion
    await createAuditLog(
      req.user.id, 
      'delete', 
      'user', 
      id, 
      user, 
      null, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`User deleted: ${user.username}`, { 
      requesterId: req.user.id, 
      targetUserId: id 
    });
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete user error:', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user?.id,
      targetUserId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user password with enhanced security
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number'
      });
    }
    
    // Check if user can update this password
    const canUpdate = req.user.role === 'admin' || req.user.id === id;
    
    if (!canUpdate) {
      logger.warn(`Unauthorized password update attempt`, { 
        requesterId: req.user.id, 
        targetUserId: id 
      });
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Get user
    const [user] = await sql`
      SELECT id, password_hash, username FROM users WHERE id = ${id}
    `;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If not admin, verify current password
    if (req.user.role !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }
      
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        logger.warn(`Invalid current password provided`, { 
          requesterId: req.user.id, 
          targetUserId: id 
        });
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }
    
    // Hash new password with higher cost for better security
    const newPasswordHash = await bcrypt.hash(newPassword, 14);
    
    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id = ${id}
    `;
    
    // Revoke all refresh tokens for this user
    await sql`
      UPDATE refresh_tokens 
      SET is_revoked = true 
      WHERE user_id = ${id}
    `;
    
    // Log password update
    await createAuditLog(
      req.user.id, 
      'password_reset', 
      'user', 
      id, 
      null, 
      null, 
      req.ip, 
      req.get('User-Agent')
    );
    
    logger.info(`Password updated for user: ${user.username}`, { 
      requesterId: req.user.id, 
      targetUserId: id 
    });
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    logger.error('Update password error:', {
      error: error.message,
      stack: error.stack,
      requesterId: req.user?.id,
      targetUserId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user statistics (admin only)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getUserStats = async (req, res) => {
  try {
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'moderator') as moderator_users,
        COUNT(*) FILTER (WHERE role = 'user') as regular_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '30 days') as active_users_30d
      FROM users
    `;
    
    logger.info('User statistics accessed', { adminId: req.user.id });
    
    res.json({
      success: true,
      data: {
        totalUsers: parseInt(stats.total_users),
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.inactive_users),
        suspendedUsers: parseInt(stats.suspended_users),
        adminUsers: parseInt(stats.admin_users),
        moderatorUsers: parseInt(stats.moderator_users),
        regularUsers: parseInt(stats.regular_users),
        newUsers30d: parseInt(stats.new_users_30d),
        activeUsers30d: parseInt(stats.active_users_30d)
      }
    });
    
  } catch (error) {
    logger.error('Get user stats error:', {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};