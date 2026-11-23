
package com.unilink.api.repository;

import com.unilink.api.entity.TeacherProfile;
import com.unilink.api.entity.UserStatus;
import com.unilink.api.entity.Role;
import com.unilink.api.entity.TeachingMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

public interface TeacherProfileRepository
        extends JpaRepository<TeacherProfile, UUID> {

    @Query("""
            SELECT teacher
            FROM TeacherProfile teacher
            WHERE teacher.isPublic = true
              AND teacher.user.status = :status
              AND teacher.subjects IS NOT EMPTY
              AND NOT EXISTS (
                  SELECT subject
                  FROM TeacherSubject subject
                  WHERE subject.teacherProfile = teacher
                    AND subject.teachingModes IS EMPTY
              )
            """)
    Page<TeacherProfile> findPublicTeachers(
            @Param("status") UserStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT teacher
            FROM TeacherProfile teacher
            WHERE teacher.isPublic = true
              AND teacher.user.status = :status
              AND teacher.user.role IN :roles
              AND teacher.subjects IS NOT EMPTY
            
              AND NOT EXISTS (
                  SELECT subject
                  FROM TeacherSubject subject
                  WHERE subject.teacherProfile = teacher
                    AND subject.teachingModes IS EMPTY
              )
            
              AND (
                  CAST(:university AS String) IS NULL
                  OR LOWER(teacher.university)
                      LIKE CONCAT('%', LOWER(CAST(:university AS String)), '%')
              )
            
              AND (
                  CAST(:course AS String) IS NULL
                  OR LOWER(teacher.course)
                      LIKE CONCAT('%', LOWER(CAST(:course AS String)), '%')
              )
            
              AND (
                  CAST(:city AS String) IS NULL
                  OR LOWER(teacher.city)
                      LIKE CONCAT('%', LOWER(CAST(:city AS String)), '%')
              )
            
              AND (
                  :minRate IS NULL
                  OR teacher.hourlyRate >= :minRate
              )
            
              AND (
                  :maxRate IS NULL
                  OR teacher.hourlyRate <= :maxRate
              )
            
              AND (
                  (CAST(:subject AS String) IS NULL AND :mode IS NULL)
                  OR EXISTS (
                      SELECT searchedSubject
                      FROM TeacherSubject searchedSubject
                      WHERE searchedSubject.teacherProfile = teacher
            
                        AND (
                            CAST(:subject AS String) IS NULL
                            OR LOWER(searchedSubject.subject)
                                LIKE CONCAT('%', LOWER(CAST(:subject AS String)), '%')
                        )
            
                        AND (
                            :mode IS NULL
                            OR :mode MEMBER OF searchedSubject.teachingModes
                        )
                  )
              )
            """)
    Page<TeacherProfile> searchPublicTeachers(
            @Param("status") UserStatus status,
            @Param("roles") List<Role> roles,
            @Param("subject") String subject,
            @Param("university") String university,
            @Param("course") String course,
            @Param("city") String city,
            @Param("mode") TeachingMode mode,
            @Param("minRate") BigDecimal minRate,
            @Param("maxRate") BigDecimal maxRate,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT teacher
            FROM TeacherProfile teacher
            LEFT JOIN FETCH teacher.subjects subject
            LEFT JOIN FETCH subject.teachingModes
            WHERE teacher.id IN :ids
            """)
    List<TeacherProfile> findWithSubjectsAndModes(
            @Param("ids") List<UUID> ids
    );


    @Query("""
            SELECT teacher.id
            FROM TeacherProfile teacher
            JOIN teacher.user user
            WHERE teacher.id IN :teacherIds
              AND teacher.isPublic = true
              AND user.status = :status
              AND user.role IN :roles
              AND teacher.subjects IS NOT EMPTY
            
              AND NOT EXISTS (
                  SELECT subject.id
                  FROM TeacherSubject subject
                  WHERE subject.teacherProfile = teacher
                    AND subject.teachingModes IS EMPTY
              )
            
              AND EXISTS (
                  SELECT personal.id
                  FROM PersonalProfile personal
                  WHERE personal.id = teacher.id
              )
            """)
    List<UUID> findAvailableTeacherIds(
            @Param("teacherIds") Collection<UUID> teacherIds,
            @Param("status") UserStatus status,
            @Param("roles") Collection<Role> roles
    );


}
