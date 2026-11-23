package com.unilink.api.repository;

import com.unilink.api.entity.ProfilePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProfilePhotoRepository
        extends JpaRepository<ProfilePhoto, UUID> {

    @Query("""
            SELECT photo.id
            FROM ProfilePhoto photo
            WHERE photo.id IN :userIds
            """)
    List<UUID> findExistingPhotoIds(
            @Param("userIds") Collection<UUID> userIds
    );
}
