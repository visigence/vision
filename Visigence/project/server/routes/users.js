import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  updatePassword,
  getUserStats
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin, requireModerator } from '../middleware/auth.js';
import { 
  validateUUID, 
  validatePagination,
  whitelistUserFields 
} from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user statistics (admin only)
router.get('/stats', requireAdmin, getUserStats);

// Get all users (admin/moderator only)
router.get('/', requireModerator, validatePagination, getUsers);

// Get user by ID
router.get('/:id', validateUUID('id'), getUserById);

// Update user with field whitelisting
router.put('/:id', 
  validateUUID('id'), 
  whitelistUserFields,
  updateUser
);

// Update user password
router.put('/:id/password', validateUUID('id'), updatePassword);

// Delete user (admin only)
router.delete('/:id', requireAdmin, validateUUID('id'), deleteUser);

export default router;