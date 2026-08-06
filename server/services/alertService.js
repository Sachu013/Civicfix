const Alert = require('../models/Alert');

const getAllAlerts = async () => {
    return await Alert.find({}).sort({ createdAt: -1 });
};

const createAlert = async (data) => {
    return await Alert.create(data);
};

module.exports = {
    getAllAlerts,
    createAlert,
};
