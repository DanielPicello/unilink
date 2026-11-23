
package com.unilink.api.controller.teacher;

import com.unilink.api.dto.teacher.response.TeacherPublicResponse;
import com.unilink.api.dto.teacher.response.TeacherPublicDetailResponse;
import com.unilink.api.service.teacher.TeacherPublicService;
import com.unilink.api.entity.TeachingMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.web.PagedModel;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teachers")
public class TeacherPublicController {

    private final TeacherPublicService teacherPublicService;

    public TeacherPublicController(
            TeacherPublicService teacherPublicService
    ) {
        this.teacherPublicService = teacherPublicService;
    }


    @GetMapping
    public ResponseEntity<PagedModel<TeacherPublicResponse>> listTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,

            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String university,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) TeachingMode mode,
            @RequestParam(required = false) BigDecimal minRate,
            @RequestParam(required = false) BigDecimal maxRate
    ) {

        if (page < 0 || size < 1 || size > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os parâmetros de paginação são inválidos."
            );
        }

        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.ASC, "id")
        );

        Page<TeacherPublicResponse> teachers =
                teacherPublicService.searchPublicTeachers(
                        subject,
                        university,
                        course,
                        city,
                        mode,
                        minRate,
                        maxRate,
                        pageable
                );

        return ResponseEntity.ok(new PagedModel<>(teachers));
    }


    @GetMapping("/{teacherId}")
    public ResponseEntity<TeacherPublicDetailResponse> getTeacher(
            @PathVariable UUID teacherId
    ) {

        TeacherPublicDetailResponse teacher =
                teacherPublicService.getPublicTeacher(teacherId);

        return ResponseEntity.ok(teacher);
    }
}
