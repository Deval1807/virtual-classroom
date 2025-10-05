const pool = require('../config/Database');

/**
 * The function begins a new database transaction by acquiring a client from the connection pool
 * and executing a 'BEGIN' SQL command. It returns the client which can be used for subsequent
 * 
 * @returns {Promise<Object>} - The database client with an active transaction.
 */
const beginTransaction = async () => {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
};

/**
 * Commits the current transaction on the provided database client and releases the client back to the pool.
 * 
 * @param {Object} client - The database client with an active transaction.
 * @returns {Promise<void>}
 */
const commitTransaction = async (client) => {
    await client.query('COMMIT');
    client.release();
};

/**
 * Rolls back the current transaction on the provided database client and releases the client back to the pool.
 * 
 * @param {Object} client - The database client with an active transaction.
 * @returns {Promise<void>}
 */
const rollbackTransaction = async (client) => {
    await client.query('ROLLBACK');
    client.release();
};

module.exports = { beginTransaction, commitTransaction, rollbackTransaction };
