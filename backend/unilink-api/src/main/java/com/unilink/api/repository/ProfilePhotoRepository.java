package com.unilink.api.repository;

import com.unilink.api.entity.ProfilePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProfilePhotoRepository extends JpaRepository<ProfilePhoto, UUID> {
}