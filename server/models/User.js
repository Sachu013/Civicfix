const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: false, unique: true, sparse: true },
        password: { type: String, required: false },
        phone: { type: String, sparse: true, unique: true, trim: true },
        role: {
            type: String,
            enum: ['citizen', 'super_admin', 'department_head', 'verifier'],
            default: 'citizen',
        },
        departmentCode: {
            type: String,
            default: undefined,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
        },
    },
    { timestamps: true }
);

userSchema.pre('validate', function () {
    // Migrate legacy roles gracefully before validation
    if (this.role === 'department_staff') {
        this.role = 'verifier';
    }
    if (this.role === 'admin') {
        this.role = 'super_admin';
    }

    // Enforce role-based department rules
    if (this.role === 'citizen' || this.role === 'super_admin') {
        this.departmentCode = undefined;
        this.department = undefined;
    } else if (this.role === 'department_head' || this.role === 'verifier') {
        if (this.departmentCode) {
            const { normalizeDepartmentCode } = require('../config/departmentConfig');
            this.departmentCode = normalizeDepartmentCode(this.departmentCode);
        }
    }
});

userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Sync indexes to rebuild legacy email_1 index as sparse unique in MongoDB Atlas
User.syncIndexes().catch((err) => {
    console.warn('[User Model] Sync indexes warning:', err.message);
});

module.exports = User;
