const Announcement = require('../models/Announcement');

const getAllAnnouncements = async () => {
    return await Announcement.find({}).sort({ createdAt: -1 });
};

const createAnnouncement = async (data) => {
    return await Announcement.create(data);
};

module.exports = {
    getAllAnnouncements,
    createAnnouncement,
};
