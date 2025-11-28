package com.ultrabms.dto.settings;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating or updating company profile.
 * Contains all fields with validation annotations.
 *
 * Story 2.8: Company Profile Settings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfileRequest {

    /**
     * Legal company name as registered
     */
    @NotBlank(message = "Legal company name is required")
    @Size(max = 255, message = "Legal company name must not exceed 255 characters")
    private String legalCompanyName;

    /**
     * Company physical address
     */
    @NotBlank(message = "Company address is required")
    @Size(max = 500, message = "Company address must not exceed 500 characters")
    private String companyAddress;

    /**
     * City where company is located
     */
    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    /**
     * Country where company is registered (default: United Arab Emirates)
     */
    @NotBlank(message = "Country is required")
    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    /**
     * UAE Tax Registration Number (TRN) - 15 digits starting with 100
     */
    @NotBlank(message = "TRN is required")
    @Pattern(regexp = "^100\\d{12}$", message = "TRN must be 15 digits starting with 100")
    private String trn;

    /**
     * Official phone number in UAE format (+971 followed by 9 digits)
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+971\\d{9}$", message = "Phone number must be in UAE format (+971XXXXXXXXX)")
    private String phoneNumber;

    /**
     * Official email address
     */
    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be valid")
    @Size(max = 255, message = "Email address must not exceed 255 characters")
    private String emailAddress;
}
