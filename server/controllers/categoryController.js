const taxonomy = require('../config/complaintCategories');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get complete civic issue category taxonomy
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
    const categories = taxonomy.getAllCategories();
    res.json(categories);
});

// @desc    Get category details by ID or Display Name
// @route   GET /api/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
    const cat = taxonomy.getCategoryByIdOrName(req.params.id);
    if (!cat) {
        return res.status(404).json({ message: 'Category not found' });
    }
    res.json(cat);
});

module.exports = {
    getCategories,
    getCategoryById,
};
