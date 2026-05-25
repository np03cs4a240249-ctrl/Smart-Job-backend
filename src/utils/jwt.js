const jwt = require('jsonwebtoken'); // import JWT library

// function to generate token for user login
const generateToken = (user) => {
    return jwt.sign(
        // data stored inside token
        { id: user.id, role: user.role },

        // secret key for signing token
        process.env.JWT_SECRET,

        // token expiry time
        { expiresIn: '1d' }
    );
};

// function to verify token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// export functions
module.exports = { generateToken, verifyToken };