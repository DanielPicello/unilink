package com.unilink.api.dto.auth.response;

import com.unilink.api.entity.TeachingMode;

import java.util.List;
import java.util.UUID;

public record TeacherSubjectResponse(
        UUID id,
        String subject,
        List<TeachingMode> teachingModes
) {
}
