package com.unilink.api.repository;

import com.unilink.api.entity.Role;
import com.unilink.api.entity.StudentFavoriteTeacher;
import com.unilink.api.entity.StudentFavoriteTeacherId;
import com.unilink.api.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StudentFavoriteTeacherRepository
        extends JpaRepository<StudentFavoriteTeacher, StudentFavoriteTeacherId> {

    @Query(
            value = """
                    SELECT favorite
                    FROM StudentFavoriteTeacher favorite
                    JOIN favorite.teacher teacher
                    JOIN teacher.user user
                    WHERE favorite.id.studentId = :studentId
                      AND teacher.isPublic = true
                      AND user.status = :status
                      AND user.role IN :roles
                      AND teacher.subjects IS NOT EMPTY
                    
                      AND NOT EXISTS (
                          SELECT subject
                          FROM TeacherSubject subject
                          WHERE subject.teacherProfile = teacher
                            AND subject.teachingModes IS EMPTY
                      )
                    
                    ORDER BY favorite.createdAt DESC,
                             favorite.id.teacherId ASC
                    """,
            countQuery = """
                    SELECT COUNT(favorite)
                    FROM StudentFavoriteTeacher favorite
                    JOIN favorite.teacher teacher
                    JOIN teacher.user user
                    WHERE favorite.id.studentId = :studentId
                      AND teacher.isPublic = true
                      AND user.status = :status
                      AND user.role IN :roles
                      AND teacher.subjects IS NOT EMPTY
                    
                      AND NOT EXISTS (
                          SELECT subject
                          FROM TeacherSubject subject
                          WHERE subject.teacherProfile = teacher
                            AND subject.teachingModes IS EMPTY
                      )
                    """
    )
    Page<StudentFavoriteTeacher> findPublicFavorites(
            @Param("studentId") UUID studentId,
            @Param("status") UserStatus status,
            @Param("roles") List<Role> roles,
            Pageable pageable
    );


    @Query(
            value = """
                    SELECT favorite
                    FROM StudentFavoriteTeacher favorite
                    JOIN FETCH favorite.teacher teacher
                    WHERE favorite.id.studentId = :studentId
                    ORDER BY favorite.createdAt DESC,
                             favorite.id.teacherId ASC
                    """,
            countQuery = """
                    SELECT COUNT(favorite)
                    FROM StudentFavoriteTeacher favorite
                    WHERE favorite.id.studentId = :studentId
                    """
    )
    Page<StudentFavoriteTeacher> findAllFavorites(
            @Param("studentId") UUID studentId,
            Pageable pageable
    );


    @Query("""
            SELECT favorite.id.teacherId
            FROM StudentFavoriteTeacher favorite
            WHERE favorite.id.studentId = :studentId
              AND favorite.id.teacherId IN :teacherIds
            """)
    List<UUID> findFavoritedTeacherIds(
            @Param("studentId") UUID studentId,
            @Param("teacherIds") Collection<UUID> teacherIds
    );


    @Modifying
    @Query(
            value = """
                    INSERT INTO student_favorite_teachers (
                        student_id,
                        teacher_id
                    )
                    VALUES (
                        :studentId,
                        :teacherId
                    )
                    ON CONFLICT (student_id, teacher_id)
                    DO NOTHING
                    """,
            nativeQuery = true
    )
    int insertIfNotExists(
            @Param("studentId") UUID studentId,
            @Param("teacherId") UUID teacherId
    );

}
