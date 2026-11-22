package com.unilink.api.service.profile;

import com.unilink.api.entity.ProfilePhoto;
import com.unilink.api.entity.User;
import com.unilink.api.entity.Role;
import com.unilink.api.entity.UserStatus;
import com.unilink.api.repository.TeacherProfileRepository;
import com.unilink.api.exception.custom.InvalidProfilePhotoException;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.repository.ProfilePhotoRepository;
import com.unilink.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProfilePhotoService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final int MAX_IMAGE_DIMENSION = 4096;
    private static final long MAX_IMAGE_PIXELS = 16_000_000L;

    private final ProfilePhotoRepository profilePhotoRepository;
    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    public ProfilePhotoService(
            ProfilePhotoRepository profilePhotoRepository,
            UserRepository userRepository,
            TeacherProfileRepository teacherProfileRepository
    ) {
        this.profilePhotoRepository = profilePhotoRepository;
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
    }

    @Transactional
    public void savePhoto(UUID userId, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new InvalidProfilePhotoException(
                    "A imagem é obrigatória."
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidProfilePhotoException(
                    "A imagem não pode ultrapassar 5 MB."
            );
        }

        byte[] imageBytes;

        try {
            imageBytes = file.getBytes();
        } catch (IOException exception) {
            throw new InvalidProfilePhotoException(
                    "Não foi possível ler a imagem enviada."
            );
        }

        String mimeType = validateAndGetMimeType(imageBytes);

        String base64 = Base64.getEncoder()
                .encodeToString(imageBytes);

        String photoDataUrl = "data:" + mimeType + ";base64," + base64;

        Optional<ProfilePhoto> existingPhoto =
                profilePhotoRepository.findById(userId);

        ProfilePhoto profilePhoto;

        if (existingPhoto.isPresent()) {

            profilePhoto = existingPhoto.get();
            profilePhoto.changePhoto(photoDataUrl);

        } else {

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuário não encontrado."
                    ));

            profilePhoto = new ProfilePhoto(user, photoDataUrl);
        }

        profilePhotoRepository.save(profilePhoto);
    }

    @Transactional(readOnly = true)
    public Optional<String> getPhoto(UUID userId) {

        return profilePhotoRepository.findById(userId)
                .map(ProfilePhoto::getPhoto);
    }

    @Transactional(readOnly = true)
    public String getPublicTeacherPhoto(UUID teacherId) {

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Professor não encontrado."
                ));

        boolean hasTeacherProfile =
                teacher.getRole() == Role.TEACHER
                        || teacher.getRole() == Role.STUDENT_TEACHER;

        if (teacher.getStatus() != UserStatus.ACTIVE
                || !hasTeacherProfile
                || !teacherProfileRepository.existsById(teacherId)) {

            throw new ResourceNotFoundException(
                    "Professor não encontrado."
            );
        }

        return profilePhotoRepository.findById(teacherId)
                .map(ProfilePhoto::getPhoto)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Foto de perfil não encontrada."
                ));
    }

    @Transactional
    public void deletePhoto(UUID userId) {

        profilePhotoRepository.deleteById(userId);
    }

    private String validateAndGetMimeType(byte[] imageBytes) {

        try (
                ImageInputStream imageInputStream =
                        ImageIO.createImageInputStream(
                                new ByteArrayInputStream(imageBytes)
                        )
        ) {

            if (imageInputStream == null) {
                throw new InvalidProfilePhotoException(
                        "Imagem inválida."
                );
            }

            Iterator<ImageReader> readers =
                    ImageIO.getImageReaders(imageInputStream);

            if (!readers.hasNext()) {
                throw new InvalidProfilePhotoException(
                        "O arquivo enviado não é uma imagem válida."
                );
            }

            ImageReader reader = readers.next();

            try {

                reader.setInput(imageInputStream, true, true);

                String format = reader.getFormatName()
                        .toLowerCase(Locale.ROOT);

                String mimeType = switch (format) {
                    case "jpeg", "jpg" -> "image/jpeg";
                    case "png" -> "image/png";
                    default -> null;
                };

                if (mimeType == null) {
                    throw new InvalidProfilePhotoException(
                            "Formato não permitido. Utilize JPEG ou PNG."
                    );
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0
                        || width > MAX_IMAGE_DIMENSION
                        || height > MAX_IMAGE_DIMENSION
                        || (long) width * height > MAX_IMAGE_PIXELS) {

                    throw new InvalidProfilePhotoException(
                            "A resolução da imagem ultrapassa o limite permitido."
                    );
                }

                reader.read(0);

                return mimeType;

            } finally {
                reader.dispose();
            }

        } catch (IOException exception) {
            throw new InvalidProfilePhotoException(
                    "Não foi possível processar a imagem."
            );
        }
    }
}