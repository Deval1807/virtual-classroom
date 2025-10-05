const express = require('express');
const SubmissionsController = require('../controllers/SubmissionsController')
const router = express.Router();
const upload = require('../middlewares/FileUpload');

// Route to add a submission
router.post('/', upload.single('file'), SubmissionsController.addSubmission);

// Route to get submissions for an assignment
router.get('/:assignmentId', SubmissionsController.getAssignmentDetails);

module.exports = router;