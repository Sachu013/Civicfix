const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        categories: [
            {
                type: String,
            },
        ],
        subcategories: [
            {
                type: String,
            },
        ],
        active: {
            type: Boolean,
            default: true,
        },
        contactInformation: {
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
            officeLocation: { type: String, default: '' },
            headName: { type: String, default: '' },
        },
        slaConfig: {
            critical: { type: Number, default: 24 },   // in hours
            high: { type: Number, default: 72 },       // in hours
            medium: { type: Number, default: 168 },    // in hours
            low: { type: Number, default: 336 },       // in hours
        },
    },
    { timestamps: true }
);

departmentSchema.index({ active: 1 });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
