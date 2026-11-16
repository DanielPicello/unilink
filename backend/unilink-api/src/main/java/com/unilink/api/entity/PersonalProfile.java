package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "personal_profiles")
public class PersonalProfile {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "bio", nullable = false, columnDefinition = "TEXT")
    private String bio;

    protected PersonalProfile() {
    }

    public PersonalProfile(User user, String fullName, String bio) {
        this.user = user;
        this.fullName = fullName;
        this.bio = bio;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getFullName() {
        return fullName;
    }

    public String getBio() {
        return bio;
    }

    public void changeFullName(String fullName) {
        this.fullName = fullName;
    }

    public void changeBio(String bio) {
        this.bio = bio;
    }
}
