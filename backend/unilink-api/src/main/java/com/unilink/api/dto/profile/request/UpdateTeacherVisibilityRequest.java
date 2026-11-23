package com.unilink.api.dto.profile.request;

import jakarta.validation.constraints.NotNull;

public record UpdateTeacherVisibilityRequest(

        @NotNull(message = "A visibilidade do perfil é obrigatória.")
        Boolean isPublic

) {
}
