const LoginService = require('../services/LoginService');

/**
 * Handles user login requests.
 * 
 * @param {Object} req - The HTTP request object containing username and password.
 * @param {Object} res - The HTTP response object.
 * @returns {Object} JSON response containing a token on success or an error message on failure.
 */
const LoginUser = async (req, res) => {
    console.log("IN LoginController.LoginUser", { username: req.body.username });
    try {
        const { username, password } = req.body;
        const token = await LoginService.loginUser(username, password);
        return res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: `${error}` });
    } finally {
        console.log("OUT LoginController.LoginUser");
    }
};

module.exports = { LoginUser };