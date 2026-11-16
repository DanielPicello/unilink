package com.unilink.api.dto.profile.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCompanyProfileRequest(
        @NotBlank
        String companyName,
        @NotBlank
        @Pattern(regexp = "\\d{14}")
        String cnpj,
        @NotBlank
        String sector,
        String website,
        @NotBlank
        String companySize,
        @NotBlank
        String bio,
        String city
) {
}
