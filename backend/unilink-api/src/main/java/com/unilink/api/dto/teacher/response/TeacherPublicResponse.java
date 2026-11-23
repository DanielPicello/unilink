package com.unilink.api.dto.teacher.response;

import com.unilink.api.entity.TeachingMode;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TeacherPublicResponse(
        UUID teacherId,
        String fullName,
        String university,
        String course,
        String city,
        BigDecimal hourlyRate,
        List<TeachingMode> teachingModes,
        String photoUrl
) {
}
