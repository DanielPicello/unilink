package com.unilink.api.controller.favorite;

import com.unilink.api.service.favorite.StudentFavoriteTeacherService;
import com.unilink.api.dto.favorite.response.StudentFavoriteTeacherResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/students/me/favorites")
public class StudentFavoriteTeacherController {

    private final StudentFavoriteTeacherService favoriteService;

    public StudentFavoriteTeacherController(
            StudentFavoriteTeacherService favoriteService
    ) {
        this.favoriteService = favoriteService;
    }


    @GetMapping
    public ResponseEntity<PagedModel<StudentFavoriteTeacherResponse>> listFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest request
    ) {

        UUID studentId = requireAuthenticatedUser(request);

        if (page < 0 || size < 1 || size > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os parâmetros de paginação são inválidos."
            );
        }

        PageRequest pageable = PageRequest.of(page, size);

        Page<StudentFavoriteTeacherResponse> favorites =
                favoriteService.listFavorites(
                        studentId,
                        pageable
                );

        return ResponseEntity.ok(
                new PagedModel<>(favorites)
        );
    }


    @GetMapping("/status")
    public ResponseEntity<List<UUID>> getFavoriteStatus(
            @RequestParam("teacherIds") List<UUID> teacherIds,
            HttpServletRequest request
    ) {

        UUID studentId = requireAuthenticatedUser(request);

        List<UUID> favoritedTeacherIds =
                favoriteService.getFavoritedTeacherIds(
                        studentId,
                        teacherIds
                );

        return ResponseEntity.ok(favoritedTeacherIds);
    }


    @PostMapping("/{teacherId}")
    public ResponseEntity<Void> addFavorite(
            @PathVariable UUID teacherId,
            HttpServletRequest request
    ) {

        UUID studentId = requireAuthenticatedUser(request);

        favoriteService.addFavorite(studentId, teacherId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{teacherId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable UUID teacherId,
            HttpServletRequest request
    ) {

        UUID studentId = requireAuthenticatedUser(request);

        favoriteService.removeFavorite(studentId, teacherId);

        return ResponseEntity.noContent().build();
    }

    private UUID requireAuthenticatedUser(
            HttpServletRequest request
    ) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não autenticado."
            );
        }

        Object userId = session.getAttribute("userId");

        if (!(userId instanceof UUID id)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não autenticado."
            );
        }

        return id;
    }
}
