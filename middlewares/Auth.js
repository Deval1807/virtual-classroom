const { ValidateSignature } = require('../utils/AuthUtil');

/**
 * Middleware to check if the user is authorized.
 * 
 * This function performs the following steps:
 * 1. Checks if the "Authorization" header is present and starts with "Bearer ".
 * 2. Validates the JWT token using the `ValidateSignature` utility function.
 * 3. If the token is valid, calls the `next` middleware.
 * 4. If the token is invalid or missing, responds with an appropriate HTTP status and error message.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Resolves when the middleware completes.
 */
const AuthCheck = async (req, res, next) => {
    const authHeader = req.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: 'Authorization header is missing or invalid' });
    }

    const isAuthorized = await ValidateSignature(req);

    if (isAuthorized) {
        return next();
    }
    return res.status(403).json({ messages: 'Not Authorized' });
};

module.exports = { AuthCheck };