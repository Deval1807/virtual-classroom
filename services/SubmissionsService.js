const Roles = require('../constants/Roles');
const UserService = require('./UserService');
const SubmissionsDAO = require('../dao/SubmissionsDAO');
const uuidv4 = require('uuid').v4;
const S3 = require('../config/Aws');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { beginTransaction, commitTransaction, rollbackTransaction } = require('../utils/DatabaseTransaction');
const { getStudentAssignment } = require('../dao/SubmissionsDAO');

/**
 * Adds a new submission for an assignment.
 * 
 * This function performs the following steps:
 * 1. Fetches the user ID using the provided username.
 * 2. Validates that the user has a STUDENT role.
 * 3. Validates that the student has been assigned the assignment.
 * 4. Generates a unique file name for the submission file.
 * 5. Uploads the file to AWS S3.
 * 6. Saves the submission metadata to the database.
 * 7. Updates the status of the student assignment to "SUBMITTED".
 * 8. Uses a database transaction to ensure data integrity.
 * 
 * @param {Object} submissionData - The data for the submission.
 * @returns {Promise<Object>} - The created submission.
 * @throws {Error} - If an error occurs during the process.
 */
const addSubmission = async (submissionData) => {
    console.log("IN SubmissionsService.addSubmission", { assignmentId: submissionData.assignmentId });
    const { assignmentId, studentUsername, file } = submissionData;

    // Fetch the user using the username
    const user = await UserService.getUserByUsername(studentUsername);

    // Check if the user's role is STUDENT
    if (user.roleId !== Roles.STUDENT) {
        const error = new Error('Only students can submit assignments');
        error.status = 403; // Forbidden
        throw error;
    }

    // Validate that the student has been assigned the assignment
    const studentAssignment = await getStudentAssignment(assignmentId, user.id);
    if (!studentAssignment) {
        const error = new Error('Student has not been assigned this assignment');
        error.status = 403; // Forbidden
        throw error;
    }

    // Generate a unique file name for S3
    const fileKey = `${uuidv4()}-${file.originalname}`;

    // Upload file to S3
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    await S3.send(new PutObjectCommand(params));
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // Use a transaction for database operations
    const client = await beginTransaction();
    try {
        // Save the submission in the database
        const submission = await SubmissionsDAO.saveSubmission(assignmentId, user.id, fileUrl, client);

        // Update the status in tblt_student_assignments to SUBMITTED
        await SubmissionsDAO.updateStudentAssignmentStatus(assignmentId, user.id, client);

        await commitTransaction(client);
        return submission;
    } catch (error) {
        await rollbackTransaction(client);
        throw error;
    } finally {
        console.log("OUT SubmissionsService.addSubmission");
    }
};

/**
 * Retrieves assignment details based on the user's role.
 * 
 * This function performs the following steps:
 * 1. Fetches the user to determine their role.
 * 2. If the user is a tutor, retrieves all submissions for the assignment.
 * 3. If the user is a student, retrieves only their submission for the assignment.
 * 4. Throws an error if the user's role is invalid.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} username - The username of the user requesting the details.
 * @returns {Promise<Object|Array<Object>>} - The assignment details or submissions.
 * @throws {Error} - If the user's role is invalid.
 */
const getAssignmentDetails = async (assignmentId, username) => {
    console.log("IN SubmissionsService.getAssignmentDetails", { assignmentId, username });
    const user = await UserService.getUserByUsername(username);

    if (user.roleId === Roles.TUTOR) {
        // If the user is a tutor, fetch all submissions for the assignment
        return await SubmissionsDAO.getSubmissionsForTutor(assignmentId);
    } else if (user.roleId === Roles.STUDENT) {
        // If the user is a student, fetch only their submission for the assignment
        return await SubmissionsDAO.getSubmissionForStudent(assignmentId, user.id);
    } else {
        const error = new Error('Invalid role');
        error.status = 403; // Forbidden
        throw error;
    }
    console.log("OUT SubmissionsService.getAssignmentDetails");
};

module.exports = { addSubmission, getAssignmentDetails };