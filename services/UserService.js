const UserDAO = require('../dao/UserDAO');

/**
 * Retrieves a user by their username.
 * 
 * This function performs the following steps:
 * 1. Calls the `UserDAO` to fetch the user details from the database using the provided username.
 * 2. Logs an error and rethrows it if an exception occurs during the process.
 * 
 * @param {string} username - The username of the user to retrieve.
 * @returns {Promise<Object>} - The user object retrieved from the database.
 * @throws {Error} - If an error occurs while fetching the user.
 */
const getUserByUsername = async (username) => {
    console.log("IN UserService.getUserByUsername", { username });
    try {
        return await UserDAO.getUserByUsername(username);
    } catch (error) {
        console.error(`Error in UserService while fetching user ID for username "${username}":`, error);
        throw error;
    } finally {
        console.log("OUT UserService.getUserByUsername");
    }
};

module.exports = { getUserByUsername };
