const Feedback = require('../models/Feedback');

const getAllFeedback = async () => {
    return await Feedback.find({}).populate('user', 'name').sort({ createdAt: -1 });
};

const createFeedback = async (data) => {
    return await Feedback.create(data);
};

module.exports = {
    getAllFeedback,
    createFeedback,
};
