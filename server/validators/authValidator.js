const registerValidator = (data) => {
    let error = '';
    let isValid = true;

    if (!data.name) {
        error = 'Name is required';
        isValid = false;
    } else if (!data.email) {
        error = 'Email is required';
        isValid = false;
    } else if (!data.password) {
        error = 'Password is required';
        isValid = false;
    }

    return { error, isValid };
};

const loginValidator = (data) => {
    let error = '';
    let isValid = true;

    if (!data.email) {
        error = 'Email is required';
        isValid = false;
    } else if (!data.password) {
        error = 'Password is required';
        isValid = false;
    }

    return { error, isValid };
};

module.exports = { registerValidator, loginValidator };
