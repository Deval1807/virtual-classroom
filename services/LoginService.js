const { GenerateSignature } = require('../utils/AuthUtil');

/**
 * Logs in a user by generating an authentication token.
 * 
 * This function performs the following steps:
 * 1. Validates that both the username and password are provided.
 * 2. Generates a JWT token for the user using the provided username.
 * 3. Returns the generated token.
 * 
 * @param {string} username - The username of the user attempting to log in.
 * @param {string} password - The password of the user attempting to log in.
 * @returns {Promise<string>} - The generated authentication token.
 * @throws {Error} - If the username or password is not provided.
 */
const loginUser = async (username, password) => {
    console.log("IN LoginService.loginUser", { username });
    try {
        if (!username) {
            throw new Error("Username is required!");
        }
        if (!password) {
            throw new Error("Password is required!");
        }

        // Directly generate a token.
        const token = await GenerateSignature({ username });
        return token;
    } catch (error) {
        throw error;
    } finally {
        console.log("OUT LoginService.loginUser");
    }
};

module.exports = { loginUser };
