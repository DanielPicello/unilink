package com.unilink.api.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        Environment environment = applicationContext.getEnvironment();

        String adminUrl = environment.getRequiredProperty("app.database.admin-url");
        String databaseUrl = environment.getRequiredProperty("spring.datasource.url");
        String username = environment.getRequiredProperty("spring.datasource.username");
        String password = environment.getRequiredProperty("spring.datasource.password");

        String databaseName = extractDatabaseName(databaseUrl);

        createDatabaseIfNotExists(adminUrl, username, password, databaseName);
    }

    private String extractDatabaseName(String databaseUrl) {
        String urlWithoutQuery = databaseUrl.split("\\?", 2)[0];
        int lastSlash = urlWithoutQuery.lastIndexOf('/');

        if (lastSlash == -1 || lastSlash == urlWithoutQuery.length() - 1) {
            throw new IllegalArgumentException(
                    "Nome do banco não encontrado na URL do PostgreSQL."
            );
        }

        String databaseName = urlWithoutQuery.substring(lastSlash + 1);

        if (!databaseName.matches("[a-zA-Z_][a-zA-Z0-9_]*")) {
            throw new IllegalArgumentException(
                    "Nome de banco de dados inválido: " + databaseName
            );
        }

        return databaseName;
    }

    private void createDatabaseIfNotExists(
            String adminUrl,
            String username,
            String password,
            String databaseName) {

        String checkSql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM pg_database
                    WHERE datname = ?
                )
                """;

        try (Connection connection = DriverManager.getConnection(adminUrl, username, password)) {
            boolean databaseExists;

            try (PreparedStatement statement = connection.prepareStatement(checkSql)) {
                statement.setString(1, databaseName);

                try (ResultSet result = statement.executeQuery()) {
                    result.next();
                    databaseExists = result.getBoolean(1);
                }
            }

            if (databaseExists) {
                System.out.println("Database '" + databaseName + "' já existe.");
                return;
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE DATABASE \"" + databaseName + "\"");
                System.out.println("Database '" + databaseName + "' criado com sucesso.");
            }

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Não foi possível inicializar o banco de dados.",
                    exception
            );
        }
    }
}
