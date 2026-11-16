package com.unilink.api.dto.auth.response;

import com.unilink.api.entity.Role;

import java.util.UUID;

public record AuthResponse(
        UUID id,
        String email,
        Role role,
        String displayName
) {
}
