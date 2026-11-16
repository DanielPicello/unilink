
package com.unilink.api.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @Column(name = "user_id")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(nullable = false, length = 100)
    private String sector;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "size", nullable = false, length = 50)
    private String companySize;

    @Column(name = "bio", nullable = false, columnDefinition = "TEXT")
    private String bio;

    @Column(name = "city", length = 120)
    private String city;

    protected Company() {
    }

    public Company(
            User user,
            String companyName,
            String cnpj,
            String sector,
            String website,
            String companySize,
            String bio,
            String city
    ) {
        this.user = user;
        this.companyName = companyName;
        this.cnpj = cnpj;
        this.sector = sector;
        this.website = website;
        this.companySize = companySize;
        this.bio = bio;
        this.city = city;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getCnpj() {
        return cnpj;
    }

    public String getSector() {
        return sector;
    }

    public String getWebsite() {
        return website;
    }

    public String getCompanySize() {
        return companySize;
    }

    public String getBio() {
        return bio;
    }

    public String getCity() {
        return city;
    }

    public void changeCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public void changeCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public void changeSector(String sector) {
        this.sector = sector;
    }

    public void changeWebsite(String website) {
        this.website = website;
    }

    public void changeCompanySize(String companySize) {
        this.companySize = companySize;
    }

    public void changeBio(String bio) {
        this.bio = bio;
    }

    public void changeCity(String city) {
        this.city = city;
    }
}
