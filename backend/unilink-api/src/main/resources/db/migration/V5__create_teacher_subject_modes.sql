CREATE TABLE teacher_subject_modes
(
    teacher_subject_id UUID        NOT NULL,
    teaching_mode      VARCHAR(20) NOT NULL,

    CONSTRAINT pk_teacher_subject_modes
        PRIMARY KEY (teacher_subject_id, teaching_mode),

    CONSTRAINT fk_teacher_subject_modes_subject
        FOREIGN KEY (teacher_subject_id)
            REFERENCES teacher_subjects (id)
            ON DELETE CASCADE,

    CONSTRAINT chk_teacher_subject_modes
        CHECK (teaching_mode IN ('ONLINE', 'IN_PERSON'))
);