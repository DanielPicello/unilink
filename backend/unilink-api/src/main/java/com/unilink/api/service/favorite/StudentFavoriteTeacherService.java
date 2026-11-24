package com.unilink.api.service.favorite;

import com.unilink.api.entity.*;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.repository.StudentFavoriteTeacherRepository;
import com.unilink.api.repository.StudentProfileRepository;
import com.unilink.api.repository.TeacherProfileRepository;
import com.unilink.api.repository.UserRepository;
import com.unilink.api.service.teacher.TeacherPublicService;
import com.unilink.api.dto.teacher.response.TeacherPublicResponse;
import com.unilink.api.dto.favorite.response.StudentFavoriteTeacherResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class StudentFavoriteTeacherService {

    private final StudentFavoriteTeacherRepository favoriteRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final UserRepository userRepository;
    private final TeacherPublicService teacherPublicService;

    public StudentFavoriteTeacherService(
            StudentFavoriteTeacherRepository favoriteRepository,
            StudentProfileRepository studentProfileRepository,
            TeacherProfileRepository teacherProfileRepository,
            UserRepository userRepository,
            TeacherPublicService teacherPublicService
    ) {
        this.favoriteRepository = favoriteRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.userRepository = userRepository;
        this.teacherPublicService = teacherPublicService;
    }


    @Transactional
    public void addFavorite(UUID studentId, UUID teacherId) {


        requireStudent(studentId);

        if (studentId.equals(teacherId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Você não pode favoritar seu próprio perfil."
            );
        }

        teacherPublicService.getPublicTeacher(teacherId);

        favoriteRepository.insertIfNotExists(
                studentId,
                teacherId
        );
    }


    @Transactional
    public void removeFavorite(UUID studentId, UUID teacherId) {

        requireStudent(studentId);

        StudentFavoriteTeacherId favoriteId =
                new StudentFavoriteTeacherId(
                        studentId,
                        teacherId
                );

        favoriteRepository.deleteById(favoriteId);
    }


    @Transactional(readOnly = true)
    public Page<StudentFavoriteTeacherResponse> listFavorites(
            UUID studentId,
            Pageable pageable
    ) {

        requireStudent(studentId);

        Page<StudentFavoriteTeacher> favorites =
                favoriteRepository.findAllFavorites(
                        studentId,
                        pageable
                );

        List<UUID> teacherIds = favorites.getContent()
                .stream()
                .map(favorite -> favorite.getId().getTeacherId())
                .toList();

        if (teacherIds.isEmpty()) {
            return favorites.map(favorite ->
                    new StudentFavoriteTeacherResponse(
                            favorite.getId().getTeacherId(),
                            false,
                            null
                    )
            );
        }

        Set<UUID> availableTeacherIds = new HashSet<>(
                teacherProfileRepository.findAvailableTeacherIds(
                        teacherIds,
                        UserStatus.ACTIVE,
                        List.of(
                                Role.TEACHER,
                                Role.STUDENT_TEACHER
                        )
                )
        );

        List<TeacherProfile> availableTeachers =
                favorites.getContent()
                        .stream()
                        .map(StudentFavoriteTeacher::getTeacher)
                        .filter(teacher ->
                                availableTeacherIds.contains(
                                        teacher.getId()
                                )
                        )
                        .toList();

        Map<UUID, TeacherPublicResponse> publicTeachers =
                new HashMap<>();

        if (!availableTeachers.isEmpty()) {

            Page<TeacherPublicResponse> publicPage =
                    teacherPublicService.mapPublicTeacherPage(
                            new PageImpl<>(availableTeachers)
                    );

            for (TeacherPublicResponse teacher : publicPage.getContent()) {
                publicTeachers.put(
                        teacher.teacherId(),
                        teacher
                );
            }
        }

        return favorites.map(favorite -> {

            UUID teacherId =
                    favorite.getId().getTeacherId();

            TeacherPublicResponse teacher =
                    publicTeachers.get(teacherId);

            return new StudentFavoriteTeacherResponse(
                    teacherId,
                    teacher != null,
                    teacher
            );
        });
    }


    @Transactional(readOnly = true)
    public List<UUID> getFavoritedTeacherIds(
            UUID studentId,
            List<UUID> teacherIds
    ) {

        requireStudent(studentId);

        if (teacherIds == null
                || teacherIds.isEmpty()
                || teacherIds.size() > 50) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe de 1 a 50 professores para consultar."
            );
        }

        return favoriteRepository.findFavoritedTeacherIds(
                studentId,
                teacherIds
        );
    }


    private StudentProfile requireStudent(UUID studentId) {

        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));

        if (user.getRole() != Role.STUDENT
                && user.getRole() != Role.STUDENT_TEACHER) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Apenas estudantes podem gerenciar favoritos."
            );
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Contas suspensas não podem gerenciar favoritos."
            );
        }

        return studentProfileRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Perfil de estudante não encontrado."
                ));
    }
}
