CREATE TABLE companies (
    user_id UUID PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    cnpj VARCHAR(14) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    size VARCHAR(50) NOT NULL,
    bio TEXT NOT NULL,
    city VARCHAR(120),
    CONSTRAINT fk_companies_user
        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT uk_companies_cnpj
        UNIQUE (cnpj),

    CONSTRAINT chk_companies_cnpj
        CHECK (cnpj ~ '^[0-9]{14}$')
);
