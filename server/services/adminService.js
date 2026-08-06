const Complaint = require('../models/Complaint');
const ErrorResponse = require('../utils/errorResponse');

const getAllComplaints = async () => {
    return await Complaint.find({}).populate('user', 'name email');
};

const updateComplaint = async (id, updateData) => {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    complaint.status = updateData.status || complaint.status;
    complaint.assignedDepartment = updateData.assignedDepartment || complaint.assignedDepartment;
    complaint.adminResponse = updateData.adminResponse || complaint.adminResponse;
    complaint.urgency = updateData.urgency || complaint.urgency;

    const updatedComplaint = await complaint.save();
    return updatedComplaint;
};

const getDashboardMetrics = async () => {
    const total = await Complaint.countDocuments({});
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newToday = await Complaint.countDocuments({ createdAt: { $gte: startOfDay } });

    const categoryStats = await Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const statusStats = await Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return {
        total,
        pending,
        inProgress,
        resolved,
        newToday,
        categoryStats,
        statusStats
    };
};

module.exports = {
    getAllComplaints,
    updateComplaint,
    getDashboardMetrics,
};
