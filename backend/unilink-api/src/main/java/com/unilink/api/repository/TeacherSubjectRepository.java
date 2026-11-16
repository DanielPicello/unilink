package com.unilink.api.repository;

import com.unilink.api.entity.TeacherSubject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherSubjectRepository extends JpaRepository<TeacherSubject, UUID> {

    List<TeacherSubject> findAllByTeacherProfile_Id(UUID teacherId);

    boolean existsByTeacherProfile_IdAndSubjectIgnoreCase(
            UUID teacherId,
            String subject
    );
}
