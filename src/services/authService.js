const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/redis');

class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static async createOrUpdateUser(profile) {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value
        });
      }

      user.lastLogin = new Date();
      await user.save();
      
      return user;
    } catch (error) {
      throw new Error('Error creating/updating user');
    }
  }

  static async logout(token) {
    // Blacklist the token in Redis
    await redisClient.set(`blacklist_${token}`, 'true', 'EX', 24 * 60 * 60); // 24 hours
  }
}

module.exports = AuthService;