package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "profile_photos")
public class ProfilePhoto {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "photo", nullable = false, columnDefinition = "TEXT")
    private String photo;

    protected ProfilePhoto() {
    }

    public ProfilePhoto(User user, String photo) {
        this.user = user;
        this.photo = photo;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getPhoto() {
        return photo;
    }

    public void changePhoto(String photo) {
        this.photo = photo;
    }
}