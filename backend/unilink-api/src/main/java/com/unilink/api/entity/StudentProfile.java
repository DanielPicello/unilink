
package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "education_level", nullable = false, length = 80)
    private String educationLevel;

    @Column(name = "city", length = 120)
    private String city;

    protected StudentProfile() {
    }

    public StudentProfile(User user, String educationLevel, String city) {
        this.user = user;
        this.educationLevel = educationLevel;
        this.city = city;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getEducationLevel() {
        return educationLevel;
    }

    public String getCity() {
        return city;
    }

    public void changeEducationLevel(String educationLevel) {
        this.educationLevel = educationLevel;
    }

    public void changeCity(String city) {
        this.city = city;
    }
}
