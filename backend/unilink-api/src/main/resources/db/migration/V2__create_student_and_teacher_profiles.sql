CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY,
    education_level VARCHAR(80) NOT NULL,
    city VARCHAR(120),
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
);


CREATE TABLE teacher_profiles (
    user_id UUID PRIMARY KEY,
    university VARCHAR(150) NOT NULL,
    course VARCHAR(150) NOT NULL,
    period VARCHAR(50) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    city VARCHAR(120),
    CONSTRAINT fk_teacher_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_teacher_hourly_rate
        CHECK (hourly_rate >= 0)
);

CREATE TABLE teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR(100) NOT NULL,
    CONSTRAINT fk_teacher_subjects_teacher
    FOREIGN KEY (user_id)
        REFERENCES teacher_profiles(user_id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_teacher_subjects_user_subject_lower
    ON teacher_subjects (user_id, LOWER(subject));
