package com.unilink.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class StudentFavoriteTeacherId implements Serializable {

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    protected StudentFavoriteTeacherId() {
    }

    public StudentFavoriteTeacherId(
            UUID studentId,
            UUID teacherId
    ) {
        this.studentId = studentId;
        this.teacherId = teacherId;
    }

    public UUID getStudentId() {
        return studentId;
    }

    public UUID getTeacherId() {
        return teacherId;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (!(object instanceof StudentFavoriteTeacherId other)) {
            return false;
        }

        return Objects.equals(studentId, other.studentId)
                && Objects.equals(teacherId, other.teacherId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, teacherId);
    }
}
