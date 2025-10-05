const pool = require('../config/Database');
const nodemailer = require('nodemailer');
const SubmissionStatus = require('../constants/SubmissionStatus');

/**
 * Fetch assignments nearing their deadlines within the next hour.
 * This function performs the following steps:
 * 1. Joins the `tblt_student_assignments`, `tblm_assignments`, and `tblm_users` tables to get assignment details along with student emails.
 * 2. Filters assignments whose deadlines are within the next hour and have not submitted yet.
 * 3. Returns a list of assignments with student emails.
 * @returns {Promise<Array>} - List of assignments with student emails.
 */
const fetchUpcomingAssignments = async () => {
    const query = `
        SELECT 
            sa.assignment_id, 
            a.title AS assignment_title, 
            a.deadline, 
            u.email AS student_email
        FROM 
            classroom.tblt_student_assignments sa
        JOIN 
            classroom.tblm_assignments a ON sa.assignment_id = a.id
        JOIN 
            classroom.tblm_users u ON sa.student_id = u.id
        WHERE 
            a.deadline::timestamptz BETWEEN (now() AT TIME ZONE 'asia/kolkata') + INTERVAL '59 minutes' 
                AND (now() AT TIME ZONE 'asia/kolkata') + INTERVAL '1 hour'
            AND sa.status_id = $1; -- only filter the students who have not submitted yet
    `;

    const values = [SubmissionStatus.PENDING];
    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Send email notifications to students.
 * @param {Array} assignments - List of assignments with student emails.
 */
const sendNotifications = async (assignments) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    for (const assignment of assignments) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: assignment.student_email,
            subject: `Upcoming Assignment Deadline: ${assignment.assignment_title}`,
            text: `Dear Student,\n\nThis is a reminder that the deadline for the assignment "${assignment.assignment_title}" is at ${assignment.deadline}.\n\nPlease make sure to submit it on time.\n\nBest regards,\nVirtual Classroom Team`,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Notification sent to ${assignment.student_email} for assignment ${assignment.assignment_title}`);
        } catch (error) {
            console.error(`Failed to send notification to ${assignment.student_email}:`, error);
        }
    }
};

/**
 * Main function to fetch assignments and send notifications.
 */
const notifyUpcomingAssignments = async () => {
    console.log("IN NotificationService.notifyUpcomingAssignments");
    try {
        const assignments = await fetchUpcomingAssignments();
        if (assignments.length > 0) {
            await sendNotifications(assignments);
        } else {
            console.log("No upcoming assignments within the next hour.");
        }
    } catch (error) {
        console.error("Error in NotificationService:", error);
    } finally {
        console.log("OUT NotificationService.notifyUpcomingAssignments");
    }
};

module.exports = { notifyUpcomingAssignments };
