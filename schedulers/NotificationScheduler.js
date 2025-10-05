const cron = require('node-cron');
const { notifyUpcomingAssignments } = require('../services/NotificationService');

/**
 * Schedules the notification job to run every minute.
 */
const scheduleNotificationJob = () => {
    cron.schedule('* * * * *', async () => {
        console.log("Running notification job...");
        await notifyUpcomingAssignments();
    });
};

module.exports = { scheduleNotificationJob };
