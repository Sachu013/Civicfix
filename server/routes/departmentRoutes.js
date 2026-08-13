const express = require('express');
const router = express.Router();
const {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
} = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', protect, admin, createDepartment);
router.put('/:id', protect, admin, updateDepartment);

module.exports = router;
