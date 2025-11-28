package com.ultrabms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Company profile entity for managing organization details.
 * Single-record design - only one company profile allowed in the system.
 * Used for invoice headers, PDC holder field, email signatures, and official documents.
 *
 * Story 2.8: Company Profile Settings
 */
@Entity
@Table(name = "company_profile", indexes = {
    @Index(name = "idx_company_profile_trn", columnList = "trn")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfile {

    /**
     * Primary key using UUID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Legal company name as registered
     */
    @NotBlank(message = "Legal company name is required")
    @Size(max = 255, message = "Legal company name must not exceed 255 characters")
    @Column(name = "legal_company_name", nullable = false, length = 255)
    private String legalCompanyName;

    /**
     * Company physical address
     */
    @NotBlank(message = "Company address is required")
    @Size(max = 500, message = "Company address must not exceed 500 characters")
    @Column(name = "company_address", nullable = false, length = 500)
    private String companyAddress;

    /**
     * City where company is located
     */
    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    @Column(name = "city", nullable = false, length = 100)
    private String city;

    /**
     * Country where company is registered (default: United Arab Emirates)
     */
    @NotBlank(message = "Country is required")
    @Size(max = 100, message = "Country must not exceed 100 characters")
    @Column(name = "country", nullable = false, length = 100)
    private String country = "United Arab Emirates";

    /**
     * UAE Tax Registration Number (TRN) - 15 digits starting with 100
     */
    @NotBlank(message = "TRN is required")
    @Pattern(regexp = "^100\\d{12}$", message = "TRN must be 15 digits starting with 100")
    @Column(name = "trn", nullable = false, unique = true, length = 15)
    private String trn;

    /**
     * Official phone number in UAE format (+971 followed by 9 digits)
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+971\\d{9}$", message = "Phone number must be in UAE format (+971XXXXXXXXX)")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    /**
     * Official email address
     */
    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be valid")
    @Size(max = 255, message = "Email address must not exceed 255 characters")
    @Column(name = "email_address", nullable = false, length = 255)
    private String emailAddress;

    /**
     * S3 key for company logo file (nullable)
     */
    @Size(max = 500, message = "Logo file path must not exceed 500 characters")
    @Column(name = "logo_file_path", length = 500)
    private String logoFilePath;

    /**
     * Reference to user who last updated this profile
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    /**
     * Timestamp when the profile was last updated
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Version field for optimistic locking
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
