class CreateAssignmentRequest {
    constructor({ title, description, publishedAt, dueDate, file, studentIds, username }) {
        if (!title) {
            throw new Error("Title is required");
        }
        if (!dueDate) {
            throw new Error("Due date is required");
        }
        if (!file) {
            throw new Error("File is required");
        }

        this.title = title;
        this.description = description || null;
        this.publishedAt = publishedAt || new Date().toISOString();
        this.dueDate = dueDate;
        this.file = file;
        this.studentIds = studentIds || [];
        this.username = username;
    }
}

module.exports = CreateAssignmentRequest;
