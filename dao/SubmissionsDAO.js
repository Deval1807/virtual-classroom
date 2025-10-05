const pool = require('../config/Database');
const { snakeToCamel } = require('../utils/ObjectMapper');
const SubmissionStatus = require('../constants/SubmissionStatus');

/**
 * Saves a new submission for an assignment in the database.
 * 
 * This function performs the following steps:
 * 1. Inserts a new record into the `tblt_submissions` table with the provided assignment ID, student ID, and file URL.
 * 2. Returns the saved submission object with keys converted to camelCase.
 * 
 * @param {string} assignmentId - The ID of the assignment being submitted.
 * @param {string} studentId - The ID of the student making the submission.
 * @param {string} fileUrl - The URL of the submitted file stored in S3.
 * @param {Object} client - The database client with an active transaction.
 * @returns {Promise<Object>} - The saved submission object with camelCase keys.
 * @throws {Error} - If an error occurs during the database operation.
 */
const saveSubmission = async (assignmentId, studentId, fileUrl, client) => {
    console.log("IN SubmissionsDAO.saveSubmission", { assignmentId, studentId });
    try {
        const query = `
            INSERT INTO classroom.tblm_submissions (assignment_id, student_id, s3_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [assignmentId, studentId, fileUrl];

        const result = await client.query(query, values);
        const submission = snakeToCamel(result.rows[0]);
        console.log("OUT SubmissionsDAO.saveSubmission", { submission });
        return submission;
    } catch (error) {
        console.error("Error saving submission:", error);
        throw error;
    }
};

/**
 * Updates the status of a student assignment to "SUBMITTED".
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to update the `status_id` field in the `tblt_student_assignments` table.
 * 2. Sets the status to `SUBMITTED` for the given assignment ID and student ID.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} studentId - The ID of the student.
 * @param {Object} client - The database client with an active transaction.
 * @returns {Promise<void>} - Resolves when the update is complete.
 * @throws {Error} - If an error occurs during the database operation.
 */
const updateStudentAssignmentStatus = async (assignmentId, studentId, client) => {
    console.log("IN SubmissionsDAO.updateStudentAssignmentStatus", { assignmentId, studentId });
    try {
        const query = `
            UPDATE classroom.tblt_student_assignments
            SET status_id = $3
            WHERE assignment_id = $1 AND student_id = $2;
        `;
        const values = [assignmentId, studentId, SubmissionStatus.SUBMITTED];

        await client.query(query, values);
        console.log("OUT SubmissionsDAO.updateStudentAssignmentStatus");
    } catch (error) {
        console.error("Error updating student assignment status:", error);
        throw error;
    }
};

/**
 * Retrieves all submissions for a specific assignment for a tutor.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch all submissions for the given assignment ID.
 * 2. Joins the `tblt_submissions` table with the `tblm_users` table to include student details.
 * 3. Converts the database result's keys from snake_case to camelCase.
 * 4. Returns an array of submissions.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @returns {Promise<Array<Object>>} - An array of submissions with camelCase keys.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getSubmissionsForTutor = async (assignmentId) => {
    console.log("IN SubmissionsDAO.getSubmissionsForTutor", { assignmentId });
    try {
        const query = `
            SELECT s.*, u.username
            FROM classroom.tblm_submissions s
            JOIN classroom.tblm_users u ON s.student_id = u.id
            WHERE s.assignment_id = $1;
        `;
        const values = [assignmentId];

        const result = await pool.query(query, values);
        const submissions = result.rows.map(snakeToCamel);
        console.log("OUT SubmissionsDAO.getSubmissionsForTutor", { resultSize: submissions.length });
        return submissions;
    } catch (error) {
        console.error("Error fetching submissions for tutor:", error);
        throw error;
    }
};

/**
 * Retrieves a specific submission for a student for a given assignment.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch the submission for the given assignment ID and student ID.
 * 2. Converts the database result's keys from snake_case to camelCase.
 * 3. Returns the submission object if found, otherwise returns `null`.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<Object|null>} - The submission object with camelCase keys, or `null` if no submission is found.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getSubmissionForStudent = async (assignmentId, studentId) => {
    console.log("IN SubmissionsDAO.getSubmissionForStudent", { assignmentId, studentId });
    try {
        const query = `
            SELECT * 
            FROM classroom.tblm_submissions 
            WHERE assignment_id = $1 AND student_id = $2;
        `;
        const values = [assignmentId, studentId];

        const result = await pool.query(query, values);
        const submission = result.rows.length > 0 ? snakeToCamel(result.rows[0]) : null;
        console.log("OUT SubmissionsDAO.getSubmissionForStudent", { submission });
        return submission;
    } catch (error) {
        console.error("Error fetching submission for student:", error);
        throw error;
    }
};

/**
 * Checks if a student has been assigned a specific assignment.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<Object|null>} - The student assignment record if found, otherwise `null`.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getStudentAssignment = async (assignmentId, studentId) => {
    console.log("IN SubmissionsDAO.getStudentAssignment", { assignmentId, studentId });
    try {
        const query = `
            SELECT * 
            FROM classroom.tblt_student_assignments
            WHERE assignment_id = $1 AND student_id = $2;
        `;
        const values = [assignmentId, studentId];

        const result = await pool.query(query, values);
        const studentAssignment = result.rows.length > 0 ? result.rows[0] : null;
        console.log("OUT SubmissionsDAO.getStudentAssignment", { studentAssignment });
        return studentAssignment;
    } catch (error) {
        console.error("Error fetching student assignment:", error);
        throw error;
    }
};

module.exports = { 
    saveSubmission, 
    getSubmissionsForTutor, 
    getSubmissionForStudent, 
    updateStudentAssignmentStatus,
    getStudentAssignment 
};
