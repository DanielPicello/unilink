package com.unilink.api.service.auth;

import com.unilink.api.dto.auth.request.RegisterStudentRequest;
import com.unilink.api.dto.auth.response.AuthResponse;
import com.unilink.api.entity.User;
import com.unilink.api.entity.PersonalProfile;
import com.unilink.api.entity.StudentProfile;
import com.unilink.api.entity.Role;
import com.unilink.api.repository.UserRepository;
import com.unilink.api.repository.PersonalProfileRepository;
import com.unilink.api.repository.StudentProfileRepository;
import com.unilink.api.repository.TeacherProfileRepository;
import com.unilink.api.repository.CompanyRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.unilink.api.dto.auth.request.RegisterTeacherRequest;
import com.unilink.api.entity.TeacherProfile;
import com.unilink.api.entity.TeacherSubject;
import com.unilink.api.dto.auth.request.RegisterCompanyRequest;
import com.unilink.api.entity.Company;
import com.unilink.api.dto.auth.request.LoginRequest;
import com.unilink.api.entity.UserStatus;
import com.unilink.api.dto.auth.response.CurrentUserResponse;
import com.unilink.api.dto.auth.response.PersonalProfileResponse;
import com.unilink.api.dto.auth.response.StudentProfileResponse;
import com.unilink.api.dto.auth.response.TeacherProfileResponse;
import com.unilink.api.dto.auth.response.CompanyProfileResponse;
import com.unilink.api.exception.custom.InvalidCredentialsException;
import com.unilink.api.exception.custom.EmailAlreadyExistsException;
import com.unilink.api.exception.custom.CnpjAlreadyExistsException;
import com.unilink.api.exception.custom.AccountSuspendedException;
import com.unilink.api.exception.custom.ResourceNotFoundException;
import com.unilink.api.dto.account.request.ChangePasswordRequest;
import com.unilink.api.dto.account.request.DeleteAccountRequest;

import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PersonalProfileRepository personalProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PersonalProfileRepository personalProfileRepository,
            StudentProfileRepository studentProfileRepository,
            TeacherProfileRepository teacherProfileRepository,
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.personalProfileRepository = personalProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse registerStudent(RegisterStudentRequest request) {

        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new EmailAlreadyExistsException("E-mail já cadastrado.");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.email().trim(),
                passwordHash,
                Role.STUDENT
        );

        User savedUser = userRepository.save(user);

        PersonalProfile personalProfile = new PersonalProfile(
                savedUser,
                request.fullName(),
                request.bio()
        );

        personalProfileRepository.save(personalProfile);

        StudentProfile studentProfile = new StudentProfile(
                savedUser,
                request.educationLevel(),
                request.city()
        );

        studentProfileRepository.save(studentProfile);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                personalProfile.getFullName()
        );
    }

    @Transactional
    public AuthResponse registerTeacher(RegisterTeacherRequest request) {

        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new EmailAlreadyExistsException("E-mail já cadastrado.");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.email().trim(),
                passwordHash,
                Role.TEACHER
        );

        User savedUser = userRepository.save(user);

        PersonalProfile personalProfile = new PersonalProfile(
                savedUser,
                request.fullName(),
                request.bio()
        );

        personalProfileRepository.save(personalProfile);

        TeacherProfile teacherProfile = new TeacherProfile(
                savedUser,
                request.university(),
                request.course(),
                request.period(),
                request.hourlyRate(),
                request.city()
        );

        request.subjects().forEach(subject ->
                teacherProfile.getSubjects().add(
                        new TeacherSubject(teacherProfile, subject)
                )
        );

        teacherProfileRepository.save(teacherProfile);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                personalProfile.getFullName()
        );
    }

    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw new EmailAlreadyExistsException("E-mail já cadastrado.");
        }

        if (companyRepository.existsByCnpj(request.cnpj().trim())) {
            throw new CnpjAlreadyExistsException("CNPJ já cadastrado.");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.email().trim(),
                passwordHash,
                Role.COMPANY
        );

        User savedUser = userRepository.save(user);

        String website = request.website() == null
                || request.website().isBlank()
                ? null
                : request.website().trim();

        Company company = new Company(
                savedUser,
                request.companyName(),
                request.cnpj().trim(),
                request.sector(),
                website,
                request.companySize(),
                request.bio(),
                request.city()
        );

        companyRepository.save(company);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                company.getCompanyName()
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() ->
                        new InvalidCredentialsException("E-mail ou senha inválidos.")
                );

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException("E-mail ou senha inválidos.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccountSuspendedException("Conta suspensa.");
        }

        String displayName;

        if (user.getRole() == Role.COMPANY) {

            Company company = companyRepository.findById(user.getId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Perfil da empresa não encontrado.")
                    );

            displayName = company.getCompanyName();

        } else if (user.getRole() == Role.ADMIN) {

            displayName = user.getEmail();

        } else {

            PersonalProfile personalProfile =
                    personalProfileRepository.findById(user.getId())
                            .orElseThrow(() ->
                                    new ResourceNotFoundException("Perfil pessoal não encontrado.")
                            );

            displayName = personalProfile.getFullName();
        }

        user.recordLogin();

        userRepository.save(user);

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                displayName
        );
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Usuário não encontrado.")
                );

        PersonalProfileResponse personalProfileResponse = null;
        StudentProfileResponse studentProfileResponse = null;
        TeacherProfileResponse teacherProfileResponse = null;
        CompanyProfileResponse companyProfileResponse = null;

        if (user.getRole() == Role.COMPANY) {

            Company company = companyRepository.findById(userId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Perfil da empresa não encontrado.")
                    );

            companyProfileResponse = new CompanyProfileResponse(
                    company.getCompanyName(),
                    company.getCnpj(),
                    company.getSector(),
                    company.getWebsite(),
                    company.getCompanySize(),
                    company.getBio(),
                    company.getCity()
            );

        } else if (user.getRole() != Role.ADMIN) {

            PersonalProfile personalProfile =
                    personalProfileRepository.findById(userId)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException("Perfil pessoal não encontrado.")
                            );

            personalProfileResponse = new PersonalProfileResponse(
                    personalProfile.getFullName(),
                    personalProfile.getBio()
            );

            if (user.getRole() == Role.STUDENT
                    || user.getRole() == Role.STUDENT_TEACHER) {

                StudentProfile studentProfile =
                        studentProfileRepository.findById(userId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException("Perfil de estudante não encontrado.")
                                );

                studentProfileResponse = new StudentProfileResponse(
                        studentProfile.getEducationLevel(),
                        studentProfile.getCity()
                );
            }

            if (user.getRole() == Role.TEACHER
                    || user.getRole() == Role.STUDENT_TEACHER) {

                TeacherProfile teacherProfile =
                        teacherProfileRepository.findById(userId)
                                .orElseThrow(() ->
                                        new ResourceNotFoundException("Perfil de professor não encontrado.")
                                );

                teacherProfileResponse = new TeacherProfileResponse(
                        teacherProfile.getUniversity(),
                        teacherProfile.getCourse(),
                        teacherProfile.getPeriod(),
                        teacherProfile.getHourlyRate(),
                        teacherProfile.getCity(),
                        teacherProfile.getSubjects()
                                .stream()
                                .map(subject -> subject.getSubject())
                                .toList()
                );
            }
        }

        return new CurrentUserResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                personalProfileResponse,
                studentProfileResponse,
                teacherProfileResponse,
                companyProfileResponse
        );
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Senha atual incorreta.");
        }
        String newPasswordHash = passwordEncoder.encode(request.newPassword());
        user.changePassword(newPasswordHash);

        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(
            UUID userId,
            DeleteAccountRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário não encontrado."
                ));
        if (!passwordEncoder.matches(
                request.currentPassword(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException(
                    "Senha atual incorreta."
            );
        }

        userRepository.delete(user);
    }
}
