const validate = (validatorFn) => {
    return (req, res, next) => {
        const { error, isValid } = validatorFn(req.body);
        if (!isValid) {
            return res.status(400).json({ message: error });
        }
        next();
    };
};

module.exports = validate;
