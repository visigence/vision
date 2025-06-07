import express from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile 
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validateUserRegistration, 
  validateUserLogin 
} from '../middleware/validation.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;