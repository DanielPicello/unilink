package com.unilink.api.controller.profile;

import com.unilink.api.dto.profile.response.ProfilePhotoResponse;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.exception.custom.UnauthenticatedException;
import com.unilink.api.service.profile.ProfilePhotoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile/photo")
public class ProfilePhotoController {

    private final ProfilePhotoService profilePhotoService;

    public ProfilePhotoController(ProfilePhotoService profilePhotoService) {
        this.profilePhotoService = profilePhotoService;
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> savePhoto(
            @RequestParam("photo") MultipartFile photo,
            HttpServletRequest httpRequest
    ) {
        UUID userId = getAuthenticatedUserId(httpRequest);

        profilePhotoService.savePhoto(userId, photo);

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<ProfilePhotoResponse> getPhoto(
            HttpServletRequest httpRequest
    ) {
        UUID userId = getAuthenticatedUserId(httpRequest);

        String photo = profilePhotoService.getPhoto(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Foto de perfil não encontrada."
                ));

        return ResponseEntity.ok(
                new ProfilePhotoResponse(photo)
        );
    }

    @DeleteMapping
    public ResponseEntity<Void> deletePhoto(
            HttpServletRequest httpRequest
    ) {
        UUID userId = getAuthenticatedUserId(httpRequest);

        profilePhotoService.deletePhoto(userId);

        return ResponseEntity.noContent().build();
    }

    private UUID getAuthenticatedUserId(HttpServletRequest httpRequest) {

        var session = httpRequest.getSession(false);

        if (session == null) {
            throw new UnauthenticatedException(
                    "Usuário não autenticado."
            );
        }

        Object userIdAttribute = session.getAttribute("userId");

        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException(
                    "Usuário não autenticado."
            );
        }

        return userId;
    }
}