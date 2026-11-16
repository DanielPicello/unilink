package com.unilink.api.controller.auth;

import com.unilink.api.dto.auth.request.RegisterStudentRequest;
import com.unilink.api.dto.auth.response.AuthResponse;
import com.unilink.api.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.unilink.api.dto.auth.request.RegisterTeacherRequest;
import com.unilink.api.dto.auth.request.RegisterCompanyRequest;
import com.unilink.api.dto.auth.request.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import com.unilink.api.dto.auth.response.CurrentUserResponse;
import com.unilink.api.dto.account.request.ChangePasswordRequest;
import com.unilink.api.exception.custom.UnauthenticatedException;
import org.springframework.web.bind.annotation.PatchMapping;
import com.unilink.api.dto.account.request.DeleteAccountRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.SessionCookieConfig;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthResponse> registerStudent(
            @Valid @RequestBody RegisterStudentRequest request
    ) {
        AuthResponse response = authService.registerStudent(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    @PostMapping("/register/teacher")
    public ResponseEntity<AuthResponse> registerTeacher(
            @Valid @RequestBody RegisterTeacherRequest request
    ) {
        AuthResponse response = authService.registerTeacher(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/register/company")
    public ResponseEntity<AuthResponse> registerCompany(
            @Valid @RequestBody RegisterCompanyRequest request
    ) {
        AuthResponse response = authService.registerCompany(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("userId", response.id());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(
            HttpServletRequest request
    ) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new UnauthenticatedException("Sessão não autenticada.");
        }
        Object userIdAttribute = session.getAttribute("userId");
        if (!(userIdAttribute instanceof UUID userId)) {
            throw new UnauthenticatedException("Sessão não autenticada.");
        }
        CurrentUserResponse response = authService.getCurrentUser(userId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SessionCookieConfig cookieConfig = request.getServletContext().getSessionCookieConfig();
        String cookieName = cookieConfig.getName() != null
                ? cookieConfig.getName()
                : "JSESSIONID";
        String cookiePath = cookieConfig.getPath() != null
                ? cookieConfig.getPath()
                : "/";
        ResponseCookie clearedCookie = ResponseCookie.from(cookieName, "")
                .path(cookiePath)
                .httpOnly(true)
                .maxAge(0)
                .sameSite("Lax")
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearedCookie.toString())
                .build();
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
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

        authService.changePassword(userId, request);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(
            @Valid @RequestBody DeleteAccountRequest request,
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
        authService.deleteAccount(userId, request);
        session.invalidate();

        return ResponseEntity.noContent().build();
    }
}
