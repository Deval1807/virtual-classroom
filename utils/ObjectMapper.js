/**
 * Converts an object's keys from snake_case to camelCase.
 * 
 * This function performs the following steps:
 * 1. Checks if the input is a valid object. If not, returns the input as is.
 * 2. Iterates over the object's keys and converts each key from snake_case to camelCase.
 * 3. Returns a new object with the transformed keys.
 * 
 * @param {Object} obj - The object whose keys need to be converted.
 * @returns {Object} - A new object with keys in camelCase.
 */
const snakeToCamel = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
        acc[camelKey] = obj[key];
        return acc;
    }, {});
};

module.exports = { snakeToCamel };
