package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;
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

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "teacher_subject_modes",
            joinColumns = @JoinColumn(name = "teacher_subject_id")
    )
    @Column(name = "teaching_mode", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Set<TeachingMode> teachingModes = new HashSet<>();

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

    public Set<TeachingMode> getTeachingModes() {
        return teachingModes;
    }

    public void changeSubject(String subject) {
        this.subject = subject;
    }

    public void replaceTeachingModes(Set<TeachingMode> teachingModes) {
        this.teachingModes.clear();
        this.teachingModes.addAll(teachingModes);
    }
}
