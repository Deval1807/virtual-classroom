const SubmissionsService = require('../services/SubmissionsService');

/**
 * Adds a new submission for an assignment.
 * 
 * @param {Object} req - The request object containing submission data.
 * @param {Object} res - The response object to send the result.
 */
const addSubmission = async (req, res) => {
    console.log("IN SubmissionsController.addSubmission", { assignmentId: req.body.assignmentId });
    try {
        const submissionData = {
            assignmentId: req.body.assignmentId,
            studentUsername: req.username,
            file: req.file,
        };

        const submission = await SubmissionsService.addSubmission(submissionData);
        res.status(201).json({ message: 'Submission added successfully', submission });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ message: error.message || 'Error adding submission' });
    } finally {
        console.log("OUT SubmissionsController.addSubmission");
    }
};

/**
 * Retrieves the details of an assignment for a specific user.
 * 
 * @param {Object} req - The request object containing assignment ID and user information.
 * @param {Object} res - The response object to send the result.
 */
const getAssignmentDetails = async (req, res) => {
    console.log("IN SubmissionsController.getAssignmentDetails", { assignmentId: req.params.assignmentId });
    try {
        const assignmentId = req.params.assignmentId;
        const username = req.username;

        const assignmentDetails = await SubmissionsService.getAssignmentDetails(assignmentId, username);
        res.status(200).json({ assignmentDetails });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ message: error.message || 'Error fetching assignment details' });
    } finally {
        console.log("OUT SubmissionsController.getAssignmentDetails");
    }
};

module.exports = { addSubmission, getAssignmentDetails };