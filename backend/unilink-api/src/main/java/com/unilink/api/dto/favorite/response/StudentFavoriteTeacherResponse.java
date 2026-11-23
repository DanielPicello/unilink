package com.unilink.api.dto.favorite.response;

import com.unilink.api.dto.teacher.response.TeacherPublicResponse;

import java.util.UUID;

public record StudentFavoriteTeacherResponse(
        UUID teacherId,
        boolean available,
        TeacherPublicResponse teacher
) {
}
