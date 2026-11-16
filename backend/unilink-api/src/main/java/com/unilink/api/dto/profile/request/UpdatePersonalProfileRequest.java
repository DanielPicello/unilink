package com.unilink.api.dto.profile.request;

import jakarta.validation.constraints.NotBlank;

public record UpdatePersonalProfileRequest(
        @NotBlank
        String fullName,
        @NotBlank
        String bio
) {
}
