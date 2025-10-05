const jwt = require("jsonwebtoken");

const APP_SECRET = process.env.APP_SECRET;

/**
 * Generates a JWT token for the given payload.
 * 
 * This function performs the following steps:
 * 1. Uses the `jsonwebtoken` library to sign the provided payload.
 * 2. Sets the token expiration to 1 day.
 * 3. Returns the generated token.
 * 
 * @param {Object} payload - The data to include in the JWT token.
 * @returns {Promise<string>} - The generated JWT token.
 * @throws {Error} - If an error occurs during token generation.
 */
const GenerateSignature = async (payload) => {
    try {
        return await jwt.sign(payload, APP_SECRET, { expiresIn: "1d" });
    } catch (error) {
        console.log(error);
        return error;
    }
};

/**
 * Validates the JWT token from the request's Authorization header.
 * 
 * This function performs the following steps:
 * 1. Extracts the token from the "Authorization" header.
 * 2. Verifies the token using the `jsonwebtoken` library and the application secret.
 * 3. Attaches the username from the token payload to the `req` object.
 * 4. Returns `true` if the token is valid, otherwise returns `false`.
 * 
 * @param {Object} req - The HTTP request object.
 * @returns {Promise<boolean>} - `true` if the token is valid, `false` otherwise.
 * @throws {Error} - If an error occurs during token validation.
 */
const ValidateSignature = async (req) => {
    try {
        const signature = req.get("Authorization");
        const payload = await jwt.verify(signature.split(" ")[1], APP_SECRET);
        req.username = payload.username;
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

module.exports = { GenerateSignature, ValidateSignature };