package com.unilink.api.dto.teacher.response;

import com.unilink.api.entity.TeachingMode;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TeacherPublicDetailResponse(
        UUID teacherId,
        String fullName,
        String bio,
        String university,
        String course,
        String period,
        String city,
        BigDecimal hourlyRate,
        List<SubjectResponse> subjects,
        String photoUrl
) {

    public record SubjectResponse(
            UUID id,
            String subject,
            List<TeachingMode> teachingModes
    ) {
    }
}
