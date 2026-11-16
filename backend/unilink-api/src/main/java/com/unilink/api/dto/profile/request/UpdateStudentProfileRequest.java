package com.unilink.api.dto.profile.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateStudentProfileRequest(
        @NotBlank
        String educationLevel,
        String city
) {
}
