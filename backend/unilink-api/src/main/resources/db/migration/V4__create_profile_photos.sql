CREATE TABLE profile_photos
(
    user_id UUID PRIMARY KEY,
    photo   TEXT NOT NULL,

    CONSTRAINT fk_profile_photos_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
);