
package com.unilink.api.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterCompanyRequest(

        @NotBlank
        @Size(max = 150)
        String companyName,

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        String password,

        @NotBlank
        @Pattern(regexp = "\\d{14}")
        String cnpj,

        @NotBlank
        @Size(max = 100)
        String sector,

        @Size(max = 255)
        String website,

        @NotBlank
        @Size(max = 50)
        String companySize,

        @NotBlank
        String bio,

        @Size(max = 120)
        String city

) {
}
