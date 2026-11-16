
package com.unilink.api.dto.auth.response;

import com.unilink.api.entity.Role;

import java.util.UUID;

public record CurrentUserResponse(
        UUID id,
        String email,
        Role role,
        PersonalProfileResponse personalProfile,
        StudentProfileResponse studentProfile,
        TeacherProfileResponse teacherProfile,
        CompanyProfileResponse companyProfile
) {
}
