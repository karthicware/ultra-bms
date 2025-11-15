package com.ultrabms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lead entity representing potential tenant leads
 */
@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_number", unique = true, nullable = false, length = 50)
    private String leadNumber;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "emirates_id", nullable = false, length = 50)
    private String emiratesId;

    @Column(name = "passport_number", nullable = false, length = 50)
    private String passportNumber;

    @Column(name = "passport_expiry_date", nullable = false)
    private LocalDate passportExpiryDate;

    @Column(name = "home_country", nullable = false, length = 100)
    private String homeCountry;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "contact_number", nullable = false, length = 20)
    private String contactNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", nullable = false, length = 20)
    private LeadSource leadSource;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LeadStatus status;

    @Column(name = "property_interest", length = 255)
    private String propertyInterest;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = LeadStatus.NEW;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum LeadStatus {
        NEW,
        CONTACTED,
        QUOTATION_SENT,
        ACCEPTED,
        CONVERTED,
        LOST
    }

    public enum LeadSource {
        WEBSITE,
        REFERRAL,
        WALK_IN,
        PHONE_CALL,
        SOCIAL_MEDIA,
        OTHER
    }
}
