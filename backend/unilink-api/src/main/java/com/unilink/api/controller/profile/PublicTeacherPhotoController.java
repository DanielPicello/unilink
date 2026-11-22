package com.unilink.api.controller.profile;

import com.unilink.api.service.profile.ProfilePhotoService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teachers")
public class PublicTeacherPhotoController {

    private final ProfilePhotoService profilePhotoService;

    public PublicTeacherPhotoController(
            ProfilePhotoService profilePhotoService
    ) {
        this.profilePhotoService = profilePhotoService;
    }

    @GetMapping("/{teacherId}/photo")
    public ResponseEntity<byte[]> getTeacherPhoto(
            @PathVariable UUID teacherId
    ) {

        String photoDataUrl =
                profilePhotoService.getPublicTeacherPhoto(teacherId);

        MediaType mediaType;
        String base64;

        if (photoDataUrl.startsWith("data:image/png;base64,")) {

            mediaType = MediaType.IMAGE_PNG;
            base64 = photoDataUrl.substring(
                    "data:image/png;base64,".length()
            );

        } else if (photoDataUrl.startsWith("data:image/jpeg;base64,")) {

            mediaType = MediaType.IMAGE_JPEG;
            base64 = photoDataUrl.substring(
                    "data:image/jpeg;base64,".length()
            );

        } else {

            throw new IllegalStateException(
                    "O formato da foto armazenada é inválido."
            );
        }

        byte[] imageBytes;

        try {
            imageBytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "Não foi possível recuperar a foto armazenada.",
                    exception
            );
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(imageBytes);
    }
}