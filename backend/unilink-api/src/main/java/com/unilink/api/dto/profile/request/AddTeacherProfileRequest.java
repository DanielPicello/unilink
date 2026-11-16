package com.unilink.api.dto.profile.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record AddTeacherProfileRequest(
        @NotBlank
        String university,
        @NotBlank
        String course,
        @NotBlank
        String period,
        @NotNull
        @DecimalMin("0.00")
        BigDecimal hourlyRate,
        @NotEmpty
        List<@NotBlank @Size(max = 100) String> subjects,
        String city
) {
}
