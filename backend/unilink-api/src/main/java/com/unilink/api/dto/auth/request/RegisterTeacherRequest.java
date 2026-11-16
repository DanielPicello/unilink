package com.unilink.api.dto.auth.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record RegisterTeacherRequest(

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
        @Size(max = 150)
        String university,

        @NotBlank
        @Size(max = 150)
        String course,

        @NotBlank
        @Size(max = 50)
        String period,

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 8, fraction = 2)
        BigDecimal hourlyRate,

        @NotEmpty
        List<
                @NotBlank
                @Size(max = 100)
                        String
                > subjects,

        @Size(max = 120)
        String city

) {
}
