
package com.unilink.api.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "teacher_profiles")
public class TeacherProfile {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String university;

    @Column(nullable = false, length = 150)
    private String course;

    @Column(name = "period", nullable = false, length = 50)
    private String period;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "city", length = 120)
    private String city;

    @OneToMany(
            mappedBy = "teacherProfile",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<TeacherSubject> subjects = new ArrayList<>();

    protected TeacherProfile() {
    }

    public TeacherProfile(
            User user,
            String university,
            String course,
            String period,
            BigDecimal hourlyRate,
            String city
    ) {
        this.user = user;
        this.university = university;
        this.course = course;
        this.period = period;
        this.hourlyRate = hourlyRate;
        this.city = city;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getUniversity() {
        return university;
    }

    public String getCourse() {
        return course;
    }

    public String getPeriod() {
        return period;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public String getCity() {
        return city;
    }

    public List<TeacherSubject> getSubjects() {
        return subjects;
    }

    public void changeUniversity(String university) {
        this.university = university;
    }

    public void changeCourse(String course) {
        this.course = course;
    }

    public void changePeriod(String period) {
        this.period = period;
    }

    public void changeHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public void changeCity(String city) {
        this.city = city;
    }
}
