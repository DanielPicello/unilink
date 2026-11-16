package com.unilink.api.controller.profile;

import com.unilink.api.dto.profile.request.UpdatePersonalProfileRequest;
import com.unilink.api.exception.custom.UnauthenticatedException;
import com.unilink.api.service.profile.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.unilink.api.dto.profile.request.UpdateStudentProfileRequest;
import com.unilink.api.dto.profile.request.UpdateTeacherProfileRequest;
import com.unilink.api.dto.profile.request.UpdateCompanyProfileRequest;
import com.unilink.api.dto.profile.request.AddTeacherProfileRequest;
import com.unilink.api.dto.profile.request.AddStudentProfileRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PutMapping("/personal")
    public ResponseEntity<Void> updatePersonalProfile(
            @Valid @RequestBody UpdatePersonalProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.updatePersonalProfile(userId, request);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/student")
    public ResponseEntity<Void> updateStudentProfile(
            @Valid @RequestBody UpdateStudentProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.updateStudentProfile(userId, request);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/teacher")
    public ResponseEntity<Void> updateTeacherProfile(
            @Valid @RequestBody UpdateTeacherProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.updateTeacherProfile(userId, request);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/company")
    public ResponseEntity<Void> updateCompanyProfile(
            @Valid @RequestBody UpdateCompanyProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.updateCompanyProfile(userId, request);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teacher")
    public ResponseEntity<Void> addTeacherProfile(
            @Valid @RequestBody AddTeacherProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.addTeacherProfile(userId, request);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/student")
    public ResponseEntity<Void> addStudentProfile(
            @Valid @RequestBody AddStudentProfileRequest request,
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.addStudentProfile(userId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/teacher")
    public ResponseEntity<Void> removeTeacherProfile(
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.removeTeacherProfile(userId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/student")
    public ResponseEntity<Void> removeStudentProfile(
            HttpServletRequest httpRequest
    ) {
        var session = httpRequest.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Usuário não autenticado.");
        }
        profileService.removeStudentProfile(userId);

        return ResponseEntity.noContent().build();
    }
}
