const { snakeToCamel } = require('../utils/ObjectMapper');
const pool = require('../config/Database');

/**
 * Retrieves a user from the database by their username.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch the user details from the `tblm_users` table using the provided username.
 * 2. Throws an error if no user is found with the given username.
 * 3. Converts the database result's keys from snake_case to camelCase using the `snakeToCamel` utility.
 * 4. Returns the user object.
 * 
 * @param {string} username - The username of the user to retrieve.
 * @returns {Promise<Object>} - The user object with camelCase keys.
 * @throws {Error} - If the user is not found or if an error occurs during the database query.
 */
const getUserByUsername = async (username) => {
    console.log("IN UserDAO.getUserByUsername", { username });
    try {
        const query = `
            SELECT * 
            FROM classroom.tblm_users 
            WHERE username = $1
        `;
        const values = [username];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error(`User with username "${username}" not found`);
        }

        // Convert snake_case keys to camelCase
        const user = snakeToCamel(result.rows[0]);
        console.log("OUT UserDAO.getUserByUsername", { user });
        return user;
    } catch (error) {
        console.error(`Error fetching user for username "${username}":`, error);
        throw error;
    }
};

module.exports = { getUserByUsername };
