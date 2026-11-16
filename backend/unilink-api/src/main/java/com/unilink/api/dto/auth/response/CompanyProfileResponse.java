
package com.unilink.api.dto.auth.response;

public record CompanyProfileResponse(
        String companyName,
        String cnpj,
        String sector,
        String website,
        String companySize,
        String bio,
        String city
) {
}
