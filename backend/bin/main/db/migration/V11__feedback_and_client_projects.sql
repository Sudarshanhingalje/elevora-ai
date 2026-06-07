-- V11: Expand feedback table and create client_projects table

-- Add nps_score and category (to match FeedbackController inserts)
ALTER TABLE feedback ADD COLUMN nps_score INT NULL;
ALTER TABLE feedback ADD COLUMN category VARCHAR(100) NULL DEFAULT 'GENERAL';

-- Add expanded questions and source
ALTER TABLE feedback ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'PROJECT';
ALTER TABLE feedback ADD COLUMN solution_quality TINYINT NULL;
ALTER TABLE feedback ADD COLUMN communication TINYINT NULL;
ALTER TABLE feedback ADD COLUMN delivery_speed TINYINT NULL;
ALTER TABLE feedback ADD COLUMN recommend TINYINT NULL;
ALTER TABLE feedback ADD COLUMN ticket_id BIGINT NULL;

-- Create client_projects table for custom project tracking
CREATE TABLE client_projects (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status ENUM('ON_TRACK', 'AT_RISK', 'COMPLETED') NOT NULL DEFAULT 'ON_TRACK',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_client_projects_tenant_id (tenant_id),
    CONSTRAINT fk_client_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert 1 dummy active client project to see all correctly (as requested by user)
INSERT INTO client_projects (tenant_id, client_name, project_name, progress, due_date, status)
VALUES (1, 'TechVentures', 'AI Chatbot Integration', 75, '2026-06-15', 'ON_TRACK');

-- Let's also insert some mock feedback data to display NPS and rating distribution in reports
INSERT INTO feedback (tenant_id, user_id, rating, nps_score, category, message, source, solution_quality, communication, delivery_speed, recommend)
VALUES (1, 1, 5, 9, 'PROJECT', 'Outstanding AI integration, completely automated our patient booking system.', 'PROJECT', 5, 5, 5, 5),
       (1, 1, 4, 8, 'PROJECT', 'Great dashboard implementation, but onboarding took a bit longer than expected.', 'PROJECT', 4, 5, 3, 4),
       (1, 1, 5, 10, 'SUPPORT', 'Super helpful support agent, resolved my docker container network issues instantly!', 'SUPPORT', 5, 5, 5, 5);
