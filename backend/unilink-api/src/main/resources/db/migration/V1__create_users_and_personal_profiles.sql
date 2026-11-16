CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role
    CHECK (
        role IN (
            'STUDENT',
            'TEACHER',
            'STUDENT_TEACHER',
            'COMPANY',
            'ADMIN'
        )
    ),
    CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

CREATE UNIQUE INDEX uk_users_email_lower
    ON users (LOWER(email));

CREATE TABLE personal_profiles (
    user_id UUID PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    bio TEXT NOT NULL,
    CONSTRAINT fk_personal_profiles_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
);
