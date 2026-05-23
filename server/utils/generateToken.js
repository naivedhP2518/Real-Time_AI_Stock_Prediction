const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for a specific user ID.
 * @param {string} id - The MongoDB user ID.
 * @returns {string} Signed JWT.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
