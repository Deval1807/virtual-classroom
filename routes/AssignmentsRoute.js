const express = require('express');
const upload = require('../middlewares/FileUpload');
const { createAssignment, getAssignments, updateAssignment, deleteAssignment } = require('../controllers/AssignmentsController');

const router = express.Router();

// Route to create an assignment
router.post('/', upload.single('file'), createAssignment);

// Route to get all assignments
router.get('/', getAssignments);

// Route to update an assignment
router.patch('/:id', updateAssignment);

// Route to delete an assignment
router.delete('/:id', deleteAssignment);

module.exports = router;