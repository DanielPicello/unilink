package com.unilink.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "student_favorite_teachers")
public class StudentFavoriteTeacher {

    @EmbeddedId
    private StudentFavoriteTeacherId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("teacherId")
    @JoinColumn(name = "teacher_id", nullable = false)
    private TeacherProfile teacher;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    protected StudentFavoriteTeacher() {
    }

    public StudentFavoriteTeacher(
            StudentProfile student,
            TeacherProfile teacher
    ) {
        this.student = student;
        this.teacher = teacher;

        this.id = new StudentFavoriteTeacherId(
                student.getId(),
                teacher.getId()
        );
    }

    public StudentFavoriteTeacherId getId() {
        return id;
    }

    public StudentProfile getStudent() {
        return student;
    }

    public TeacherProfile getTeacher() {
        return teacher;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
