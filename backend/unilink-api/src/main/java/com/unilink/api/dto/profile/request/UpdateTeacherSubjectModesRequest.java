package com.unilink.api.dto.profile.request;

import com.unilink.api.entity.TeachingMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record UpdateTeacherSubjectModesRequest(

        @NotEmpty
        List<@NotNull @Valid SubjectModesItem> subjects

) {

    public record SubjectModesItem(

            @NotNull
            UUID id,

            @NotEmpty
            List<@NotNull TeachingMode> teachingModes

    ) {
    }
}
