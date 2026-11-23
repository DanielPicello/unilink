package com.unilink.api.service.profile;

import com.unilink.api.dto.profile.request.UpdatePersonalProfileRequest;
import com.unilink.api.dto.profile.request.UpdateStudentProfileRequest;
import com.unilink.api.dto.profile.request.UpdateTeacherProfileRequest;
import com.unilink.api.dto.profile.request.UpdateCompanyProfileRequest;
import com.unilink.api.entity.PersonalProfile;
import com.unilink.api.entity.StudentProfile;
import com.unilink.api.entity.TeacherProfile;
import com.unilink.api.entity.TeacherSubject;
import com.unilink.api.entity.Company;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.exception.custom.CnpjAlreadyExistsException;
import com.unilink.api.repository.PersonalProfileRepository;
import com.unilink.api.repository.StudentProfileRepository;
import com.unilink.api.repository.TeacherProfileRepository;
import com.unilink.api.repository.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.unilink.api.dto.profile.request.AddTeacherProfileRequest;
import com.unilink.api.entity.User;
import com.unilink.api.entity.Role;
import com.unilink.api.exception.custom.InvalidAccountRoleException;
import com.unilink.api.repository.UserRepository;
import com.unilink.api.dto.profile.request.AddStudentProfileRequest;
import com.unilink.api.dto.profile.request.UpdateTeacherSubjectModesRequest;
import com.unilink.api.entity.TeachingMode;
import com.unilink.api.dto.profile.request.UpdateTeacherVisibilityRequest;
import com.unilink.api.entity.UserStatus;
import com.unilink.api.exception.custom.AccountSuspendedException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProfileService {
    private final PersonalProfileRepository personalProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public ProfileService(
            PersonalProfileRepository personalProfileRepository,
            StudentProfileRepository studentProfileRepository,
            TeacherProfileRepository teacherProfileRepository,
            CompanyRepository companyRepository,
            UserRepository userRepository
    ) {
        this.personalProfileRepository = personalProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void updatePersonalProfile(
            UUID userId,
            UpdatePersonalProfileRequest request
    ) {
        PersonalProfile profile = personalProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil pessoal não encontrado."
                ));
        profile.changeFullName(request.fullName());
        profile.changeBio(request.bio());

        personalProfileRepository.save(profile);
    }

    @Transactional
    public void updateStudentProfile(
            UUID userId,
            UpdateStudentProfileRequest request
    ) {
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de estudante não encontrado."
                ));
        profile.changeEducationLevel(request.educationLevel());
        profile.changeCity(request.city());

        studentProfileRepository.save(profile);
    }


    @Transactional
    public void updateTeacherProfile(
            UUID userId,
            UpdateTeacherProfileRequest request
    ) {
        TeacherProfile profile = teacherProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de professor não encontrado."
                ));

        profile.changeUniversity(request.university());
        profile.changeCourse(request.course());
        profile.changePeriod(request.period());
        profile.changeHourlyRate(request.hourlyRate());
        profile.changeCity(request.city());

        Map<String, TeacherSubject> existingSubjects = new HashMap<>();

        for (TeacherSubject subject : profile.getSubjects()) {
            String key = subject.getSubject()
                    .trim()
                    .toLowerCase(Locale.ROOT);

            existingSubjects.put(key, subject);
        }

        Set<String> requestedSubjects = new HashSet<>();

        for (String subjectName : request.subjects()) {
            requestedSubjects.add(
                    subjectName.trim().toLowerCase(Locale.ROOT)
            );
        }

        profile.getSubjects().removeIf(subject -> {
            String key = subject.getSubject()
                    .trim()
                    .toLowerCase(Locale.ROOT);

            return !requestedSubjects.contains(key);
        });

        for (String subjectName : request.subjects()) {
            String normalizedName = subjectName.trim();

            String key = normalizedName.toLowerCase(Locale.ROOT);

            TeacherSubject existingSubject = existingSubjects.get(key);

            if (existingSubject != null) {
                existingSubject.changeSubject(normalizedName);
            } else {
                TeacherSubject newSubject = new TeacherSubject(
                        profile,
                        normalizedName
                );

                profile.getSubjects().add(newSubject);
                existingSubjects.put(key, newSubject);
            }
        }

        teacherProfileRepository.save(profile);
    }


    @Transactional
    public void updateTeacherSubjectModes(
            UUID userId,
            UpdateTeacherSubjectModesRequest request
    ) {
        TeacherProfile profile = teacherProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de professor não encontrado."
                ));

        Map<UUID, TeacherSubject> existingSubjects = new HashMap<>();

        for (TeacherSubject subject : profile.getSubjects()) {
            existingSubjects.put(subject.getId(), subject);
        }

        if (request.subjects() == null
                || request.subjects().size() != existingSubjects.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "É necessário configurar todas as matérias do professor."
            );
        }

        Map<UUID, Set<TeachingMode>> requestedModes = new HashMap<>();

        for (var item : request.subjects()) {

            if (item == null || item.id() == null
                    || !existingSubjects.containsKey(item.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Uma das matérias informadas é inválida ou não pertence ao professor."
                );
            }

            if (item.teachingModes() == null
                    || item.teachingModes().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cada matéria deve possuir pelo menos uma modalidade."
                );
            }

            Set<TeachingMode> modes = new HashSet<>(item.teachingModes());

            if (modes.contains(null)
                    || modes.size() != item.teachingModes().size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "As modalidades de uma matéria devem ser válidas e não podem estar duplicadas."
                );
            }

            if (requestedModes.putIfAbsent(item.id(), modes) != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Uma matéria foi informada mais de uma vez."
                );
            }
        }

        for (Map.Entry<UUID, Set<TeachingMode>> entry : requestedModes.entrySet()) {
            TeacherSubject subject = existingSubjects.get(entry.getKey());
            subject.replaceTeachingModes(entry.getValue());
        }
    }


    @Transactional
    public void updateTeacherVisibility(
            UUID userId,
            UpdateTeacherVisibilityRequest request
    ) {
        TeacherProfile profile = teacherProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de professor não encontrado."
                ));

        if (request.isPublic()) {

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Usuário não encontrado."
                    ));

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new AccountSuspendedException(
                        "Contas suspensas não podem publicar o perfil."
                );
            }

            if (profile.getSubjects().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cadastre pelo menos uma matéria antes de publicar o perfil."
                );
            }

            boolean hasUnconfiguredSubjects = profile.getSubjects()
                    .stream()
                    .anyMatch(subject ->
                            subject.getTeachingModes().isEmpty()
                    );

            if (hasUnconfiguredSubjects) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Configure as modalidades de todas as matérias antes de publicar o perfil."
                );
            }
        }

        profile.changeVisibility(request.isPublic());
    }


    @Transactional
    public void updateCompanyProfile(
            UUID userId,
            UpdateCompanyProfileRequest request
    ) {
        Company company = companyRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de empresa não encontrado."
                ));
        if (!company.getCnpj().equals(request.cnpj())
                && companyRepository.existsByCnpj(request.cnpj())) {
            throw new CnpjAlreadyExistsException(
                    "Este CNPJ já está cadastrado."
            );
        }
        String website = request.website();
        if (website != null && website.isBlank()) {
            website = null;
        }
        company.changeCompanyName(request.companyName());
        company.changeCnpj(request.cnpj());
        company.changeSector(request.sector());
        company.changeWebsite(website);
        company.changeCompanySize(request.companySize());
        company.changeBio(request.bio());
        company.changeCity(request.city());

        companyRepository.save(company);
    }

    @Transactional
    public void addTeacherProfile(
            UUID userId,
            AddTeacherProfileRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));
        if (user.getRole() != Role.STUDENT) {
            throw new InvalidAccountRoleException(
                    "Somente contas de estudante podem adicionar um perfil de professor."
            );
        }
        TeacherProfile profile = new TeacherProfile(
                user,
                request.university(),
                request.course(),
                request.period(),
                request.hourlyRate(),
                request.city()
        );
        for (String subject : request.subjects()) {
            profile.getSubjects().add(
                    new TeacherSubject(profile, subject)
            );
        }
        teacherProfileRepository.save(profile);
        user.changeRole(Role.STUDENT_TEACHER);
        userRepository.save(user);
    }

    @Transactional
    public void addStudentProfile(
            UUID userId,
            AddStudentProfileRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));
        if (user.getRole() != Role.TEACHER) {
            throw new InvalidAccountRoleException(
                    "Somente contas de professor podem adicionar um perfil de estudante."
            );
        }
        StudentProfile profile = new StudentProfile(
                user,
                request.educationLevel(),
                request.city()
        );
        studentProfileRepository.save(profile);
        user.changeRole(Role.STUDENT_TEACHER);

        userRepository.save(user);
    }

    @Transactional
    public void removeTeacherProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));
        if (user.getRole() != Role.STUDENT_TEACHER) {
            throw new InvalidAccountRoleException(
                    "Somente contas com perfil de estudante e professor podem remover o perfil de professor."
            );
        }
        TeacherProfile profile = teacherProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de professor não encontrado."
                ));
        teacherProfileRepository.delete(profile);
        user.changeRole(Role.STUDENT);

        userRepository.save(user);
    }

    @Transactional
    public void removeStudentProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));
        if (user.getRole() != Role.STUDENT_TEACHER) {
            throw new InvalidAccountRoleException(
                    "Somente contas com perfil de estudante e professor podem remover o perfil de estudante."
            );
        }
        StudentProfile profile = studentProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Perfil de estudante não encontrado."
                ));
        studentProfileRepository.delete(profile);
        user.changeRole(Role.TEACHER);

        userRepository.save(user);
    }
}
