package com.unilink.api.dto.account.request;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank
        String currentPassword
) {
}
