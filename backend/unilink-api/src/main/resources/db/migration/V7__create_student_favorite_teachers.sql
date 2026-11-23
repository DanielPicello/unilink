CREATE TABLE student_favorite_teachers
(
    student_id UUID        NOT NULL,
    teacher_id UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_student_favorite_teachers
        PRIMARY KEY (student_id, teacher_id),

    CONSTRAINT fk_student_favorites_student
        FOREIGN KEY (student_id)
            REFERENCES student_profiles (user_id)
            ON DELETE CASCADE,

    CONSTRAINT fk_student_favorites_teacher
        FOREIGN KEY (teacher_id)
            REFERENCES teacher_profiles (user_id)
            ON DELETE CASCADE,

    CONSTRAINT chk_student_favorites_not_self
        CHECK (student_id <> teacher_id)
);

CREATE INDEX idx_student_favorites_teacher
    ON student_favorite_teachers (teacher_id);

CREATE INDEX idx_student_favorites_student_recent
    ON student_favorite_teachers (student_id, created_at DESC);
