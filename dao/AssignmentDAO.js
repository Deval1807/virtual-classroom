const pool = require('../config/Database');
const SubmissionStatus = require('../constants/SubmissionStatus');
const { snakeToCamel } = require('../utils/ObjectMapper');

/**
 * Saves a new assignment in the database.
 * 
 * This function performs the following steps:
 * 1. Inserts a new record into the `tblm_assignments` table with the provided assignment data.
 * 2. Returns the saved assignment object with keys converted to camelCase.
 * 
 * @param {Object} assignmentData - The data for the assignment.
 * @param {Object} [client=pool] - The database client to use for the query.
 * @returns {Promise<Object>} - The saved assignment object with camelCase keys.
 * @throws {Error} - If an error occurs during the database operation.
 */
const saveAssignment = async (assignmentData, client = pool) => {
    console.log("IN AssignmentDAO.saveAssignment", { title: assignmentData.title });
    try {
        const { title, description, publishedAt, dueDate, fileUrl, createdBy } = assignmentData;

        const query = `
            INSERT INTO classroom.tblm_assignments 
            (tutor_id, title, description, published_at, deadline, s3_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [createdBy, title, description, publishedAt, dueDate, fileUrl];

        const result = await client.query(query, values);
        const assignment = snakeToCamel(result.rows[0]);
        console.log("OUT AssignmentDAO.saveAssignment", { assignment });
        return assignment;
    } catch (error) {
        console.error("Error saving assignment:", error);
        throw error;
    }
};

/**
 * Retrieves an assignment by its ID.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch the assignment details from the `tblm_assignments` table using the provided assignment ID.
 * 2. Converts the database result's keys from snake_case to camelCase.
 * 3. Returns the assignment object if found, otherwise returns `null`.
 * 
 * @param {string} assignmentId - The ID of the assignment to retrieve.
 * @returns {Promise<Object|null>} - The assignment object with camelCase keys, or `null` if no assignment is found.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getAssignmentById = async (assignmentId) => {
    console.log("IN AssignmentDAO.getAssignmentById", { assignmentId });
    try {
        const query = `
            SELECT * 
            FROM classroom.tblm_assignments 
            WHERE id = $1
        `;
        const values = [assignmentId];

        const result = await pool.query(query, values);
        const assignment = result.rows.length > 0 ? snakeToCamel(result.rows[0]) : null;
        console.log("OUT AssignmentDAO.getAssignmentById", { assignment });
        return assignment;
    } catch (error) {
        console.error("Error fetching assignment by ID:", error);
        throw error;
    }
};

/**
 * Saves student assignments in the database.
 * 
 * This function performs the following steps:
 * 1. Inserts records into the `tblt_student_assignments` table for the provided assignment ID and student IDs.
 * 2. Sets the initial status of the assignments to "PENDING".
 * 3. Ignores duplicate entries using the `ON CONFLICT` clause.
 * 
 * @param {string} assignmentId - The ID of the assignment.
 * @param {Array<string>} studentIds - The IDs of the students to assign the assignment to.
 * @param {Object} [client=pool] - The database client to use for the query.
 * @returns {Promise<void>} - Resolves when the operation is complete.
 * @throws {Error} - If an error occurs during the database operation.
 */
const saveStudentAssignments = async (assignmentId, studentIds, client = pool) => {
    console.log("IN AssignmentDAO.saveStudentAssignments", { assignmentId, studentCount: studentIds.length });
    try {
        // parse the studentIds if it's a string
        if (typeof studentIds === 'string') {
            studentIds = JSON.parse(studentIds);
        }
        studentIds = studentIds.map(Number);

        const query = `
            INSERT INTO classroom.tblt_student_assignments (assignment_id, student_id, status_id)
            VALUES ${studentIds.map((_, index) => `($1, $${index + 2}, $${studentIds.length + 2})`).join(', ')}
            ON CONFLICT (assignment_id, student_id) DO NOTHING;
        `;

        const values = [assignmentId, ...studentIds, SubmissionStatus.PENDING];

        await client.query(query, values);
        console.log("OUT AssignmentDAO.saveStudentAssignments");
    } catch (error) {
        console.error("Error saving student assignments:", error);
        throw error;
    }
};

/**
 * Updates an existing assignment in the database.
 * 
 * This function performs the following steps:
 * 1. Dynamically builds the SQL query based on the fields provided in the `updateData` object.
 * 2. Updates the specified fields in the `tblm_assignments` table for the given assignment ID.
 * 3. Returns the updated assignment object with keys converted to camelCase.
 * 
 * @param {string} assignmentId - The ID of the assignment to update.
 * @param {Object} updateData - The fields to update in the assignment.
 * @returns {Promise<Object>} - The updated assignment object with camelCase keys.
 * @throws {Error} - If no fields are provided to update or if an error occurs during the database operation.
 */
const updateAssignment = async (assignmentId, updateData) => {
    console.log("IN AssignmentDAO.updateAssignment", { assignmentId });
    try {
        const fields = [];
        const values = [];
        let index = 1;

        // Dynamically build the query based on provided fields
        if (updateData.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(updateData.title);
        }
        if (updateData.description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(updateData.description);
        }
        if (updateData.dueDate !== undefined) {
            fields.push(`deadline = $${index++}`);
            values.push(updateData.dueDate);
        }
        if (updateData.publishedAt !== undefined) {
            fields.push(`published_at = $${index++}`);
            values.push(updateData.publishedAt);
        }
        if (updateData.fileUrl !== undefined) {
            fields.push(`s3_url = $${index++}`);
            values.push(updateData.fileUrl);
        }

        if (fields.length === 0) {
            throw new Error('No fields provided to update');
        }

        values.push(assignmentId);

        const query = `
            UPDATE classroom.tblm_assignments
            SET ${fields.join(', ')}
            WHERE id = $${index}
            RETURNING *;
        `;

        const result = await pool.query(query, values);
        const updatedAssignment = snakeToCamel(result.rows[0]);
        console.log("OUT AssignmentDAO.updateAssignment", { updatedAssignment });
        return updatedAssignment;
    } catch (error) {
        console.error("Error updating assignment:", error);
        throw error;
    }
};

/**
 * Deletes an assignment from the database.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to delete the assignment from the `tblm_assignments` table using the provided assignment ID.
 * 
 * @param {string} assignmentId - The ID of the assignment to delete.
 * @returns {Promise<void>} - Resolves when the assignment is deleted.
 * @throws {Error} - If an error occurs during the database operation.
 */
const deleteAssignment = async (assignmentId) => {
    console.log("IN AssignmentDAO.deleteAssignment", { assignmentId });
    try {
        const query = `
            DELETE FROM classroom.tblm_assignments
            WHERE id = $1
        `;
        const values = [assignmentId];

        await pool.query(query, values);
        console.log("OUT AssignmentDAO.deleteAssignment");
    } catch (error) {
        console.error("Error deleting assignment:", error);
        throw error;
    }
};

/**
 * Retrieves assignments created by a tutor based on filters.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch assignments from the `tblm_assignments` table for the given tutor ID.
 * 2. Applies filters such as `publishedAt` to filter assignments by their publication status.
 * 3. Converts the database result's keys from snake_case to camelCase.
 * 4. Returns an array of assignments.
 * 
 * @param {string} tutorId - The ID of the tutor.
 * @param {Object} filters - The filters to apply when retrieving assignments.
 * @returns {Promise<Array<Object>>} - An array of assignments with camelCase keys.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getTutorAssignments = async (tutorId, filters) => {
    console.log("IN AssignmentDAO.getTutorAssignments", { tutorId });
    try {
        const { publishedAt } = filters;

        let query = `
            SELECT * 
            FROM classroom.tblm_assignments 
            WHERE tutor_id = $1
        `;
        const values = [tutorId];

        // Apply publishedAt filter
        if (publishedAt === 'SCHEDULED') {
            query += ` AND published_at > NOW()`;
        } else if (publishedAt === 'ONGOING') {
            query += ` AND published_at <= NOW()`;
        }

        const result = await pool.query(query, values);
        const assignments = result.rows.map(snakeToCamel);
        console.log("OUT AssignmentDAO.getTutorAssignments", { resultSize: assignments.length });
        return assignments;
    } catch (error) {
        console.error("Error fetching tutor assignments:", error);
        throw error;
    }
};

/**
 * Retrieves assignments assigned to a student based on filters.
 * 
 * This function performs the following steps:
 * 1. Executes a SQL query to fetch assignments from the `tblm_assignments` table for the given student ID.
 * 2. Joins the `tblm_assignments` table with the `tblt_student_assignments` table to include assignment statuses.
 * 3. Applies filters such as `publishedAt` and `status` to filter assignments by their publication status and submission status.
 * 4. Converts the database result's keys from snake_case to camelCase.
 * 5. Returns an array of assignments.
 * 
 * @param {string} studentId - The ID of the student.
 * @param {Object} filters - The filters to apply when retrieving assignments.
 * @returns {Promise<Array<Object>>} - An array of assignments with camelCase keys.
 * @throws {Error} - If an error occurs during the database operation.
 */
const getStudentAssignments = async (studentId, filters) => {
    console.log("IN AssignmentDAO.getStudentAssignments", { studentId });
    try {
        const { publishedAt, status } = filters;

        let query = `
            SELECT a.*, sa.status_id 
            FROM classroom.tblm_assignments a
            JOIN classroom.tblt_student_assignments sa ON a.id = sa.assignment_id
            WHERE sa.student_id = $1
        `;
        const values = [studentId];

        // Apply publishedAt filter
        if (publishedAt === 'SCHEDULED') {
            query += ` AND a.published_at > NOW()`;
        } else if (publishedAt === 'ONGOING') {
            query += ` AND a.published_at <= NOW()`;
        }

        // Apply status filter
        if (status === 'PENDING') {
            query += ` AND sa.status_id = $2`;
            values.push(SubmissionStatus.PENDING);
        } else if (status === 'SUBMITTED') {
            query += ` AND sa.status_id = $2`;
            values.push(SubmissionStatus.SUBMITTED);
        } else if (status === 'OVERDUE') {
            query += ` AND sa.status_id = $2 AND a.deadline < NOW()`;
            values.push(SubmissionStatus.PENDING);
        }

        const result = await pool.query(query, values);
        const assignments = result.rows.map(snakeToCamel);
        console.log("OUT AssignmentDAO.getStudentAssignments", { resultSize: assignments.length });
        return assignments;
    } catch (error) {
        console.error("Error fetching student assignments:", error);
        throw error;
    }
};

module.exports = { 
    saveAssignment, 
    getAssignmentById, 
    updateAssignment, 
    saveStudentAssignments, 
    deleteAssignment, 
    getTutorAssignments, 
    getStudentAssignments 
};
