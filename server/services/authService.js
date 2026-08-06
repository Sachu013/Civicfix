const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

const registerUser = async ({ name, email, password, role }) => {
    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new ErrorResponse('User already exists', 400);
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'citizen',
    });

    return user;
};

const loginUser = async (email, password) => {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        return user;
    }

    throw new ErrorResponse('Invalid email or password', 401);
};

module.exports = {
    registerUser,
    loginUser,
};
