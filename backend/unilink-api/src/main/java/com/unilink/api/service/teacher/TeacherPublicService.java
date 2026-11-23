package com.unilink.api.service.teacher;

import com.unilink.api.dto.teacher.response.TeacherPublicResponse;
import com.unilink.api.dto.teacher.response.TeacherPublicDetailResponse;
import com.unilink.api.entity.*;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
public class TeacherPublicService {

    private final TeacherProfileRepository teacherProfileRepository;
    private final PersonalProfileRepository personalProfileRepository;
    private final ProfilePhotoRepository profilePhotoRepository;
    private final UserRepository userRepository;

    public TeacherPublicService(
            TeacherProfileRepository teacherProfileRepository,
            PersonalProfileRepository personalProfileRepository,
            ProfilePhotoRepository profilePhotoRepository,
            UserRepository userRepository
    ) {
        this.teacherProfileRepository = teacherProfileRepository;
        this.personalProfileRepository = personalProfileRepository;
        this.profilePhotoRepository = profilePhotoRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<TeacherPublicResponse> listPublicTeachers(
            Pageable pageable
    ) {

        Page<TeacherProfile> teachers = teacherProfileRepository
                .findPublicTeachers(UserStatus.ACTIVE, pageable);

        return toPublicPage(teachers);
    }


    @Transactional(readOnly = true)
    public Page<TeacherPublicResponse> searchPublicTeachers(
            String subject,
            String university,
            String course,
            String city,
            TeachingMode mode,
            BigDecimal minRate,
            BigDecimal maxRate,
            Pageable pageable
    ) {

        if ((minRate != null && minRate.signum() < 0)
                || (maxRate != null && maxRate.signum() < 0)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os valores por hora não podem ser negativos."
            );
        }

        if (minRate != null
                && maxRate != null
                && minRate.compareTo(maxRate) > 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O valor mínimo não pode ser maior que o máximo."
            );
        }

        Page<TeacherProfile> teachers =
                teacherProfileRepository.searchPublicTeachers(
                        UserStatus.ACTIVE,
                        List.of(Role.TEACHER, Role.STUDENT_TEACHER),
                        normalizeFilter(subject),
                        normalizeFilter(university),
                        normalizeFilter(course),
                        normalizeFilter(city),
                        mode,
                        minRate,
                        maxRate,
                        pageable
                );

        return toPublicPage(teachers);
    }


    @Transactional(
            readOnly = true,
            noRollbackFor = ResourceNotFoundException.class
    )
    public TeacherPublicDetailResponse getPublicTeacher(
            UUID teacherId
    ) {
        TeacherProfile teacher = teacherProfileRepository
                .findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Professor não encontrado."
                ));

        User user = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Professor não encontrado."
                ));

        boolean validRole =
                user.getRole() == Role.TEACHER
                        || user.getRole() == Role.STUDENT_TEACHER;

        boolean incompleteSubjects =
                teacher.getSubjects().isEmpty()
                        || teacher.getSubjects()
                        .stream()
                        .anyMatch(subject ->
                                subject.getTeachingModes().isEmpty()
                        );

        if (!teacher.isPublic()
                || user.getStatus() != UserStatus.ACTIVE
                || !validRole
                || incompleteSubjects) {

            throw new ResourceNotFoundException(
                    "Professor não encontrado."
            );
        }

        PersonalProfile personal = getPersonalProfile(teacherId);

        var subjects = teacher.getSubjects()
                .stream()
                .map(subject ->
                        new TeacherPublicDetailResponse.SubjectResponse(
                                subject.getId(),
                                subject.getSubject(),
                                subject.getTeachingModes()
                                        .stream()
                                        .sorted()
                                        .toList()
                        )
                )
                .toList();

        return new TeacherPublicDetailResponse(
                teacher.getId(),
                personal.getFullName(),
                personal.getBio(),
                teacher.getUniversity(),
                teacher.getCourse(),
                teacher.getPeriod(),
                teacher.getCity(),
                teacher.getHourlyRate(),
                subjects,
                getPhotoUrl(teacherId)
        );
    }


    @Transactional(readOnly = true)
    public Page<TeacherPublicResponse> mapPublicTeacherPage(
            Page<TeacherProfile> teachers
    ) {
        return toPublicPage(teachers);
    }


    private Page<TeacherPublicResponse> toPublicPage(
            Page<TeacherProfile> teachers
    ) {

        if (teachers.isEmpty()) {
            return teachers.map(
                    teacher -> toPublicResponse(teacher, Set.of())
            );
        }

        List<UUID> teacherIds = teachers.getContent()
                .stream()
                .map(TeacherProfile::getId)
                .toList();

        teacherProfileRepository.findWithSubjectsAndModes(
                teacherIds
        );

        personalProfileRepository.findAllById(
                teacherIds
        );

        Set<UUID> teacherIdsWithPhotos = Set.copyOf(
                profilePhotoRepository.findExistingPhotoIds(
                        teacherIds
                )
        );

        return teachers.map(
                teacher -> toPublicResponse(
                        teacher,
                        teacherIdsWithPhotos
                )
        );
    }


    private TeacherPublicResponse toPublicResponse(
            TeacherProfile teacher,
            Set<UUID> teacherIdsWithPhotos
    ) {

        PersonalProfile personal = getPersonalProfile(
                teacher.getId()
        );

        var teachingModes = teacher.getSubjects()
                .stream()
                .flatMap(subject ->
                        subject.getTeachingModes().stream()
                )
                .distinct()
                .sorted()
                .toList();

        String photoUrl = teacherIdsWithPhotos.contains(
                teacher.getId()
        )
                ? "/api/v1/teachers/" + teacher.getId() + "/photo"
                : null;

        return new TeacherPublicResponse(
                teacher.getId(),
                personal.getFullName(),
                teacher.getUniversity(),
                teacher.getCourse(),
                teacher.getCity(),
                teacher.getHourlyRate(),
                teachingModes,
                photoUrl
        );
    }


    private PersonalProfile getPersonalProfile(UUID teacherId) {
        return personalProfileRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Professor não encontrado."
                ));
    }

    private String getPhotoUrl(UUID teacherId) {

        if (!profilePhotoRepository.existsById(teacherId)) {
            return null;
        }

        return "/api/v1/teachers/" + teacherId + "/photo";
    }


    private String normalizeFilter(String value) {

        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isEmpty() ? null : normalized;
    }

}
