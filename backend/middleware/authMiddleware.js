const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing or invalid format. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_election_jwt_key_replace_in_production';

  try {
    const decoded = jwt.verify(token, secret);
    req.voter = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid. Please re-authenticate.',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;

