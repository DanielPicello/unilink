package com.unilink.api.repository;

import com.unilink.api.entity.PersonalProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PersonalProfileRepository extends JpaRepository<PersonalProfile, UUID> {
}
