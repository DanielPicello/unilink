package com.unilink.api.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterStudentRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,
        @NotBlank
        String password,
        @NotBlank
        @Size(max = 150)
        String fullName,
        @NotBlank
        String bio,
        @NotBlank
        @Size(max = 80)
        String educationLevel,
        @Size(max = 120)
        String city
) {
}
