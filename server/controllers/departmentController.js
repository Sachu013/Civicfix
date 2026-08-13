const Department = require('../models/Department');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active departments
// @route   GET /api/departments
const getAllDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({ active: true }).sort({ name: 1 });
    res.json(departments);
});

// @desc    Get department by ID or Code
// @route   GET /api/departments/:id
const getDepartmentById = asyncHandler(async (req, res) => {
    let department = await Department.findById(req.params.id);
    if (!department) {
        department = await Department.findOne({ code: req.params.id.toUpperCase() });
    }
    if (!department) {
        throw new ErrorResponse('Department not found', 404);
    }
    res.json(department);
});

// @desc    Create a new department (Admin only)
// @route   POST /api/departments
const createDepartment = asyncHandler(async (req, res) => {
    const { name, code, description, categories, subcategories, contactInformation, slaConfig } = req.body;

    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) {
        throw new ErrorResponse(`Department with code '${code}' already exists`, 400);
    }

    const department = await Department.create({
        name,
        code: code.toUpperCase(),
        description,
        categories: categories || [],
        subcategories: subcategories || [],
        contactInformation: contactInformation || {},
        slaConfig: slaConfig || {},
    });

    res.status(201).json(department);
});

// @desc    Update a department (Admin only)
// @route   PUT /api/departments/:id
const updateDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);
    if (!department) {
        throw new ErrorResponse('Department not found', 404);
    }

    if (req.body.name) department.name = req.body.name;
    if (req.body.description) department.description = req.body.description;
    if (req.body.categories) department.categories = req.body.categories;
    if (req.body.subcategories) department.subcategories = req.body.subcategories;
    if (req.body.active !== undefined) department.active = req.body.active;
    if (req.body.contactInformation) department.contactInformation = { ...department.contactInformation, ...req.body.contactInformation };
    if (req.body.slaConfig) department.slaConfig = { ...department.slaConfig, ...req.body.slaConfig };

    const updated = await department.save();
    res.json(updated);
});

module.exports = {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
};
