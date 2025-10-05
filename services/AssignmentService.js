const Roles = require('../constants/Roles');
const UserService = require('./UserService');
const AssignmentDAO = require('../dao/AssignmentDAO');
const uuidv4 = require('uuid').v4;
const S3 = require('../config/Aws');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { beginTransaction, commitTransaction, rollbackTransaction } = require('../utils/DatabaseTransaction');

/**
 * Creates a new assignment.
 * 
 * This function performs the following steps:
 * 1. Validates that the user creating the assignment is a tutor.
 * 2. Generates a unique file name for the assignment file.
 * 3. Uploads the file to AWS S3.
 * 4. Saves the assignment metadata to the database.
 * 5. Optionally maps the assignment to a list of students if provided.
 * 
 * @param {Object} assignmentData - The data for the assignment.
 * @returns {Promise<Object>} - The created assignment.
 * @throws {Error} - If the user is not a tutor or if an error occurs during the process.
 */
const createAssignment = async (assignmentData) => {
    console.log("IN AssignmentService.createAssignment");
    try {
        // Check if the user is a TUTOR
        const user = await UserService.getUserByUsername(assignmentData.username);
        if (user.roleId !== Roles.TUTOR) {
            const error = new Error('Only TUTORS can create assignments');
            error.status = 403; // Forbidden
            throw error;
        }

        // Generate a unique file name for S3
        const fileKey = `${uuidv4()}-${assignmentData.file.originalname}`;

        // Upload file to S3
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            Body: assignmentData.file.buffer,
            ContentType: assignmentData.file.mimetype,
        };

        await S3.send(new PutObjectCommand(params));
        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        // Begin transaction
        const client = await beginTransaction();
        try {
            // Save assignment meta data
            const savedAssignment = await AssignmentDAO.saveAssignment({
                ...assignmentData,
                fileUrl,
                createdBy: user.id,
            }, client);

            // Save the student - assignment mapping
            if (assignmentData.studentIds && assignmentData.studentIds.length > 0) {
                await AssignmentDAO.saveStudentAssignments(savedAssignment.id, assignmentData.studentIds, client);
            }

            // Commit transaction
            await commitTransaction(client);
            return savedAssignment;
        } catch (error) {
            // Rollback transaction in case of error
            await rollbackTransaction(client);
            throw error;
        }
    } catch (error) {
        throw error;
    } finally {
        console.log("OUT AssignmentService.createAssignment");
    }
};

/**
 * Updates an existing assignment.
 * 
 * This function performs the following steps:
 * 1. Validates that the user updating the assignment is a tutor.
 * 2. Fetches the existing assignment from the database.
 * 3. Ensures that the user is the creator of the assignment.
 * 4. If a new file is provided, uploads the file to AWS S3 and updates the file URL.
 * 5. Updates the assignment metadata in the database with the provided fields.
 * 
 * @param {string} assignmentId - The ID of the assignment to update.
 * @param {Object} updateData - The data to update the assignment with.
 * @returns {Promise<Object>} - The updated assignment.
 * @throws {Error} - If the user is not a tutor, the assignment is not found, or the user is not the creator of the assignment.
 */
const updateAssignment = async (assignmentId, updateData) => {
    console.log("IN AssignmentService.updateAssignment", { assignmentId });
    try {
        // Check if the user is a TUTOR
        const user = await UserService.getUserByUsername(updateData.username);
        if (user.roleId !== Roles.TUTOR) {
            const error = new Error('Only TUTORS can update assignments');
            error.status = 403; // Forbidden
            throw error;
        }

        // Fetch the existing assignment
        const existingAssignment = await AssignmentDAO.getAssignmentById(assignmentId);
        if (!existingAssignment) {
            const error = new Error('Assignment not found');
            error.status = 404; // Not Found
            throw error;
        }
        
        // Ensure the user is the creator of the assignment
        if (existingAssignment.tutorId !== user.id) {
            const error = new Error('You can only update assignments you created');
            error.status = 403; // Forbidden
            throw error;
        }

        // Handle file upload if a new file is provided
        if (updateData.file) {
            const fileKey = `${uuidv4()}-${updateData.file.originalname}`;
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: fileKey,
                Body: updateData.file.buffer,
                ContentType: updateData.file.mimetype,
            };

            await S3.send(new PutObjectCommand(params));
            updateData.fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        }

        // Update the assignment with only the provided fields
        const updatedAssignment = await AssignmentDAO.updateAssignment(assignmentId, updateData);
        return updatedAssignment;
    } catch (error) {
        throw error;
    } finally {
        console.log("OUT AssignmentService.updateAssignment");
    }
};

/**
 * Deletes an existing assignment.
 * 
 * This function performs the following steps:
 * 1. Validates that the user deleting the assignment is a tutor.
 * 2. Fetches the existing assignment from the database.
 * 3. Ensures that the user is the creator of the assignment.
 * 4. Deletes the associated file from AWS S3 if it exists.
 * 5. Deletes the assignment metadata from the database.
 * 
 * @param {string} assignmentId - The ID of the assignment to delete.
 * @param {string} username - The username of the user deleting the assignment.
 * @returns {Promise<void>} - Resolves when the assignment is deleted.
 * @throws {Error} - If the user is not a tutor, the assignment is not found, or the user is not the creator of the assignment.
 */
const deleteAssignment = async (assignmentId, username) => {
    console.log("IN AssignmentService.deleteAssignment", { assignmentId });
    try {
        // Check if the user is a TUTOR
        const user = await UserService.getUserByUsername(username);
        if (user.roleId !== Roles.TUTOR) {
            const error = new Error('Only TUTORS can delete assignments');
            error.status = 403; // Forbidden
            throw error;
        }

        // Fetch the existing assignment
        const existingAssignment = await AssignmentDAO.getAssignmentById(assignmentId);
        if (!existingAssignment) {
            const error = new Error('Assignment not found');
            error.status = 404; // Not Found
            throw error;
        }

        // Ensure the user is the creator of the assignment
        if (existingAssignment.tutorId !== user.id) {
            const error = new Error('You can only delete assignments you created');
            error.status = 403; // Forbidden
            throw error;
        }

        // Delete the file from S3 if it exists
        if (existingAssignment.s3Url) {
            const fileKey = existingAssignment.s3Url.split('/').pop();
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: fileKey,
            };

            await S3.send(new DeleteObjectCommand(params));
        }

        // Delete the assignment from the database
        await AssignmentDAO.deleteAssignment(assignmentId);
    } catch (error) {
        throw error;
    } finally {
        console.log("OUT AssignmentService.deleteAssignment");
    }
};

/**
 * Retrieves assignments based on the user's role and filters.
 * 
 * This function performs the following steps:
 * 1. Fetches the user to determine their role.
 * 2. If the user is a tutor, retrieves assignments created by the tutor.
 * 3. If the user is a student, retrieves assignments assigned to the student.
 * 4. Throws an error if the user's role is invalid.
 * 
 * @param {string} username - The username of the user retrieving assignments.
 * @param {Object} filters - The filters to apply when retrieving assignments.
 * @returns {Promise<Array<Object>>} - The list of assignments.
 * @throws {Error} - If the user's role is invalid.
 */
const getAssignments = async (username, filters) => {
    console.log("IN AssignmentService.getAssignments", { username });
    try {
        // Fetch the user to determine their role
        const user = await UserService.getUserByUsername(username);

        if (user.roleId === Roles.TUTOR) {
            // If the user is a tutor, fetch assignments created by the tutor
            return await AssignmentDAO.getTutorAssignments(user.id, filters);
        } else if (user.roleId === Roles.STUDENT) {
            // If the user is a student, fetch assignments assigned to the student
            return await AssignmentDAO.getStudentAssignments(user.id, filters);
        } else {
            const error = new Error('Invalid role');
            error.status = 403; // Forbidden
            throw error;
        }
    } catch (error) {
        throw error;
    } finally {
        console.log("OUT AssignmentService.getAssignments");
    }
};

module.exports = { createAssignment, updateAssignment, deleteAssignment, getAssignments };