const express = require('express');
require('dotenv').config();
const { swaggerDoc, swaggerui } = require('./config/SwaggerConfig');
const { scheduleNotificationJob } = require('./schedulers/NotificationScheduler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 8000;

app.get("/", (req, res) => res.send("Welcome to the Virtual Classroom"));

// Serve Swagger API documentation
app.use('/api-docs', swaggerui.serve, swaggerui.setup(swaggerDoc));

// API routes
app.use('/api', require('./routes'));

// Schedule the notification job
scheduleNotificationJob();

app.listen(port, () => console.log(`Listening on port ${port}!`));