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
        profile.getSubjects().clear();
        teacherProfileRepository.flush();
        for (String subject : request.subjects()) {
            profile.getSubjects().add(
                    new TeacherSubject(profile, subject)
            );
        }

        teacherProfileRepository.save(profile);
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
