const express = require('express');
const passport = require('passport');
const AuthService = require('../services/authService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize Google Sign-In
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google Sign-In callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = AuthService.generateToken(req.user);
      res.redirect(`/auth-success?token=${token}`);
    } catch (error) {
      logger.error('Authentication callback error:', error);
      res.redirect('/auth-failed');
    }
  }
);

// Logout endpoint
router.post('/logout', auth, async (req, res) => {
    try {
      const token = req.header('Authorization').replace('Bearer ', '');
      await AuthService.logout(token);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Error during logout' });
    }
  });
  
  // Verify token endpoint
  router.get('/verify', auth, (req, res) => {
    res.json({ user: req.user });
  });
  
  module.exports = router;