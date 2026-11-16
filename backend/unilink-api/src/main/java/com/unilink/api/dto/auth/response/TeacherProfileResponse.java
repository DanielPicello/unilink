package com.unilink.api.dto.auth.response;

import java.math.BigDecimal;
import java.util.List;

public record TeacherProfileResponse(
        String university,
        String course,
        String period,
        BigDecimal hourlyRate,
        String city,
        List<String> subjects
) {
}
