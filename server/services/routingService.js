const Department = require('../models/Department');
const taxonomy = require('../config/complaintCategories');
const { CATEGORY_TO_DEPARTMENT_CODE, LEGACY_CATEGORY_TO_DEPARTMENT_CODE } = require('../config/departmentConfig');

/**
 * Determines target department code based on category hierarchy.
 * Priority: finalClassification -> aiClassification -> citizen classification -> GENERAL
 */
const determineDepartmentCode = ({ category, subcategory, aiClassification, finalClassification }) => {
    let targetCat = category;
    let targetSub = subcategory;

    if (finalClassification && finalClassification.category) {
        targetCat = finalClassification.category;
        targetSub = finalClassification.subcategory;
    } else if (aiClassification && aiClassification.category) {
        targetCat = aiClassification.category;
        targetSub = aiClassification.subcategory;
    }

    if (!targetCat) {
        return 'GENERAL';
    }

    // Try normalizing through central taxonomy
    const norm = taxonomy.normalizeCategory(targetCat, targetSub);
    if (norm && norm.id && CATEGORY_TO_DEPARTMENT_CODE[norm.id]) {
        return CATEGORY_TO_DEPARTMENT_CODE[norm.id];
    }

    // Check legacy category mapping
    if (LEGACY_CATEGORY_TO_DEPARTMENT_CODE[targetCat]) {
        return LEGACY_CATEGORY_TO_DEPARTMENT_CODE[targetCat];
    }

    return 'GENERAL';
};

/**
 * Resolves full Department document from DB using determined department code.
 */
const determineDepartment = async ({ category, subcategory, aiClassification, finalClassification }) => {
    const code = determineDepartmentCode({ category, subcategory, aiClassification, finalClassification });

    let department = await Department.findOne({ code, active: true });

    if (!department && code !== 'GENERAL') {
        department = await Department.findOne({ code: 'GENERAL', active: true });
    }

    return {
        code: department ? department.code : code,
        name: department ? department.name : 'General Administration',
        departmentId: department ? department._id : null,
        departmentDoc: department || null,
    };
};

const determineDepartmentFromCategory = async (categoryInput) => {
    return await determineDepartment({ category: categoryInput });
};

const determineDepartmentFromSubcategory = async (subcategoryInput) => {
    return await determineDepartment({ subcategory: subcategoryInput });
};

const validateDepartment = async (departmentCode) => {
    if (!departmentCode) return false;
    const dept = await Department.findOne({ code: departmentCode.toUpperCase(), active: true });
    return !!dept;
};

const getDepartmentForComplaint = async (complaint) => {
    if (!complaint) return null;
    return await determineDepartment({
        category: complaint.category,
        subcategory: complaint.subcategory,
        aiClassification: complaint.aiClassification,
        finalClassification: complaint.finalClassification,
    });
};

module.exports = {
    determineDepartmentCode,
    determineDepartment,
    determineDepartmentFromCategory,
    determineDepartmentFromSubcategory,
    validateDepartment,
    getDepartmentForComplaint,
};
