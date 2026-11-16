
package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "teacher_subjects")
public class TeacherSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private TeacherProfile teacherProfile;

    @Column(nullable = false, length = 100)
    private String subject;

    protected TeacherSubject() {
    }

    public TeacherSubject(TeacherProfile teacherProfile, String subject) {
        this.teacherProfile = teacherProfile;
        this.subject = subject;
    }

    public UUID getId() {
        return id;
    }

    public TeacherProfile getTeacherProfile() {
        return teacherProfile;
    }

    public String getSubject() {
        return subject;
    }

    public void changeSubject(String subject) {
        this.subject = subject;
    }
}
