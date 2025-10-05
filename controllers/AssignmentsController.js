const CreateAssignmentRequest = require('../models/CreateAssignmentRequest');
const AssignmentService = require('../services/AssignmentService');

/**
 * Creates a new assignment.
 * Validates and structures the request using the CreateAssignmentRequest model,
 * then calls the AssignmentService to create the assignment.
 * 
 * @param {Object} req - The HTTP request object containing assignment details.
 * @param {Object} res - The HTTP response object.
 */
const createAssignment = async (req, res) => {
    console.log("IN AssignmentsController.createAssignment");
    try {
        // Use the CreateAssignmentRequest model to validate and structure the request
        const createAssignmentRequest = new CreateAssignmentRequest({
            title: req.body.title,
            description: req.body.description,
            publishedAt: req.body.publishedAt,
            dueDate: req.body.dueDate,
            file: req.file,
            username: req.username,
            studentIds: req.body.studentIds
        });

        const assignment = await AssignmentService.createAssignment(createAssignmentRequest);
        res.status(201).json({ message: 'Assignment created successfully', assignment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Error creating assignment' });
    } finally {
        console.log("OUT AssignmentsController.createAssignment");
    }
};

/**
 * Updates an existing assignment.
 * Accepts partial updates and calls the AssignmentService to update the assignment.
 * 
 * @param {Object} req - The HTTP request object containing assignment ID and update details.
 * @param {Object} res - The HTTP response object.
 */
const updateAssignment = async (req, res) => {
    console.log("IN AssignmentsController.updateAssignment", { assignmentId: req.params.id });
    try {
        const assignmentId = req.params.id;
        const updateData = {};

        // Only include fields that are provided in the request
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate;
        if (req.body.publishedAt !== undefined) updateData.publishedAt = req.body.publishedAt;
        if (req.file !== undefined) updateData.file = req.file;
        updateData.username = req.username;

        const updatedAssignment = await AssignmentService.updateAssignment(assignmentId, updateData);
        res.status(200).json({ message: 'Assignment updated successfully', updatedAssignment });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ message: error.message || 'Error updating assignment' });
    } finally {
        console.log("OUT AssignmentsController.updateAssignment");
    }
};

/**
 * Deletes an assignment.
 * Calls the AssignmentService to delete the assignment based on the provided ID and username.
 * 
 * @param {Object} req - The HTTP request object containing assignment ID.
 * @param {Object} res - The HTTP response object.
 */
const deleteAssignment = async (req, res) => {
    console.log("IN AssignmentsController.deleteAssignment", { assignmentId: req.params.id });
    try {
        const assignmentId = req.params.id;
        const username = req.username;

        // Call the service to delete the assignment
        await AssignmentService.deleteAssignment(assignmentId, username);
        res.status(200).json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ message: error.message || 'Error deleting assignment' });
    } finally {
        console.log("OUT AssignmentsController.deleteAssignment");
    }
};

/**
 * Retrieves assignments for the user.
 * Filters assignments based on query parameters such as publishedAt and status.
 * 
 * @param {Object} req - The HTTP request object containing query parameters.
 * @param {Object} res - The HTTP response object.
 */
const getAssignments = async (req, res) => {
    console.log("IN AssignmentsController.getAssignments");
    try {
        const username = req.username;
        const filters = {
            publishedAt: req.query.publishedAt, // SCHEDULED or ONGOING
            status: req.query.status, // ALL, PENDING, OVERDUE, SUBMITTED (for students only)
        };

        const assignments = await AssignmentService.getAssignments(username, filters);
        res.status(200).json({ assignments });
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ message: error.message || 'Error fetching assignments' });
    } finally {
        console.log("OUT AssignmentsController.getAssignments");
    }
};

module.exports = { createAssignment, getAssignments, updateAssignment, deleteAssignment };