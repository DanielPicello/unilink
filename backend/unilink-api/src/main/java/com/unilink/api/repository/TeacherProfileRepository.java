package com.unilink.api.repository;

import com.unilink.api.entity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, UUID> {
}