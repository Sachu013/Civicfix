/**
 * CivicFix Phase 2 Safe Database Migration Utility
 * Migrates existing users and complaints to the final 6-department architecture:
 * 1. Roles: department_staff -> verifier, admin -> super_admin
 * 2. Departments: Normalizes legacy department codes (WATER_DRAINAGE -> WATER, WASTE_SANITATION -> WASTE, etc.)
 * 3. Scope: Unsets department fields for citizen & super_admin accounts
 * 4. Complaints: Normalizes department codes & re-links department ObjectIds safely
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const { DEFAULT_DEPARTMENTS, normalizeDepartmentCode } = require('../config/departmentConfig');

dotenv.config();

const runMigration = async () => {
    console.log('--- Starting CivicFix Phase 2 Database Migration ---');

    // 1. Ensure 6 Operational Departments exist in DB
    for (const deptData of DEFAULT_DEPARTMENTS) {
        await Department.findOneAndUpdate(
            { code: deptData.code },
            { $set: deptData },
            { upsert: true, returnDocument: 'after' }
        );
    }
    console.log('✓ Verified 6 Operational Department definitions in database.');

    const deptDocs = await Department.find({ active: true });
    const deptMap = {};
    deptDocs.forEach(d => {
        deptMap[d.code] = d._id;
    });

    // 2. Migrate User Roles and Department Codes
    const users = await User.find({});
    let usersUpdated = 0;

    for (const user of users) {
        let modified = false;

        // Legacy role migration
        if (user.role === 'department_staff') {
            user.role = 'verifier';
            modified = true;
        } else if (user.role === 'admin') {
            user.role = 'super_admin';
            modified = true;
        }

        // Department scope enforcement per role
        if (user.role === 'citizen' || user.role === 'super_admin') {
            if (user.departmentCode !== undefined || user.department !== undefined) {
                user.departmentCode = undefined;
                user.department = undefined;
                modified = true;
            }
        } else if (user.role === 'department_head' || user.role === 'verifier') {
            const normCode = normalizeDepartmentCode(user.departmentCode);
            if (user.departmentCode !== normCode || !user.department || user.department.toString() !== deptMap[normCode]?.toString()) {
                user.departmentCode = normCode;
                user.department = deptMap[normCode] || null;
                modified = true;
            }
        }

        if (modified) {
            await user.save();
            usersUpdated++;
        }
    }
    console.log(`✓ Migrated ${usersUpdated} user account(s) to Phase 2 role/department structure.`);

    // 3. Migrate Complaints Department Codes and ObjectIds
    const complaints = await Complaint.find({});
    let complaintsUpdated = 0;

    for (const complaint of complaints) {
        const normCode = normalizeDepartmentCode(complaint.departmentCode || complaint.category);
        const targetDeptId = deptMap[normCode] || null;

        let modified = false;
        if (complaint.departmentCode !== normCode) {
            complaint.departmentCode = normCode;
            modified = true;
        }
        if (targetDeptId && (!complaint.department || complaint.department.toString() !== targetDeptId.toString())) {
            complaint.department = targetDeptId;
            modified = true;
        }

        if (modified) {
            await complaint.save();
            complaintsUpdated++;
        }
    }
    console.log(`✓ Migrated ${complaintsUpdated} complaint record(s) to Phase 2 department architecture.`);

    console.log('--- Phase 2 Database Migration Complete ---');
};

if (require.main === module) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(async () => {
            await runMigration();
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = { runMigration };
