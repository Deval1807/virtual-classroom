-- Create the schema
CREATE SCHEMA IF NOT EXISTS classroom;

-- Static table for user roles
CREATE TABLE IF NOT EXISTS classroom.tbls_user_roles (
    id         SERIAL PRIMARY KEY,
    name       ARCHAR(50) UNIQUE NOT NULL,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- Insert values for Tutor and Student roles
INSERT INTO classroom.tbls_user_roles (name)
VALUES 
    ('Tutor'),
    ('Student');

-- Table for users
CREATE TABLE IF NOT EXISTS classroom.tblm_users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(100) UNIQUE NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    role_id    INT NOT NULL REFERENCES classroom.tbls_user_roles(id) ON DELETE CASCADE,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- Table for assignments
CREATE TABLE IF NOT EXISTS classroom.tblm_assignments (
    id           SERIAL PRIMARY KEY,
    tutor_id     INT NOT NULL REFERENCES classroom.tblm_users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    published_at TIMESTAMP NOT NULL,
    deadline     TIMESTAMP NOT NULL,
    s3_url       TEXT,
    created_at   BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
    updated_at   BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- Static table for submission statuses
CREATE TABLE IF NOT EXISTS classroom.tbls_submission_status (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) UNIQUE NOT NULL,
    created_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
    updated_at BIGINT DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- Insert values for submission statuses
INSERT INTO classroom.tbls_submission_status (name)
VALUES 
    ('Submitted'),
    ('Pending');

-- Table for mapping of student and assignments
CREATE TABLE IF NOT EXISTS classroom.tblt_student_assignments (
    id            SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES classroom.tblm_assignments(id) ON DELETE CASCADE,
    student_id    INT NOT NULL REFERENCES classroom.tblm_users(id) ON DELETE CASCADE,
    status_id     SMALLINT NOT NULL REFERENCES classroom.tbls_submission_status(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, student_id)
)

-- Table for submissions
CREATE TABLE IF NOT EXISTS classroom.tblm_submissions (
    id            SERIAL PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES classroom.tblm_assignments(id) ON DELETE CASCADE,
    student_id    INT NOT NULL REFERENCES classroom.tblm_users(id) ON DELETE CASCADE,
    s3_url        TEXT NOT NULL,
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);