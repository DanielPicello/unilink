package com.unilink.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.unilink.api.config.DatabaseInitializer;

@SpringBootApplication
public class UnilinkApiApplication {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(UnilinkApiApplication.class);
        app.addInitializers(new DatabaseInitializer());
        app.run(args);
    }
}
