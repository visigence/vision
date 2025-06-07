import express from 'express';
import { 
  getMessages, 
  getMessageBySlug, 
  createMessage, 
  updateMessage, 
  deleteMessage 
} from '../controllers/messageController.js';
import { authenticateToken, requireModerator, optionalAuth } from '../middleware/auth.js';
import { 
  validateMessage, 
  validateUUID, 
  validatePagination,
  whitelistMessageFields 
} from '../middleware/validation.js';

const router = express.Router();

// Get all messages (public with optional auth)
router.get('/', optionalAuth, validatePagination, getMessages);

// Get message by slug or ID (public with optional auth)
router.get('/:slug', optionalAuth, getMessageBySlug);

// Create new message (authenticated users only)
router.post('/', 
  authenticateToken, 
  whitelistMessageFields,
  validateMessage, 
  createMessage
);

// Update message (author, moderator, or admin)
router.put('/:id', 
  authenticateToken, 
  validateUUID('id'), 
  whitelistMessageFields,
  validateMessage, 
  updateMessage
);

// Delete message (author, moderator, or admin)
router.delete('/:id', 
  authenticateToken, 
  validateUUID('id'), 
  deleteMessage
);

export default router;